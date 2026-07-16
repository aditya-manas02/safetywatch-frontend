import { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import Hero from "@/components/Hero";
import IncidentCard, { Incident } from "@/components/IncidentCard";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
const RealHeatmap = lazy(() => import("@/components/RealHeatmap"));
import ThemeToggle from "@/components/ThemeToggle";
import { Capacitor } from "@capacitor/core";

import {
  AlertCircle,
  LogIn,
  LogOut,
  Settings,
  User,
  Users,
  Star,
  MapPin,
  Clock,
  LayoutDashboard,
  ChevronRight,
  TrendingUp,
  Bell,
  Shield,
  Trophy,
  Activity,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import SafetyPulse from "@/components/SafetyPulse";
import NewsFeed from "@/components/NewsFeed";
import { Badge } from "@/components/ui/badge";
import IncidentCarousel from "@/components/IncidentCarousel";
import { API_BASE, VERSION_HEADERS, getAuthHeaders } from "@/lib/api";
import AppDownloadSection from "@/components/AppDownloadSection";
import PollsWidget from "@/components/PollsWidget";
import { ChallengesSection } from "@/components/ChallengesSection";
import AdCarousel from "@/components/AdCarousel";
import SafetyContentPanel from "@/components/SafetyContentPanel";
import PullToRefresh from "@/components/PullToRefresh";

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, token } = useAuth();

  const [popularIncidents, setPopularIncidents] = useState<Incident[]>([]);
  const [nearbyIncidents, setNearbyIncidents] = useState<Incident[]>([]);
  const [myReports, setMyReports] = useState<Incident[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [loadingMyReports, setLoadingMyReports] = useState(false);
  
  // Dashboard Bundle state
  const [dashboardBundle, setDashboardBundle] = useState<any>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [focusedIncident, setFocusedIncident] = useState<Incident | null>(null);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>("default");

  useEffect(() => {
    const checkPerms = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");
          const status = await PushNotifications.checkPermissions();
          console.log("[FCM] Index check - Native status:", status.receive);
          setNotifPermission(status.receive);
          if (status.receive === "prompt" || (status.receive as string) === "default") {
            setShowPermissionBanner(true);
          }
        } catch (e) {
          console.warn("[FCM] Index - Native permission check failed:", e);
        }
      } else if (typeof Notification !== "undefined") {
        setNotifPermission(Notification.permission);
        if (Notification.permission === "default") {
          setShowPermissionBanner(true);
        }
      }
    };
    checkPerms();
  }, []);

  const rawPopular = useRef<Incident[]>([]);
  const rawNearby = useRef<Incident[]>([]);
  const rawMyReports = useRef<Incident[]>([]);

  const translateIncidents = async (incidents: Incident[], lang: string) => {
    return [...incidents];
  };

  const DEFAULT_T = {
    adminAlerts: "Administrative Alerts",
    popularIncidents: "Popular Incidents",
    popularDesc: "Critical reports verified and highlighted by local authorities.",
    neighborhoodWatch: "Neighborhood Watch",
    nearLocation: "Near Your Location",
    nearDesc: "Incidents reported within a 10km radius of your current position.",
    locationRequired: "Location services are required to see nearby incidents.",
    enableLocation: "Enable Location",
    noNearby: "No incidents reported near you. Stay safe!",
    liveUpdates: "Live Updates",
    reportTracking: "Report Tracking",
    viewAllReports: "View All Reports",
    noReportsYet: "You haven't reported any incidents yet.",
    fileFirstReport: "File Your First Report",
    liveHeatmap: "Live Heatmap",
    heatmapDesc: "Interactive Density Analysis",
    strategicCenter: "Strategic Center",
    strategicDesc: "Access critical safety tools or contribute to the community safety network.",
    instantReport: "Instant Report",
    trackStatus: "Track Status",
    communityFirst: "Community First",
    communityDesc: "Join thousands of citizens keeping their neighborhoods safe through collaborative vigilance and real-time reporting."
  };

  const [t, setT] = useState(DEFAULT_T);

  useEffect(() => {
    setT(DEFAULT_T);
  }, [focusedIncident]);

  /* ---------------------------
     FETCH FOCUSED INCIDENT
  ---------------------------- */
  const fetchFocusedIncident = useCallback(async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE}/incidents/${id}`, {
        headers: VERSION_HEADERS
      });
      if (resp.ok) {
        const data = await resp.json();
        const baseIncident = mapIncident(data);
        const lang = localStorage.getItem("app_lang") || "en";
        const translated = await translateIncidents([baseIncident], lang);
        setFocusedIncident(translated[0]);
        updateMetaTags(translated[0]);
      }
    } catch (err) {
      console.error("Failed to fetch focused incident:", err);
    }
  }, []);
  const fetchPopular = useCallback(async () => {
    setLoadingPopular(true);
    try {
      // NEW: Fetch Bundle instead of just popular
      const resp = await fetch(`${API_BASE}/stats/bundle`, {
        headers: VERSION_HEADERS
      });
      if (!resp.ok) throw new Error("Failed to fetch dashboard bundle");
      const bundle = await resp.json();
      
      // 1. Process Popular Incidents
      const filteredPopular = (Array.isArray(bundle.popular) ? bundle.popular : []).map(mapIncident).filter((i: Incident) =>
        (i.status === 'approved' || i.isImportant) && i.status !== 'problem solved'
      );
      rawPopular.current = filteredPopular;
      const lang = localStorage.getItem("app_lang") || "en";
      setPopularIncidents(await translateIncidents(filteredPopular, lang));

      // 2. Set Bundle Data
      setDashboardBundle(bundle);

    } catch (err) {
      console.error("Failed to fetch popular incidents:", err);
    } finally {
      setLoadingPopular(false);
    }
  }, []);

  /* ---------------------------
     FETCH NEARBY INCIDENTS
  ---------------------------- */
  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoadingNearby(true);
    try {
      const resp = await fetch(`${API_BASE}/incidents/near-me?lat=${lat}&lng=${lng}&radius=10`, {
        headers: VERSION_HEADERS
      });
      if (!resp.ok) throw new Error("Failed to fetch nearby incidents");
      const data = await resp.json();
      const filtered = (Array.isArray(data) ? data : []).map(mapIncident).filter((i: Incident) =>
        (i.status === 'approved' || i.isImportant) && i.status !== 'problem solved'
      );
      rawNearby.current = filtered;
      const lang = localStorage.getItem("app_lang") || "en";
      setNearbyIncidents(await translateIncidents(filtered, lang));
    } catch (err) {
      console.error("Failed to fetch nearby incidents:", err);
    } finally {
      setLoadingNearby(false);
    }
  }, []);

  /* ---------------------------
     FETCH MY REPORTS
  ---------------------------- */
  const fetchMyReports = useCallback(async () => {
    if (!user) return;
    setLoadingMyReports(true);
    try {
      const resp = await fetch(`${API_BASE}/incidents/my-reports`, {
        headers: getAuthHeaders(token)
      });
      if (!resp.ok) throw new Error("Failed to fetch my reports");
      const data = await resp.json();
      const mapped = (Array.isArray(data) ? data : []).map(mapIncident);
      rawMyReports.current = mapped;
      const lang = localStorage.getItem("app_lang") || "en";
      setMyReports(await translateIncidents(mapped, lang));
    } catch (err) {
      console.error("Failed to fetch my reports:", err);
    } finally {
      setLoadingMyReports(false);
    }
  }, [user, token]);

  function mapIncident(item: any): Incident {
    return {
      id: item._id,
      userId: item.userId?._id || item.userId || "",
      type: item.type,
      title: item.title,
      description: item.description,
      location: item.location,
      imageUrl: item.imageUrl || null,
      timestamp: new Date(item.createdAt),
      status: item.status,
      isImportant: item.isImportant,
      helpfulUpvotes: item.helpfulUpvotes || [],
      resolutionVotes: item.resolutionVotes || []
    };
  }

  const handleRefresh = async () => {
    console.log('[INDEX] Manual refresh triggered...');

    // Trigger nearby incidents update non-blockingly
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          fetchNearby(loc.lat, loc.lng);
        },
        () => console.log("Location access denied"),
        { timeout: 5000 }
      );
    } else if (userLocation) {
      fetchNearby(userLocation.lat, userLocation.lng);
    }

    // Force pull-to-refresh spinner to stop after 3 seconds max
    // even if translation or data fetch is still hanging in the background.
    const fetchPromises = Promise.all([fetchPopular(), fetchMyReports()]);
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 3000));
    await Promise.race([fetchPromises, timeoutPromise]);
  };

  useEffect(() => {
    fetchPopular();
    if (user) fetchMyReports();

    const params = new URLSearchParams(location.search);
    const incidentId = params.get("incidentId") || params.get("incident");
    const isSos = params.get("sos") === "true";

    if (incidentId) {
      fetchFocusedIncident(incidentId);
      
      if (isSos) {
        toast({
          title: "🚨 ACTIVE SOS ALERT",
          description: "Emergency location focused on map. Immediate assistance required!",
          variant: "destructive",
          duration: 10000
        });
      }
    }

    // Attempt to get user location for Nearby section
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          fetchNearby(loc.lat, loc.lng);
        },
        () => console.log("Location access denied")
      );
    }
  }, [user, fetchPopular, fetchMyReports, fetchNearby, fetchFocusedIncident, location.search]);

  /* ---------------------------
     SCROLL HANDLERS
  ---------------------------- */
  useEffect(() => {
    if (location.state?.scrollTo) {
      setTimeout(() => {
        const target = document.getElementById(location.state.scrollTo);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 500);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const scrollToMyReports = () => {
    document.getElementById("tracking-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };



  function updateMetaTags(incident: Incident) {
    document.title = `${incident.title} | SafetyWatch`;
    const metaTags = [
      { property: 'og:title', content: incident.title },
      { property: 'og:description', content: incident.description },
      { property: 'og:image', content: incident.imageUrl || '/og-image.png' },
      { property: 'og:url', content: window.location.href },
      { name: 'twitter:title', content: incident.title },
      { name: 'twitter:description', content: incident.description },
      { name: 'twitter:image', content: incident.imageUrl || '/og-image.png' }
    ];

    metaTags.forEach(tag => {
      let element = tag.property
        ? document.querySelector(`meta[property="${tag.property}"]`)
        : document.querySelector(`meta[name="${tag.name}"]`);

      if (element) {
        element.setAttribute('content', String(tag.content));
      } else {
        element = document.createElement('meta');
        if (tag.property) element.setAttribute('property', tag.property);
        if (tag.name) element.setAttribute('name', tag.name);
        element.setAttribute('content', String(tag.content));
        document.head.appendChild(element);
      }
    });
  }

  return (
    <motion.div
      className="min-h-screen bg-background text-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <PullToRefresh onRefresh={handleRefresh}>
        <div id="tour-safety-pulse">
          <SafetyPulse initialData={dashboardBundle} />
        </div>

        {/* HERO */}
        <div>
          <Hero
            userLoggedIn={!!user}
            onReportClick={() => user ? window.dispatchEvent(new CustomEvent("open-report-form")) : navigate("/auth")}
            onViewReports={() => document.getElementById("popular-section")?.scrollIntoView({ behavior: "smooth" })}
            initialStats={dashboardBundle?.stats}
            initialLatest={dashboardBundle?.latest}
          />
        </div>

        {/* MAIN */}
        <main className="container mx-auto px-6 py-12">
          {/* Notification Permission Banner — ask permission or test push */}
          {showPermissionBanner && notifPermission !== "granted" && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 sm:p-6 mb-8 flex flex-col gap-4 overflow-hidden"
            >


              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="bg-orange-500/20 p-2 sm:p-3 rounded-xl">
                    <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base">
                      {notifPermission === "granted" ? "🔔 Notifications Active" : 
                       notifPermission === "denied" ? "🚫 Permissions Blocked" : "Enable Emergency Alerts"}
                    </h4>
                    <p className="text-muted-foreground text-[10px] sm:text-xs">
                      {notifPermission === "granted" 
                        ? "Permission granted. Tap 'Test' to verify system notifications work."
                        : notifPermission === "denied"
                        ? "Please enable notifications in your device/browser settings to receive SOS alerts."
                        : "Receive real-time push notifications for SOS alerts near your location."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {notifPermission !== "granted" && (
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-orange-500/20 shrink-0 flex-1 sm:flex-initial" onClick={async () => {
                      console.log("[FCM] Activate Now clicked. Platform:", Capacitor.getPlatform());
                      let permission: string = "default";
                       try {
                        console.log("[FCM] Requesting permissions...");
                        if (Capacitor.isNativePlatform()) {
                          const { PushNotifications } = await import("@capacitor/push-notifications");
                          const { LocalNotifications } = await import("@capacitor/local-notifications");
                          
                          // Request both Push and Local permissions
                          console.log("[FCM] Native: Requesting PushPermissions...");
                          const pResult = await PushNotifications.requestPermissions();
                          console.log("[FCM] Native: Push Result:", pResult.receive);
                          
                          console.log("[FCM] Native: Requesting LocalPermissions...");
                          const lResult = await LocalNotifications.requestPermissions();
                          console.log("[FCM] Native: Local Result:", lResult.display);
                          
                          permission = (pResult.receive === "granted" || lResult.display === "granted") ? "granted" : "denied";
                        } else {
                          console.log("[FCM] Web: Requesting Notification.requestPermission...");
                          permission = await Notification.requestPermission();
                        }
                        console.log("[FCM] Permission result:", permission);
                        setNotifPermission(permission);
                        if (permission === "granted") {
                          setShowPermissionBanner(false);
                          if (token) {
                            import("@/lib/fcm").then(({ registerFcmToken }) => registerFcmToken(token));
                          }
                          toast({ title: "ALERTS ENABLED", description: "You will now receive emergency notifications." });
                        } else if (permission === "denied") {
                          toast({ title: "PERMISSION DENIED", description: "Please enable notifications in your browser/app settings.", variant: "destructive" });
                        }
                      } catch (err) {
                        console.error("[FCM] Permission request failed:", err);
                        toast({ title: "ERROR", description: "Failed to request notification permissions.", variant: "destructive" });
                      }
                    }}>Activate Now</Button>
                  )}
                  {notifPermission === "granted" && user && token && (
                    <Button size="sm" variant="outline" className="border-orange-500/30 text-orange-500 font-bold px-6 py-2 rounded-xl shrink-0 flex-1 sm:flex-initial" onClick={async () => {
                      try {
                        // Step 1: Fire a LOCAL notification immediately
                        if (Capacitor.isNativePlatform()) {
                          const { LocalNotifications } = await import("@capacitor/local-notifications");
                          await LocalNotifications.schedule({
                            notifications: [{
                              title: "🔔 Native Test — SafetyWatch",
                              body: "This is a NATIVE test. If you see this, your phone supports system alerts!",
                              id: Math.floor(Math.random() * 1000),
                              schedule: { at: new Date(Date.now() + 1000) },
                              actionTypeId: "",
                              extra: null,
                              channelId: "safetywatch-alerts"
                            }]
                          });
                          toast({ title: "LOCAL TEST SENT", description: "Check your phone's notification tray!" });
                        } else {
                          const reg = await navigator.serviceWorker?.ready;
                          if (reg) {
                            await reg.showNotification("🔔 Web Test — SafetyWatch", {
                              body: "This is a WEB test. If you see this, your browser supports system notifications!",
                              icon: "/logo192.png",
                              badge: "/logo192.png",
                              tag: "local-test",
                            });
                            toast({ title: "LOCAL TEST SENT", description: "Check your phone's notification tray!" });
                          } else {
                            toast({ title: "NO SERVICE WORKER", description: "Service worker not found. Push won't work.", variant: "destructive" });
                          }
                        }

                        // Step 2: Also fire a BACKEND test push via FCM
                        if (!token) {
                          toast({ title: "NO TOKEN", description: "Missing FCM token. Push might fail.", variant: "destructive" });
                          return;
                        }

                        const res = await fetch(`${API_BASE}/users/test-push`, {
                          method: "POST",
                          headers: getAuthHeaders(token),
                        });
                        const data = await res.json();
                        console.log("[FCM] Test push result:", data);
                        if (!res.ok) {
                          toast({ title: "SERVER TEST FAILED", description: data.message || "Is your backend up?", variant: "destructive" });
                        } else {
                          toast({ title: "SERVER TEST SENT", description: "A message was requested from the server." });
                        }
                        if (data.result?.success) {
                          toast({ title: "SERVER PUSH SENT", description: `Sent to ${data.tokenCount} device(s). Check notification tray!` });
                        } else {
                          toast({ title: "SERVER PUSH FAILED", description: data.message || "Backend could not send push. Check server logs.", variant: "destructive" });
                        }
                      } catch (err) {
                        console.error("[FCM] Test notification failed:", err);
                        toast({ title: "TEST FAILED", description: String(err), variant: "destructive" });
                      }
                    }}>🔔 Test Notification</Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}


          <AdCarousel />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT: MAIN CONTENT */}
            <div className="lg:col-span-2 space-y-12 sm:space-y-16">

              {/* ACTIVITY SUMMARY & GUARDIAN ELITE (Relocated from Profile) */}
              {user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
                  {/* Guardian Elite Banner */}
                  <div className="p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-primary via-indigo-600 to-blue-700 text-primary-foreground shadow-2xl shadow-primary/30 relative overflow-hidden group border border-white/10 flex flex-col justify-between h-full">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 blur-[80px] translate-y-1/2 -translate-x-1/2 rounded-full" />
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000 pointer-events-none">
                      <Shield className="h-24 w-24" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-black tracking-tighter uppercase">Guardian Elite</h3>
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest opacity-80">Status: Master Defender</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 shadow-inner">
                        <p className="text-xs font-bold leading-relaxed">
                          Your vigilance maintains neighborhood integrity.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate("/leaderboard")}
                      className="w-full h-12 mt-6 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 font-bold text-[10px] uppercase tracking-[0.15em] shadow-xl transition-all hover:scale-[1.02] active:scale-95 group/btn relative z-10"
                    >
                      <Trophy className="mr-2 h-4 w-4 text-yellow-400 group-hover/btn:scale-110 transition-transform" />
                      View Sector Leaderboard
                    </Button>
                  </div>

                  {/* Activity Summary Card */}
                  <div 
                    onClick={() => {
                        navigate("/feed");
                        // Delay tab switch slightly to let Feed mount if not mounted
                        setTimeout(() => window.dispatchEvent(new CustomEvent('switch_tab', { detail: 'tracking' })), 100);
                    }}
                    className="p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between h-full"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                      <Activity className="h-24 w-24 text-emerald-500" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 sm:p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform">
                          <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl sm:text-2xl font-black tracking-tighter uppercase">Your Activity</h3>
                          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground">Mission Logs</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-4xl font-black text-foreground">{myReports.length}</div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Signals Captured</div>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-emerald-600 bg-emerald-500/10 rounded-xl px-4 py-3 font-bold text-xs uppercase tracking-widest relative z-10">
                      View full history
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              )}

              {/* 0. CHALLENGES & CAMPAIGNS */}
              {user && <ChallengesSection />}

              {/* 1. POPULAR INCIDENTS */}
              <div className="hidden md:block">
                <section id="popular-section" className="space-y-6 sm:space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-orange-500 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                        <Star className="h-3.5 w-3.5 fill-orange-500" /> {t.adminAlerts}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black">{t.popularIncidents}</h3>
                      <p className="text-muted-foreground text-sm sm:text-base mt-2">{t.popularDesc}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/20" />
                  </div>

                  {loadingPopular ? (
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 animate-pulse">
                      {[1, 2].map(i => <div key={i} className="h-64 bg-card border rounded-2xl"></div>)}
                    </div>
                  ) : popularIncidents.length === 0 ? (
                    <div className="text-center py-12 sm:py-16 bg-muted/10 rounded-2xl border">
                      <p className="text-muted-foreground text-sm">No popular incidents currently featured.</p>
                    </div>
                  ) : (
                    <IncidentCarousel incidents={popularIncidents} />
                  )}
                </section>
              </div>

              {/* 2. INCIDENTS NEAR YOU */}
              <div className="hidden md:block">
                <section id="nearby-section" className="space-y-6 sm:space-y-8">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                        <MapPin className="h-3.5 w-3.5" /> {t.neighborhoodWatch}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black">{t.nearLocation}</h3>
                      <p className="text-muted-foreground text-sm sm:text-base mt-2">{t.nearDesc}</p>
                    </div>
                  </div>

                  {!userLocation ? (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 sm:p-10 text-center">
                      <MapPin className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500/30 mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm sm:text-base font-medium mb-6">{t.locationRequired}</p>
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>{t.enableLocation}</Button>
                    </div>
                  ) : loadingNearby ? (
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 animate-pulse">
                      {[1, 2].map(i => <div key={i} className="h-64 bg-card border rounded-2xl"></div>)}
                    </div>
                  ) : nearbyIncidents.length === 0 ? (
                    <div className="text-center py-12 sm:py-16 bg-muted/10 rounded-2xl border">
                      <p className="text-muted-foreground text-sm">{t.noNearby}</p>
                    </div>
                  ) : (
                    <IncidentCarousel incidents={nearbyIncidents} />
                  )}
                </section>
              </div>

              {/* 3. REPORT TRACKING (FOR LOGGED IN USERS) */}
              {user && (
                <div className="hidden md:block">
                  <section id="tracking-section" className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative bg-card border rounded-2xl p-6 sm:p-8 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-primary font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1">
                            <Clock className="h-3.5 w-3.5" /> {t.liveUpdates}
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-black">{t.reportTracking}</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/profile")}
                          className="text-muted-foreground hover:text-primary w-fit p-0 sm:p-2"
                        >
                          {t.viewAllReports} <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>

                      {loadingMyReports ? (
                        <div className="flex justify-center py-12">
                          <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
                        </div>
                      ) : myReports.length === 0 ? (
                        <div className="text-center py-12 bg-muted/20 border border-dashed rounded-xl">
                          <p className="text-muted-foreground text-sm font-medium mb-4">{t.noReportsYet}</p>
                          <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent("open-report-form"))}>{t.fileFirstReport}</Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          {myReports.slice(0, 2).map((inc) => (
                            <div key={inc.id} onClick={() => setFocusedIncident(inc)} className="cursor-pointer">
                              <IncidentCard incident={inc} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              <div className={user ? "hidden md:block" : "block"}>
                <HowItWorks />
              </div>
            </div>

            {/* RIGHT: ASIDE */}
            <aside className="space-y-10">
              <SafetyContentPanel />
              <div id="tour-polls-widget">
                <PollsWidget />
              </div>
              <NewsFeed userLocation={userLocation} />

              <div id="tour-heatmap" className="bg-card border rounded-2xl p-6 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <img
                    src="/assets/splash.png"
                    alt=""
                    className="h-24 w-24 object-contain grayscale brightness-0 invert dark:invert-0"
                  />
                </div>
                <h4 className="text-xl font-black mb-6 flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  {t.liveHeatmap}
                </h4>
                <div className="rounded-xl overflow-hidden border">
                  <Suspense fallback={<div className="h-48 w-full bg-muted/20 animate-pulse flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Initialising Heatmap...</div>}>
                    <RealHeatmap />
                  </Suspense>
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 text-center font-bold tracking-widest uppercase">
                  {t.heatmapDesc}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] opacity-50"></div>
                <h4 className="text-2xl font-black relative z-10">{t.strategicCenter}</h4>
                <p className="text-sm text-balance my-4 opacity-90 relative z-10 leading-relaxed">
                  {t.strategicDesc}
                </p>

                <div className="flex flex-col gap-3 mt-6 relative z-10">
                  <Button
                    className="bg-white text-blue-600 hover:bg-white/90 font-bold h-12 rounded-xl border-none shadow-lg"
                    onClick={() => user ? window.dispatchEvent(new CustomEvent("open-report-form")) : navigate("/auth")}
                  >
                    {t.instantReport}
                  </Button>

                  <Button variant="ghost" className="text-white hover:bg-white/10 font-bold h-12 rounded-xl" onClick={scrollToMyReports}>
                    {t.trackStatus}
                  </Button>
                </div>
              </div>

              <div className="bg-card border rounded-2xl p-8 shadow-sm">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h4 className="text-xl font-black mb-2">{t.communityFirst}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t.communityDesc}
                </p>
              </div>
            </aside>
          </div>
        </main>

        <div className={user ? "hidden md:block" : "block"}>
          <AppDownloadSection />
          <Footer />
        </div>
      </PullToRefresh>



      {/* Deep linked incident dialog */}
      {focusedIncident && (
        <div className="hidden">
          <IncidentCard
            incident={focusedIncident}
            defaultOpen={true}
            onDialogStateChange={(open) => {
              if (!open) {
                setFocusedIncident(null);
                navigate("/", { replace: true });
              }
            }}
          />
        </div>
      )}
    </motion.div >
  );
}
