// d:\safe-neighborhood-watch-main11\frontend\src\components\Hero.tsx

import { useEffect, useState, useRef } from "react";
import { Activity, Radio, AlertTriangle, Users, Shield, Flame, Car, UtilityPole, Volume2, UserSearch, Info, Zap, Download } from "lucide-react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { API_BASE, VERSION_HEADERS } from "@/lib/api";
import { translateText, translateBatch } from "@/hooks/useTranslation";

function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.2,
      ease: "easeOut",
    });

    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

interface Stats {
  incidentsToday: number;
  activeAlerts: number;
  activeUsers: number;
  mostCommonType: string;
}

interface Incident {
  _id: string;
  title: string;
  type: string;
  location: string;
}

interface HeroProps {
  onReportClick: () => void;
  onViewReports: () => void;
}

export default function Hero({
  onReportClick,
  onViewReports,
}: HeroProps) {
  // Platform check - static since app doesn't change platform mid-life
  const isNative = Capacitor.isNativePlatform();
  const [stats, setStats] = useState<Stats | null>(null);
  const [latest, setLatest] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const DEFAULT_T = {
    empowering: "Empowering Communities",
    safetyIn: "Safety in Every",
    neighborhood: "Neighborhood.",
    heroDesc: "SafetyWatch provides real-time community insights, incident reporting, and neighborhood transparency to help you stay protected and connected.",
    reportBtn: "Report Incident",
    viewFeedBtn: "View Feed",
    getApp: "Get the App",
    liveOverview: "LIVE OVERVIEW",
    liveUplink: "Live Uplink",
    reports: "Reports",
    alerts: "Alerts",
    members: "Members",
    primaryConcern: "Primary Concern",
    mostReported: "Most reported in your area",
    latestSignals: "LATEST SIGNALS",
    commonType: "",
    latestIncidents: [] as any[]
  };

  const [t, setT] = useState(DEFAULT_T);

  const isFetching = useRef(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const translateUI = async (lang: string, currentStats: Stats | null, currentLatest: Incident[]) => {
    if (lang === "en") {
      setT({
        ...DEFAULT_T,
        commonType: currentStats?.mostCommonType || "",
        latestIncidents: currentLatest
      });
      return;
    }

    const staticLabels = [
      "Empowering Communities", "Safety in Every", "Neighborhood.",
      "SafetyWatch provides real-time community insights, incident reporting, and neighborhood transparency to help you stay protected and connected.",
      "Report Incident", "View Feed", "Get the App", "LIVE OVERVIEW", "Live Uplink",
      "Reports", "Alerts", "Members", "Primary Concern", "Most reported in your area", "LATEST SIGNALS"
    ];

    if (currentStats?.mostCommonType) staticLabels.push(currentStats.mostCommonType);

    const incidentTexts = currentLatest.flatMap(inc => [inc.title, inc.type]);
    const allToTranslate = [...staticLabels, ...incidentTexts];

    try {
      const translated = await translateBatch(allToTranslate, lang);

      let ptr = 0;
      const staticTranslated = translated.slice(0, staticLabels.length);
      ptr = staticLabels.length;

      const latestTranslated = [];
      for (let i = 0; i < currentLatest.length; i++) {
        latestTranslated.push({
          ...currentLatest[i],
          translatedTitle: translated[ptr++],
          translatedType: translated[ptr++]
        });
      }

      setT({
        empowering: staticTranslated[0],
        safetyIn: staticTranslated[1],
        neighborhood: staticTranslated[2],
        heroDesc: staticTranslated[3],
        reportBtn: staticTranslated[4],
        viewFeedBtn: staticTranslated[5],
        getApp: staticTranslated[6],
        liveOverview: staticTranslated[7],
        liveUplink: staticTranslated[8],
        reports: staticTranslated[9],
        alerts: staticTranslated[10],
        members: staticTranslated[11],
        primaryConcern: staticTranslated[12],
        mostReported: staticTranslated[13],
        latestSignals: staticTranslated[14],
        commonType: currentStats?.mostCommonType ? staticTranslated[15] : "",
        latestIncidents: latestTranslated
      });
    } catch (err) {
      console.error("Hero translation failed:", err);
    }
  };

  useEffect(() => {
    const handleLangChange = (e: any) => {
      translateUI(e.detail.lang, stats, latest);
    };
    window.addEventListener("languageChanged", handleLangChange);
    return () => window.removeEventListener("languageChanged", handleLangChange);
  }, [stats, latest]);

  async function loadData() {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      let statsData;
      let latestData;

      if (isNative) {
        const statsResponse = await CapacitorHttp.get({
          url: `${API_BASE}/stats/public`,
          headers: { ...VERSION_HEADERS, "Content-Type": "application/json" }
        });
        if (statsResponse.status >= 200 && statsResponse.status < 300) statsData = statsResponse.data;

        const latestResponse = await CapacitorHttp.get({
          url: `${API_BASE}/incidents/latest`,
          headers: { ...VERSION_HEADERS, "Content-Type": "application/json" }
        });
        if (latestResponse.status >= 200 && latestResponse.status < 300) latestData = latestResponse.data;
      } else {
        const statsRes = await fetch(`${API_BASE}/stats/public`, { headers: VERSION_HEADERS });
        if (statsRes.ok) statsData = await statsRes.json();

        const latestRes = await fetch(`${API_BASE}/incidents/latest`, { headers: VERSION_HEADERS });
        if (latestRes.ok) latestData = await latestRes.json();
      }

      setStats(statsData);
      setLatest(latestData || []);
      const currentLang = localStorage.getItem("app_lang") || "en";
      translateUI(currentLang, statsData, latestData || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Connection Failed");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }


  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "theft":
      case "assault":
      case "harassment":
      case "vandalism":
      case "suspicious":
        return { icon: Shield, color: "bg-blue-500/20 text-blue-500" };
      case "fire":
        return { icon: Flame, color: "bg-orange-500/20 text-orange-500" };
      case "medical":
        return { icon: Activity, color: "bg-red-500/20 text-red-500" };
      case "hazard":
        return { icon: AlertTriangle, color: "bg-amber-500/20 text-amber-500" };
      case "traffic":
        return { icon: Car, color: "bg-indigo-500/20 text-indigo-500" };
      case "infrastructure":
        return { icon: UtilityPole, color: "bg-cyan-500/20 text-cyan-500" };
      case "nuisance":
        return { icon: Volume2, color: "bg-slate-500/20 text-slate-500" };
      case "missing":
        return { icon: UserSearch, color: "bg-emerald-500/20 text-emerald-500" };
      default:
        return { icon: Info, color: "bg-primary/20 text-primary" };
    }
  };

  return (
    <section className="hero-bg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <div className="container mx-auto flex flex-col lg:flex-row items-center py-16 sm:py-24 px-4 sm:px-6 gap-12 sm:gap-16 relative z-10">
        <motion.div
          className="flex-1 text-center lg:text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold mb-6 border border-primary/20 uppercase tracking-widest backdrop-blur-sm">
            <Activity className="h-3 w-3" />
            {t.empowering}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.1] mb-6 sm:mb-8 tracking-tight text-foreground">
            {t.safetyIn} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">{t.neighborhood}</span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {t.heroDesc}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReportClick}
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-base font-bold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300"
            >
              {t.reportBtn}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onViewReports}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-border bg-background/50 backdrop-blur-md text-foreground font-bold hover:bg-accent/50 transition-all duration-300"
            >
              {t.viewFeedBtn}
            </motion.button>

            {!isNative && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('https://safetywatch-backend.onrender.com/SafetyWatch.apk', '_blank')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl border-2 border-primary/30 bg-primary/10 backdrop-blur-md text-primary font-black hover:bg-primary/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t.getApp}
              </motion.button>
            )}
          </div>
        </motion.div>

        <motion.div
          className="flex-1 w-full max-w-lg"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <p className="text-xs tracking-[0.2em] font-bold text-muted-foreground">
                {t.liveOverview}
              </p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase">{t.liveUplink}</span>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground animate-pulse font-bold tracking-widest text-xs gap-4">
                <p>Establishing Connection...</p>
                <p className="text-[10px] text-rose-500 max-w-[80%] text-center normal-case opacity-80">{errorMsg}</p>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="grid grid-cols-3 gap-4 text-center mb-8">
                  <div className="bg-background/40 rounded-2xl p-3 border border-border/50 backdrop-blur-sm">
                    <p className="text-3xl font-black text-foreground"><AnimatedCounter value={stats?.incidentsToday ?? 0} /></p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{t.reports}</p>
                  </div>
                  <div className="bg-background/40 rounded-2xl p-3 border border-border/50 backdrop-blur-sm">
                    <p className="text-3xl font-black text-amber-500"><AnimatedCounter value={stats?.activeAlerts ?? 0} /></p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{t.alerts}</p>
                  </div>
                  <div className="bg-background/40 rounded-2xl p-3 border border-border/50 backdrop-blur-sm">
                    <p className="text-3xl font-black text-primary"><AnimatedCounter value={stats?.activeUsers ?? 0} /></p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">{t.members}</p>
                  </div>
                </div>

                <div className="relative h-32 bg-primary/5 rounded-2xl border border-primary/20 mb-8 overflow-hidden flex items-center justify-center group-hover:border-primary/40 transition-all duration-500 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.05)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-20" />
                  <div className="flex flex-col items-center gap-2 z-10">
                    <div className="flex items-center gap-2 text-primary">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-xs font-bold tracking-wider uppercase">{t.primaryConcern}</span>
                    </div>
                    <p className="text-xl font-black text-foreground">{t.commonType || "None"}</p>
                    <span className="text-[10px] text-muted-foreground/80 font-medium">{t.mostReported}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] tracking-[0.2em] text-muted-foreground mb-4 font-black uppercase">{t.latestSignals}</p>
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {t.latestIncidents.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic pl-2">No signals detected.</p>
                      ) : (
                        t.latestIncidents.slice(0, 3).map((inc) => {
                          const config = getTypeIcon(inc.type);
                          const Icon = config.icon;
                          return (
                            <motion.div
                              key={inc._id}
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className="flex items-center gap-3 bg-background/40 backdrop-blur-md p-3 rounded-xl border border-border/50 hover:border-primary/40 transition-all duration-300 group/item"
                            >
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${config.color}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-foreground truncate">{inc.translatedTitle || inc.title}</p>
                                <p className="text-[10px] text-muted-foreground font-medium truncate uppercase tracking-tighter">
                                  {inc.translatedType || inc.type} • {inc.location}
                                </p>
                              </div>
                              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
