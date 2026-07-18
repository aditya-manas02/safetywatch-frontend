import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import Navbar from "./components/Navbar";
import { useLocation, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ChatBot from "./components/ChatBot";
import AnimatedBackground from "./components/AnimatedBackground";
import { lazy, Suspense, useEffect, useState, useCallback, useRef } from "react";
import { SplashScreen } from "@capacitor/splash-screen";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { Camera } from "@capacitor/camera";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SafetyWatchLoader } from "./components/SafetyWatchLoader";
import { SecurityUpdatePanel } from "./components/SecurityUpdatePanel";
import { AreaCodeSelector } from "./components/AreaCodeSelector";
import { SuspensionModal } from "./components/SuspensionModal";
import { Megaphone, X, Bell, ShieldAlert } from "lucide-react";
import SOSAlert from "./components/SOSAlert";
import AppTour from "./components/AppTour";
import ScrollToTop from "./components/ScrollToTop";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { ThemeProvider } from "./components/ThemeProvider";
import MobileBottomNav from "./components/MobileBottomNav";
import GuardianMode from "./components/GuardianMode";
import ReportForm from "./components/ReportForm";
import { AnimatePresence, motion } from "framer-motion";
import IosInstallPrompt from "./components/IosInstallPrompt";

// Wrapper to handle Vite dynamic import failures after deployments
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error: any) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload() as any;
      }
      throw error;
    }
  });

