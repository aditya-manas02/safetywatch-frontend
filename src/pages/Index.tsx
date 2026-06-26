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
    window.location.reload();
  };

  useEffect(() => {
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
  }, [location.search, fetchFocusedIncident]);

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
        <div className={user ? "hidden md:block" : "block"}>
          <Hero
            onReportClick={() => user ? window.dispatchEvent(new CustomEvent("open-report-form")) : navigate("/auth")}
            onViewReports={() => navigate("/feed")}
            initialStats={dashboardBundle?.stats}
            initialLatest={dashboardBundle?.latest}
          />
        </div>

        {/* MAIN */}
        <main className="container mx-auto px-6 py-12">
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
                      let permission: string = "default";
                       try {
                        if (Capacitor.isNativePlatform()) {
                          const { PushNotifications } = await import("@capacitor/push-notifications");
                          const { LocalNotifications } = await import("@capacitor/local-notifications");
                          const pResult = await PushNotifications.requestPermissions();
                          const lResult = await LocalNotifications.requestPermissions();
                          permission = (pResult.receive === "granted" || lResult.display === "granted") ? "granted" : "denied";
                        } else {
                          permission = await Notification.requestPermission();
                        }
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
                        toast({ title: "ERROR", description: "Failed to request notification permissions.", variant: "destructive" });
                      }
                    }}>Activate Now</Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <AdCarousel />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-12 sm:space-y-16">
              {user && <ChallengesSection />}
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
              <NewsFeed />

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

                  <Button variant="ghost" className="text-white hover:bg-white/10 font-bold h-12 rounded-xl" onClick={() => navigate("/feed")}>
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
