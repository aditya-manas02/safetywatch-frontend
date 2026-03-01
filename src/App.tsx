import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { GlobalErrorBoundary } from "./components/GlobalErrorBoundary";
import Navbar from "./components/Navbar";
import { useLocation } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ChatBot from "./components/ChatBot";
import AnimatedBackground from "./components/AnimatedBackground";
import { lazy, Suspense, useEffect, useState, useCallback } from "react";
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

// Lazy load pages for performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Support = lazy(() => import("./pages/Support"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Circles = lazy(() => import("./pages/Circles"));
const CircleDetails = lazy(() => import("./pages/CircleDetails"));
const NotFound = lazy(() => import("./pages/NotFound"));



const AppContent = () => {
  const location = useLocation();
  const hideNavbar = ["/admin", "/auth"].some(path => location.pathname.startsWith(path));

  const { isLoading, user, refreshUser, signOut } = useAuth();
  const [minLoadTimePassed, setMinLoadTimePassed] = useState(false);

  // Check if user needs to set area code (not superadmin and hasAreaCode is false)
  const needsAreaCode = user &&
    !user.roles?.includes("superadmin") &&
    user.hasAreaCode === false;

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadTimePassed(true);
    }, 1500); // Reduced to 1.5 seconds for snappier startup
    return () => clearTimeout(timer);
  }, []);

  // Handle Hardware Back Button
  useEffect(() => {
    const backListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
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
  }, [location.pathname]);

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

  return (
    <AnimatedBackground>

      {!hideNavbar && <Navbar />}
      <SuspensionModal
        isOpen={!!user?.isSuspended}
        expiresAt={user?.suspensionExpiresAt}
        onLogout={signOut}
      />
      <main className={!hideNavbar
        ? "pt-[calc(80px+env(safe-area-inset-top))] md:pt-[96px]"
        : "pt-[env(safe-area-inset-top)]"
      }>
        <Suspense fallback={<SafetyWatchLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Suspense fallback={null}>
        {!location.pathname.startsWith("/inbox") && <ChatBot />}
      </Suspense>
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
    }, 1500); // Reduced to 1.5 seconds for snappier startup
    return () => clearTimeout(timer);
  }, []);

  const handleCheckComplete = useCallback((blocking: boolean) => {
    setIsUpdateBlocking(blocking);
    setIsUpdateCheckDone(true);
  }, []);

  useEffect(() => {
    // Hide splash screen
    SplashScreen.hide().catch(err => console.warn("SplashScreen hide failed:", err));

    // FAILSAFE: Force loading to complete after 5 seconds regardless of update check status
    const failsafeTimer = setTimeout(() => {
      if (!isUpdateCheckDone) {
        console.warn("[APP] Update check failsafe triggered - allowing entry.");
        setIsUpdateCheckDone(true);
      }
    }, 5000);

    // Configure Status Bar for native platforms
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(err => console.warn("StatusBar overlay failed:", err));
      // Set a default style, can be updated later based on theme
      StatusBar.setStyle({ style: Style.Default }).catch(err => console.warn("StatusBar style set failed:", err));

      setTimeout(() => {
        requestNativePermissions();
      }, 2000);
    }

    return () => clearTimeout(failsafeTimer);
  }, [isUpdateCheckDone]);

  const requestNativePermissions = async () => {
    try {
      console.log('[PERMISSIONS] Proactively requesting native permissions...');
      await Geolocation.requestPermissions();
      await Camera.requestPermissions();

      if ('Notification' in window) {
        await Notification.requestPermission();
      }
    } catch (e) {
      console.warn('[PERMISSIONS] Proactive request failed:', e);
    }
  };

  return (
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
    </TooltipProvider>
  );
};

export default App;