// Lazy load pages for performance
const Index = lazyWithRetry(() => import("./pages/Index"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Inbox = lazyWithRetry(() => import("./pages/Inbox"));
const Support = lazyWithRetry(() => import("./pages/Support"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const Leaderboard = lazyWithRetry(() => import("./pages/Leaderboard"));
const Achievements = lazyWithRetry(() => import("./pages/Achievements"));
const Circles = lazyWithRetry(() => import("./pages/Circles"));
const CircleDetails = lazyWithRetry(() => import("./pages/CircleDetails"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const Maintenance = lazyWithRetry(() => import("./pages/Maintenance"));
const FeedPage = lazyWithRetry(() => import("./pages/FeedPage"));



const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hideNavbar = ["/admin", "/auth", "/maintenance"].some(path => location.pathname.startsWith(path));

  const { isLoading, user, token, refreshUser, signOut, isSuperAdmin } = useAuth();
  const [minLoadTimePassed, setMinLoadTimePassed] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [preAlert, setPreAlert] = useState<{
    active: boolean;
    message: string;
    start: string | null;
    end: string | null;
  } | null>(null);
  const [activeSOS, setActiveSOS] = useState<{
    incidentId: string;
    userName: string;
    latitude: number;
    longitude: number;
    status?: string;
  } | null>(null);

  // --- Notification Permission State ---
  const [notifPermission, setNotifPermission] = useState<string>("loading");

  // --- Global Mobile State ---
  const [showGlobalReportForm, setShowGlobalReportForm] = useState(false);

  // --- Modals Browser History Sync ---
  const openGlobalReportForm = () => {
    if (!showGlobalReportForm) {
      window.history.pushState({ modalOpen: 'report' }, '');
      setShowGlobalReportForm(true);
    }
  };

  const closeGlobalReportForm = () => {
    setShowGlobalReportForm(false);
    if (window.history.state?.modalOpen === 'report') {
      window.history.back();
    }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (showGlobalReportForm) setShowGlobalReportForm(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showGlobalReportForm]);

  const handleGlobalReportSubmit = async (report: any) => {
    let imageUrl: string | null = null;
    if (report.imageFile) {
      const form = new FormData();
      form.append("image", report.imageFile);
      try {
        const token = localStorage.getItem("token");
        const uploadResp = await fetch(`${API_BASE}/upload`, {
          method: "POST",
          headers: getAuthHeaders(token),
          body: form,
        });
        const uploadData = await uploadResp.json();
        imageUrl = uploadData.url || uploadData.imageUrl || null;
      } catch (err: any) {
        throw new Error(err.message || "Upload failed");
      }
    }

    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(`${API_BASE}/incidents`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ ...report, imageUrl }),
      });
      if (!resp.ok) throw new Error("Failed to submit");
      toast({ title: "Success", description: "Incident reported successfully" });
      closeGlobalReportForm();
      
      // Dispatch an event so components like DashboardStats can refetchtive
      window.dispatchEvent(new CustomEvent("report_submitted"));
    } catch (err: any) {
      throw err;
    }
  };

  useEffect(() => {
    const checkPerms = async () => {
      // Check if user already moved past the setup screen
      const setupDone = localStorage.getItem("notif_setup_complete") === "true";
      
      if (Capacitor.isNativePlatform()) {
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");
          const { LocalNotifications } = await import("@capacitor/local-notifications");
          
          // CRITICAL: Create Android Notification Channel for High Importance
          await LocalNotifications.createChannel({
            id: 'safetywatch-alerts',
            name: 'SafetyWatch Emergency Alerts',
            description: 'Critical SOS and safety notifications',
            importance: 5, // High
            visibility: 1, // Public
            vibration: true,
            sound: 'alert.wav'
          });
          
          const status = await PushNotifications.checkPermissions();
          console.log("[FCM] Native permission status:", status.receive);
          
          if (setupDone && status.receive === "prompt") {
            setNotifPermission("dismissed"); // User already saw modal, hide it
          } else {
            setNotifPermission(status.receive);
          }
        } catch (e) {
          console.warn("[FCM] Failed to check native permissions:", e);
          setNotifPermission(setupDone ? "dismissed" : "default");
        }
      } else if (typeof Notification !== "undefined") {
        console.log("[FCM] Web permission status:", Notification.permission);
        if (setupDone && Notification.permission === "default") {
          setNotifPermission("dismissed");
        } else {
          setNotifPermission(Notification.permission);
        }
      } else {
        setNotifPermission("granted");
      }
    };
    checkPerms();

    // Listen for global open-report-form events
    const handleOpenReport = () => openGlobalReportForm();
    window.addEventListener("open-report-form", handleOpenReport);
    
    return () => {
      window.removeEventListener("open-report-form", handleOpenReport);
    };
  }, []);

  // Check if user needs to set area code (not superadmin and hasAreaCode is false)
  const needsAreaCode = user &&
    !user.roles?.includes("superadmin") &&
    user.hasAreaCode === false;

  useEffect(() => {
    const checkMaintenance = async (retryCount = 0) => {
      if (location.pathname === "/maintenance" || location.pathname === "/auth") return;
      try {
        const { API_BASE, getAuthHeaders } = await import("@/lib/api");
        const res = await fetch(`${API_BASE}/system/config`, {
          headers: getAuthHeaders(token),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (res.status === 426) {
          console.warn("[VERSION] App blocked by backend. Stopping boot.");
          return; // SecurityUpdatePanel will show the overlay
        }

        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        const data = await res.json();
        
        // Maintenance redirect
        if (data.isMaintenanceMode && !isSuperAdmin) {
          setMaintenanceMode(true);
        }

        // Pre-alert data
        if (data.preAlertActive) {
          setPreAlert({
            active: data.preAlertActive,
            message: data.preAlertMessage,
            start: data.preAlertStartTime,
            end: data.preAlertEndTime
          });
        } else {
          setPreAlert(null);
        }
      } catch (e: any) {
        console.error("Maintenance check failed", e.message);
        if (retryCount < 2) {
          setTimeout(() => checkMaintenance(retryCount + 1), 3000 * (retryCount + 1));
        }
      }
    };
    checkMaintenance();
    const interval = setInterval(checkMaintenance, 60000); // Check every minute

    const timer = setTimeout(() => {
      setMinLoadTimePassed(true);
    }, 1500); 
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isSuperAdmin, location.pathname]);

  // --- Register FCM token for already-authenticated users ---
  useEffect(() => {
    if (!user || !token) return;
    
    // Proactively check and request notification permission
    if (typeof Notification !== "undefined") {
      console.log("[FCM] Current permission status:", Notification.permission);
      
      if (Notification.permission === "default") {
        console.log("[FCM] Permission is default. Requesting...");
        import("@/lib/fcm").then(({ registerFcmToken }) => {
          registerFcmToken(token).catch((err) => console.error("[FCM] Proactive registration failed:", err));
        });
      } else if (Notification.permission === "denied") {
        console.warn("[FCM] Permission is denied. Asking user to enable in settings.");
        toast({
          title: "PUSH NOTIFICATIONS BLOCKED",
          description: "Please enable notifications in your browser settings to receive real-time SOS alerts.",
          variant: "destructive"
        });
      } else if (Notification.permission === "granted") {
        console.log("[FCM] Permission already granted. Syncing token...");
        import("@/lib/fcm").then(({ registerFcmToken }) => {
          registerFcmToken(token).catch((err) => console.error("[FCM] Token sync failed:", err));
        });
      }
    } else {
      console.warn("[FCM] Notification API not supported in this environment.");
    }
  }, [user?.email, token]); // Run once when a user session is confirmed

  // --- Force system-level notifications even when app is in the foreground ---
  const lastToastRef = useRef<{ title: string, body: string, time: number } | null>(null);

  useEffect(() => {
    if (!user || !token) return;

    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    import("@/lib/fcm").then(({ onForegroundMessage }) => {
      if (!isMounted) return;
      unsubscribe = onForegroundMessage(async (payload) => {
        console.log("[FCM] Foreground message received:", payload);
        
        const title = payload.notification?.title || payload.data?.title || "SafetyWatch Alert";
        const body = payload.notification?.body || payload.data?.body || "You have a new alert.";
        const link = payload.data?.link || "/";

        // De-duplicate toasts (don't show same content within 2 seconds)
        const now = Date.now();
        if (lastToastRef.current && 
            lastToastRef.current.title === title && 
            lastToastRef.current.body === body && 
            (now - lastToastRef.current.time < 2000)) {
          console.log("[FCM] Suppressing duplicate toast/alert");
          return;
        }
        
        lastToastRef.current = { title, body, time: now };

        if (payload.data?.type === 'sos_alert') {
          console.log("[FCM] SOS Alert detected in foreground push!");
          const event = new CustomEvent('sos_alert_received', {
            detail: {
              incidentId: payload.data.incidentId,
              userName: payload.data.title?.split(' ')[0] || payload.notification?.title?.split(' ')[0] || 'Someone',
              latitude: parseFloat(payload.data.latitude),
              longitude: parseFloat(payload.data.longitude),
              status: payload.data.status || 'pending'
            }
          });
          window.dispatchEvent(event);
        } else {
          // Show interactive toast for all other notification types
          toast({
            title: title,
            description: body,
            action: link && link !== "/" ? (
              <ToastAction altText="View" onClick={() => {
                if (link.startsWith("http")) {
                  window.open(link, "_blank", "noopener,noreferrer");
                } else {
                  navigate(link);
                }
              }}>
                View
              </ToastAction>
            ) : undefined
          });
        }

        if (Capacitor.isNativePlatform()) {
          try {
            const { LocalNotifications } = await import("@capacitor/local-notifications");
            await LocalNotifications.schedule({
              notifications: [{
                title: title,
                body: body,
                id: Math.floor(Math.random() * 100000),
                schedule: { at: new Date(Date.now() + 500) },
                extra: { link }
              }]
            });
          } catch (e) {
            console.error("[FCM] Native LocalNotifications failed:", e);
          }
        } else if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            const notification = new Notification(title, {
              body,
              icon: "/logo192.png",
              badge: "/logo192.png",
              tag: "safetywatch-foreground",
            });

            notification.onclick = () => {
              window.focus();
              if (link && link !== "/") {
                window.location.href = link;
              }
              notification.close();
            };
          } catch (e) {
            navigator.serviceWorker?.ready?.then((reg) => {
              reg.showNotification(title, {
                body,
                icon: "/logo192.png",
                badge: "/logo192.png",
                tag: "safetywatch-foreground",
              });
            });
          }
        }
      });
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [user?.email, token]);

  // --- Background Location Sync for SOS ---
  useEffect(() => {
    if (!user || !token) return;

    const syncLocation = async (retryCount = 0) => {
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: Capacitor.isNativePlatform(),
          timeout: 15000
        });

        const { latitude, longitude, accuracy } = position.coords;
        if ((latitude === 0 && longitude === 0) || (accuracy && accuracy > 1000)) return;

        const res = await fetch(`${API_BASE}/users/location`, {
          method: "PATCH",
          headers: getAuthHeaders(token),
          body: JSON.stringify({ latitude, longitude, accuracy }),
          signal: AbortSignal.timeout(10000)
        });

        if (res.ok) {
          console.log("[LOCATION] Background sync successful");
        } else if (retryCount < 2) {
          setTimeout(() => syncLocation(retryCount + 1), 5000);
        }
      } catch (e: any) {
        console.warn("[LOCATION] Sync failed:", e.message);
        if (retryCount < 2) {
          setTimeout(() => syncLocation(retryCount + 1), 10000);
        }
      }
    };

    // Initial sync
    syncLocation();

    // Sync every 5 minutes
    const interval = setInterval(() => syncLocation(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, token]);

  // --- SOS Alert Listener ---
  useEffect(() => {
    const handleSOS = (event: any) => {
      const { incidentId, userName, latitude, longitude, status } = event.detail;
      const isSafe = status === 'problem solved';

      // Check if we already have this SOS active (using functional update to get current state without effect dependency)
      setActiveSOS(prev => {
        // If it's a "Safe" update but the popup is NOT currently open for this specific incident,
        // we show a toast instead of re-triggering the big popup.
        if (isSafe && (!prev || prev.incidentId !== incidentId)) {
          toast({
            title: "Neighbor is Safe ✅",
            description: `${userName} has marked themselves as safe. Thank you for your vigilance!`,
          });
          return prev;
        }

        // Otherwise, show/update the popup
        return { incidentId, userName, latitude, longitude, status };
      });
      
      // Play a sound if possible (only for NEW alerts, not updates to safe)
      if (!isSafe) {
        try {
          const audio = new Audio('/emergency_alert.mp3');
          audio.play().catch(() => {});
        } catch (e) {}
      }
    };

    window.addEventListener("sos_alert_received", handleSOS);
    return () => window.removeEventListener("sos_alert_received", handleSOS);
  }, []);

  // Redirect to maintenance if active and not superadmin
  useEffect(() => {
    if (maintenanceMode && !isSuperAdmin && location.pathname !== "/maintenance" && !location.pathname.startsWith("/auth")) {
      window.location.href = "/maintenance";
    }
  }, [maintenanceMode, isSuperAdmin, location.pathname]);

  // Handle Hardware Back Button
  useEffect(() => {
    const backListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      // If the global report form is open, close it instead of exiting or going back
      if (showGlobalReportForm) {
        closeGlobalReportForm();
        return;
      }

      // If an active SOS alert is open, close it
      if (activeSOS) {
        setActiveSOS(null);
        return;
      }

      // If we are on the text root path or auth page, ask to exit
      if (location.pathname === '/' || location.pathname === '/auth') {
        const confirmExit = window.confirm("Do you want to exit SafetyWatch?");
        if (confirmExit) {
          CapacitorApp.exitApp();
        }
      } else {
        // Otherwise go back in history
        window.history.back();
      }
    });

    return () => {
      backListener.then(handler => handler.remove());
    };
  }, [location.pathname, showGlobalReportForm, activeSOS]);

  // Loader is now handled by the parent App component to prevent "double loading"
  if (isLoading) {
    return <SafetyWatchLoader />;
  }

  // Show area code selector if needed
  if (needsAreaCode) {
    return (
      <AnimatedBackground>
        <AreaCodeSelector
          userEmail={user.email}
          onAreaCodeAssigned={async () => {
            // Refresh user data after area code assignment
            await refreshUser();
            // Force reload to ensure all components get updated user data
            window.location.reload();
          }}
        />
      </AnimatedBackground>
    );
  }

  const showPreAlert = preAlert && 
    preAlert.active && 
    preAlert.start && 
    new Date() >= new Date(preAlert.start) && 
    (!preAlert.end || new Date() <= new Date(preAlert.end));

  return (
    <AnimatedBackground>
      {/* === BLOCKING NOTIFICATION PERMISSION MODAL === */}
      {(notifPermission === "default" || notifPermission === "prompt") && user && (
        <div className="fixed inset-0 z-[9999] bg-surface-overlay/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="mx-auto w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mb-6">
              <Bell className="w-8 h-8 text-warning animate-bounce" />
            </div>
            <h2 className="text-xl font-bold mb-2">Enable Notifications</h2>
            <p className="text-muted-foreground text-sm mb-2">
              SafetyWatch needs notification access to send you <strong>real-time emergency SOS alerts</strong> when someone nearby is in danger.
            </p>
            <div className="flex items-center gap-2 bg-critical/10 border border-critical/20 rounded-xl p-3 mb-6">
              <ShieldAlert className="w-5 h-5 text-critical shrink-0" />
              <p className="text-xs text-critical text-left">Without notification access, you will NOT receive emergency alerts even when the app is closed.</p>
            </div>
            <button
              className="w-full bg-warning hover:bg-warning/90 text-warning-foreground font-bold py-3 px-6 rounded-xl shadow-lg shadow-warning/30 transition-all text-base mb-3"
              onClick={async () => {
                try {
                  console.log("[FCM] Requesting permission...");
                  let result: string = "default";
                  
                  if (Capacitor.isNativePlatform()) {
                    const { PushNotifications } = await import("@capacitor/push-notifications");
                    const status = await PushNotifications.requestPermissions();
                    result = status.receive;
                  } else {
                    result = await Notification.requestPermission();
                  }

                  console.log("[FCM] Permission request result:", result);
                  localStorage.setItem("notif_setup_complete", "true"); // PERSIST setup interaction
                  setNotifPermission(result);
                  
                  if (result === "granted" && token) {
                    const { registerFcmToken } = await import("@/lib/fcm");
                    await registerFcmToken(token);
                  }
                } catch (err) {
                  console.error("[FCM] Permission request failed:", err);
                  localStorage.setItem("notif_setup_complete", "true");
                  setNotifPermission("denied");
                }
              }}
            >
              Allow Notifications
            </button>
            <button
              className="text-muted-foreground text-xs hover:text-foreground transition-colors"
              onClick={() => {
                localStorage.setItem("notif_setup_complete", "true");
                setNotifPermission("dismissed");
              }}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
      {showPreAlert && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-warning to-warning/90 text-warning-foreground py-2 px-4 text-center text-xs font-bold shadow-lg flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top duration-500 translate-y-[env(safe-area-inset-top)]">
          <Megaphone className="h-4 w-4 animate-bounce shrink-0" />
          <span className="flex-1">{preAlert.message}</span>
          <button onClick={() => setPreAlert(null)} className="p-1 hover:bg-foreground/10 rounded-full transition-all">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {!hideNavbar && <Navbar />}
      <SuspensionModal
        isOpen={!!user?.isSuspended}
        expiresAt={user?.suspensionExpiresAt}
        onLogout={signOut}
      />
      <main className={!hideNavbar
        ? "pt-[calc(80px+env(safe-area-inset-top))] md:pt-[96px] pb-[calc(70px+env(safe-area-inset-bottom))] md:pb-0"
        : "pt-[env(safe-area-inset-top)] pb-[calc(70px+env(safe-area-inset-bottom))] md:pb-0"
      }>
        <Suspense fallback={<SafetyWatchLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inbox"
              element={
                <ProtectedRoute>
                  <Inbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute>
                  <Support />
                </ProtectedRoute>
              }
            />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route
              path="/achievements"
              element={
                <ProtectedRoute>
                  <Achievements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/circles"
              element={
                <ProtectedRoute>
                  <Circles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/circles/:id"
              element={
                <ProtectedRoute>
                  <CircleDetails />
                </ProtectedRoute>
              }
            />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Suspense fallback={null}>
        {!location.pathname.startsWith("/inbox") && (
          <ChatBot />
        )}
      </Suspense>
      <ScrollToTop />
      
      {!isSuperAdmin && !maintenanceMode && (
        <MobileBottomNav onReportClick={openGlobalReportForm} />
      )}

      {/* GLOBAL REPORT FORM */}
      <AnimatePresence>
        {showGlobalReportForm && (
          <motion.div
            key="global-report-form"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] md:flex md:items-center md:justify-center"
          >
            <ReportForm
              onClose={closeGlobalReportForm}
              onSubmit={handleGlobalReportSubmit}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={location.pathname === '/' ? "block" : "md:hidden"}>
        <GuardianMode />
      </div>
      
      {activeSOS && (
        <SOSAlert
          {...activeSOS}
          onClose={() => setActiveSOS(null)}
        />
      )}
    </AnimatedBackground >
  );
};

const queryClient = new QueryClient();

const App = () => {
  const [isUpdateCheckDone, setIsUpdateCheckDone] = useState(false);
  const [isUpdateBlocking, setIsUpdateBlocking] = useState(false);
  const [minLoadTimePassed, setMinLoadTimePassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadTimePassed(true);
    }, 400); // Reduced to 400ms for snappier startup
    return () => clearTimeout(timer);
  }, []);

  const handleCheckComplete = useCallback((blocking: boolean) => {
    setIsUpdateBlocking(blocking);
    setIsUpdateCheckDone(true);
  }, []);

  useEffect(() => {
    if (!isUpdateCheckDone || !minLoadTimePassed) return;

    // Hide splash screen
    SplashScreen.hide().catch(err => console.warn("SplashScreen hide failed:", err));

    // Configure Status Bar for native platforms
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(err => console.warn("StatusBar overlay failed:", err));
      StatusBar.setStyle({ style: Style.Default }).catch(err => console.warn("StatusBar style set failed:", err));

      let listeners: any[] = [];
      const setupNativePush = async () => {
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const { Geolocation } = await import('@capacitor/geolocation');
          const { Camera } = await import('@capacitor/camera');

          console.log('[PERMISSIONS] Requesting native permissions...');
          await Geolocation.requestPermissions().catch(() => {});
          await Camera.requestPermissions().catch(() => {});

          let permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive === 'granted') {
            PushNotifications.register();
          }

          // Registration event
          const regListener = await PushNotifications.addListener('registration', async (token) => {
            console.log('[PUSH] Registration token: ', token.value);
            const authToken = localStorage.getItem('token');
            if (authToken) {
              try {
                const { API_BASE, getAuthHeaders } = await import('@/lib/api');
                await fetch(`${API_BASE}/users/fcm-token`, {
                  method: 'POST',
                  headers: getAuthHeaders(authToken),
                  body: JSON.stringify({ token: token.value })
                });
              } catch (e) {
                console.error('[PUSH] Failed to sync token:', e);
              }
            }
          });
          listeners.push(regListener);

          // Push received event (Foreground)
          const receivedListener = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('[PUSH] Received in foreground: ', notification.id);
            
            // De-duplicate: Use notification ID or title/body hash
            const title = notification.title || "SafetyWatch Alert";
            const body = notification.body || "You have a new alert.";
            const data = notification.data || {};

            if (data.type === 'sos_alert' || data.incidentId) {
              const event = new CustomEvent('sos_alert_received', {
                detail: {
                  incidentId: data.incidentId,
                  userName: title.split(' ')[0] || body.split(' ')[0] || 'Someone',
                  latitude: parseFloat(data.latitude),
                  longitude: parseFloat(data.longitude),
                  status: data.status || 'pending'
                }
              });
              window.dispatchEvent(event);
            } else {
              const link = data.link || "/";
              toast({
                title: title,
                description: body,
                action: link && link !== "/" ? (
                  <ToastAction altText="View" onClick={() => { window.location.href = link; }}>View</ToastAction>
                ) : undefined
              });
            }
          });
          listeners.push(receivedListener);

          // Action performed (Tap)
          const actionListener = await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            const data = notification.notification.data;
            if (data && data.link) {
              window.location.href = data.link;
            }
          });
          listeners.push(actionListener);

        } catch (e) {
          console.warn('[PUSH] Native setup failed:', e);
        }
      };

      setupNativePush();

      return () => {
        listeners.forEach(l => l.remove());
      };
    }
  }, [isUpdateCheckDone, minLoadTimePassed]);

  return (
    <ThemeProvider>
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          <GlobalErrorBoundary>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AuthProvider>
                <SecurityUpdatePanel onCheckComplete={handleCheckComplete} />
                {(!isUpdateCheckDone || !minLoadTimePassed) ? (
                  <SafetyWatchLoader />
                ) : (
                  <AppContent />
                )}
              </AuthProvider>
            </BrowserRouter>
          </GlobalErrorBoundary>
        </QueryClientProvider>
        <Toaster />
        <Sonner />
        <AppTour />
        <IosInstallPrompt />
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default App;
