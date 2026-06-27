import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, ChevronLeft, ChevronRight, X, ExternalLink, Calendar, Globe, MapPin, RefreshCw, Search } from "lucide-react";
import { API_BASE, VERSION_HEADERS } from "@/lib/api";

interface NewsArticle {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    publishedAt: string;
    source: string;
}

interface NewsFeedProps {
    userLocation?: { lat: number; lng: number } | null;
}

const STORAGE_KEY = "safetywatch_news_city";
const TAB_STORAGE_KEY = "safetywatch_news_tab";

export default function NewsFeed({ userLocation }: NewsFeedProps) {
    const [activeTab, setActiveTab] = useState<'local' | 'global'>(() => {
        return (localStorage.getItem(TAB_STORAGE_KEY) as 'local' | 'global') || 'local';
    });

    const [localData, setLocalData] = useState<{ articles: NewsArticle[], lastUpdated: Date | null, error: boolean }>({ articles: [], lastUpdated: null, error: false });
    const [globalData, setGlobalData] = useState<{ articles: NewsArticle[], lastUpdated: Date | null, error: boolean }>({ articles: [], lastUpdated: null, error: false });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

    // Location state
    const [cityName, setCityName] = useState<string | null>(null);
    const [manualCityInput, setManualCityInput] = useState("");
    const [showCityEditor, setShowCityEditor] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const cityInputRef = useRef<HTMLInputElement>(null);

    const DEFAULT_T = {
        recentNews: "NEWS DESK",
        updated: "UPDATED",
        intel: "INTEL",
        broadcastDate: "Broadcast Date",
        protocolStatus: "Protocol Status",
        verifiedIntel: "VERIFIED INTEL",
        originNetwork: "Origin Network",
        localSafety: "Local Safety",
        globalSafety: "Global Safety",
        intelDirective: "Intelligence Directive",
        accessTerminal: "Access Source Terminal",
        justNow: "Just now",
        hAgo: "h ago",
        dAgo: "d ago"
    };

    const [t, setT] = useState(DEFAULT_T);

    // ──────────────────────────────────────────
    // REVERSE GEOCODE: coords → city name
    // Uses free Nominatim/OpenStreetMap API
    // ──────────────────────────────────────────
    const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
        try {
            setGeocoding(true);
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=en`,
                {
                    headers: {
                        "User-Agent": "SafetyWatch-App/1.5 (safetywatch4neighbour@gmail.com)"
                    }
                }
            );
            if (!res.ok) return null;
            const data = await res.json();
            const city = data.address?.city
                || data.address?.town
                || data.address?.county
                || data.address?.state_district
                || data.address?.state
                || null;
            return city;
        } catch (err) {
            console.error("Reverse geocoding failed:", err);
            return null;
        } finally {
            setGeocoding(false);
        }
    }, []);

    // ──────────────────────────────────────────
    // RESOLVE CITY: geolocation → saved → prompt
    // ──────────────────────────────────────────
    useEffect(() => {
        const resolveCity = async () => {
            if (userLocation) {
                const geocoded = await reverseGeocode(userLocation.lat, userLocation.lng);
                if (geocoded) {
                    setCityName(geocoded);
                    localStorage.setItem(STORAGE_KEY, geocoded);
                    return;
                }
            }
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setCityName(saved);
                return;
            }
            setCityName(null);
        };
        resolveCity();
    }, [userLocation, reverseGeocode]);

    // ──────────────────────────────────────────
    // LOAD NEWS: fetch from backend with caching
    // ──────────────────────────────────────────
    const loadNews = useCallback(async (tab: 'local' | 'global', city: string | null, isManualRefresh = false) => {
        // Prevent auto-fetch spam if we just fetched
        if (!isManualRefresh) {
            const lastUpdate = tab === 'local' ? localData.lastUpdated : globalData.lastUpdated;
            if (lastUpdate && Date.now() - lastUpdate.getTime() < 5 * 60 * 1000) {
                return; 
            }
        }

        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        if (tab === 'local') setLocalData(prev => ({ ...prev, error: false }));
        else setGlobalData(prev => ({ ...prev, error: false }));

        try {
            let url = `${API_BASE}/news?t=${Date.now()}`;
            if (tab === 'local' && city) {
                url = `${API_BASE}/news?city=${encodeURIComponent(city)}&t=${Date.now()}`;
            }

            const res = await fetch(url, { headers: VERSION_HEADERS });
            if (res.ok) {
                const data = await res.json();
                const fresh = (data.articles || []).slice(0, 15);
                
                if (tab === 'local') {
                    setLocalData({ articles: fresh, lastUpdated: new Date(), error: false });
                } else {
                    setGlobalData({ articles: fresh, lastUpdated: new Date(), error: false });
                }
                setCurrentIndex(0);
            } else {
                if (tab === 'local') setLocalData(prev => ({ ...prev, error: true }));
                else setGlobalData(prev => ({ ...prev, error: true }));
            }
        } catch (err) {
            console.error("Failed to load news:", err);
            if (tab === 'local') setLocalData(prev => ({ ...prev, error: true }));
            else setGlobalData(prev => ({ ...prev, error: true }));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [localData.lastUpdated, globalData.lastUpdated]);

    // ──────────────────────────────────────────
    // AUTO-FETCH logic
    // ──────────────────────────────────────────
    useEffect(() => {
        if (geocoding) return;
        localStorage.setItem(TAB_STORAGE_KEY, activeTab);
        loadNews(activeTab, activeTab === 'local' ? cityName : null);

        // 60-minute refresh interval
        const interval = setInterval(() => {
            loadNews(activeTab, activeTab === 'local' ? cityName : null);
        }, 60 * 60 * 1000); 

        return () => clearInterval(interval);
    }, [activeTab, cityName, geocoding, loadNews]);

    // ──────────────────────────────────────────
    // AUTO-SLIDE carousel
    // ──────────────────────────────────────────
    const currentArticles = activeTab === 'local' ? localData.articles : globalData.articles;
    const currentError = activeTab === 'local' ? localData.error : globalData.error;
    const currentLastUpdated = activeTab === 'local' ? localData.lastUpdated : globalData.lastUpdated;

    useEffect(() => {
        if (currentArticles.length === 0 || selectedArticle) return;
        const slideInterval = setInterval(() => {
            setDirection(1);
            setCurrentIndex((prev) => (prev + 1) % currentArticles.length);
        }, 8000); // Slower interval for readability
        return () => clearInterval(slideInterval);
    }, [currentArticles.length, selectedArticle]);

    useEffect(() => {
        setT(DEFAULT_T);
    }, []);

    // ──────────────────────────────────────────
    // MANUAL CITY SAVE
    // ──────────────────────────────────────────
    const handleSaveCity = () => {
        const trimmed = manualCityInput.trim();
        if (!trimmed) return;
        localStorage.setItem(STORAGE_KEY, trimmed);
        setCityName(trimmed);
        setShowCityEditor(false);
        setManualCityInput("");
        // Force reload for new city
        loadNews('local', trimmed, true);
    };

    // ──────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────
    function formatTime(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) return t.justNow;
        if (diffHours < 24) return `${diffHours}${t.hAgo}`;
        return `${Math.floor(diffHours / 24)}${t.dAgo}`;
    }

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            rotateY: direction > 0 ? 45 : -45,
            scale: 0.9,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            rotateY: 0,
            scale: 1,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            rotateY: direction < 0 ? 45 : -45,
            scale: 0.9,
        }),
    };

    const nextSlide = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % currentArticles.length);
    };

    const prevSlide = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + currentArticles.length) % currentArticles.length);
    };

    // ──────────────────────────────────────────
    // CITY EDITOR (inline)
    // ──────────────────────────────────────────
    const renderCityEditor = () => (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4"
        >
            <div className="flex gap-2 items-center">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        ref={cityInputRef}
                        type="text"
                        value={manualCityInput}
                        onChange={(e) => setManualCityInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveCity()}
                        placeholder="Enter your city name..."
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                        autoFocus
                    />
                </div>
                <button
                    onClick={handleSaveCity}
                    disabled={!manualCityInput.trim()}
                    className="px-4 py-2.5 bg-primary text-primary-foreground text-xs font-black rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                    Save
                </button>
                {cityName && (
                    <button
                        onClick={() => setShowCityEditor(false)}
                        className="p-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );

    // ──────────────────────────────────────────
    // SHARED HEADER + TOGGLE UI
    // ──────────────────────────────────────────
    const renderHeader = () => (
        <>
            <div className="px-4 py-4 flex items-center justify-between theme-card-surface">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/20 rounded-lg shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                        <Newspaper className="h-4 w-4 text-primary" />
                    </div>
                    <h4 className="font-bold text-xs tracking-[0.3em] uppercase text-foreground/90">{t.recentNews}</h4>
                </div>
                <div className="flex items-center gap-3">
                    {/* City badge — ONLY ON LOCAL TAB */}
                    {activeTab === 'local' && cityName && (
                        <button
                            onClick={() => {
                                setShowCityEditor(!showCityEditor);
                                setTimeout(() => cityInputRef.current?.focus(), 100);
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-lg text-[9px] font-bold text-primary hover:bg-primary/20 transition-all border border-primary/10"
                        >
                            <MapPin className="h-2.5 w-2.5" />
                            <span className="max-w-[80px] truncate">{cityName}</span>
                            <span className="text-primary/50">✎</span>
                        </button>
                    )}
                    {/* Manual refresh button */}
                    <button
                        onClick={() => loadNews(activeTab, activeTab === 'local' ? cityName : null, true)}
                        disabled={refreshing}
                        className="p-1.5 text-muted-foreground/50 hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                        title="Refresh news"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* SEGMENTED CONTROL: LOCAL / GLOBAL */}
            <div className="flex bg-muted/50 p-1.5 rounded-2xl mx-4 mb-4 border relative isolate backdrop-blur-xl">
                <div
                    className="absolute inset-y-1.5 left-1.5 bg-background rounded-xl shadow-sm transition-transform duration-300 ease-out border border-border/50"
                    style={{
                        width: `calc(50% - 6px)`,
                        transform: `translateX(${activeTab === 'global' ? '100%' : '0'})`,
                    }}
                />
                <button
                    onClick={() => { setActiveTab('local'); setCurrentIndex(0); setShowCityEditor(false); }}
                    className={`flex-1 relative z-10 py-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-colors ${activeTab === 'local' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
                >
                    Local
                </button>
                <button
                    onClick={() => { setActiveTab('global'); setCurrentIndex(0); setShowCityEditor(false); }}
                    className={`flex-1 relative z-10 py-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-colors ${activeTab === 'global' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
                >
                    Global
                </button>
            </div>
        </>
    );

    // ──────────────────────────────────────────
    // LOADING STATE
    // ──────────────────────────────────────────
    if (loading && !refreshing && currentArticles.length === 0 && !currentError) {
        return (
            <div className="bg-card border rounded-2xl shadow-xl border-white/5 backdrop-blur-md overflow-hidden pb-4">
                {renderHeader()}
                <div className="px-4">
                    <div className="flex justify-between items-center mb-4">
                        {geocoding && activeTab === 'local' && (
                            <span className="text-[9px] text-muted-foreground font-mono animate-pulse">
                                Detecting location...
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3 h-[180px]">
                        <div className="w-28 h-full bg-muted rounded-xl animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-full bg-muted rounded animate-pulse" />
                            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                            <div className="h-12 w-full bg-muted rounded animate-pulse pt-4" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ──────────────────────────────────────────
    // NO CITY SET — prompt to set area (LOCAL ONLY)
    // ──────────────────────────────────────────
    if (activeTab === 'local' && !cityName && !loading && currentArticles.length === 0) {
        return (
            <div className="bg-card border rounded-2xl shadow-xl border-white/5 backdrop-blur-md overflow-hidden">
                {renderHeader()}
                <div className="p-8 flex flex-col items-center text-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-2xl">
                        <MapPin className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h5 className="font-black text-base text-foreground mb-1">Set Your Area</h5>
                        <p className="text-xs text-muted-foreground max-w-[280px]">
                            SafetyWatch uses your location to show news and alerts relevant to your neighborhood.
                        </p>
                    </div>
                    <div className="w-full max-w-xs flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                value={manualCityInput}
                                onChange={(e) => setManualCityInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveCity()}
                                placeholder="Your city name..."
                                className="w-full pl-9 pr-3 py-2.5 text-sm bg-muted/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>
                        <button
                            onClick={handleSaveCity}
                            disabled={!manualCityInput.trim()}
                            className="px-4 py-2.5 bg-primary text-primary-foreground text-xs font-black rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ──────────────────────────────────────────
    // ERROR STATE
    // ──────────────────────────────────────────
    if (currentError && currentArticles.length === 0) {
        return (
            <div className="bg-card border rounded-2xl shadow-xl border-white/5 backdrop-blur-md overflow-hidden">
                {renderHeader()}
                <div className="p-8 flex flex-col items-center text-center gap-3">
                    <Newspaper className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground font-medium">News temporarily unavailable</p>
                    <button
                        onClick={() => loadNews(activeTab, activeTab === 'local' ? cityName : null, true)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl transition-all"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Try Again
                    </button>
                </div>
            </div>
        );
    }

    // ──────────────────────────────────────────
    // EMPTY RESULTS STATE (API worked but 0 articles)
    // ──────────────────────────────────────────
    if (currentArticles.length === 0 && !loading) {
        return (
            <div className="bg-card border rounded-2xl shadow-xl border-white/5 backdrop-blur-md overflow-hidden">
                {renderHeader()}
                <AnimatePresence>
                    {activeTab === 'local' && showCityEditor && renderCityEditor()}
                </AnimatePresence>
                <div className="p-8 flex flex-col items-center text-center gap-3">
                    <Newspaper className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground font-medium">
                        {activeTab === 'local' 
                            ? <>No local safety news for <span className="text-foreground font-bold">{cityName}</span> right now</>
                            : "No global safety news available right now"}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50">Check back later{activeTab === 'local' && " or try a different area"}</p>
                </div>
            </div>
        );
    }

    const currentArticle = currentArticles[currentIndex] || currentArticles[0];

    // ──────────────────────────────────────────
    // MAIN NEWS CAROUSEL
    // ──────────────────────────────────────────
    return (
        <>
            <div className="group relative theme-card-surface transition-all duration-500 hover:shadow-primary/10 pb-2">
                {renderHeader()}
                
                <AnimatePresence>
                    {activeTab === 'local' && showCityEditor && renderCityEditor()}
                </AnimatePresence>

                {/* Progress Indicators & Last Updated under toggle */}
                <div className="px-4 flex items-center justify-between mb-3">
                    <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                        {currentArticles.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 transition-all duration-500 rounded-full flex-shrink-0 ${i === currentIndex ? "w-6 bg-primary shadow-[0_0_8px_#3b82f6]" : "w-2 bg-foreground/10"}`}
                            />
                        ))}
                    </div>
                    {currentLastUpdated && (
                        <span className="text-[9px] text-muted-foreground/60 font-mono tracking-tighter uppercase whitespace-nowrap pl-2">
                            {t.updated}: {currentLastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>

                <div className="relative h-[240px] sm:h-[190px] w-full perspective-[1000px] overflow-hidden touch-pan-y">
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={`${activeTab}-${currentIndex}`}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={1}
                            onDragEnd={(e, { offset, velocity }) => {
                                const swipe = offset.x;
                                if (swipe < -50 || velocity.x < -100) nextSlide();
                                else if (swipe > 50 || velocity.x > 100) prevSlide();
                            }}
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.4 },
                                scale: { duration: 0.5 }
                            }}
                            onClick={() => setSelectedArticle(currentArticle)}
                            className="absolute inset-0 px-4 pb-2 flex flex-col sm:flex-row gap-5 cursor-pointer hover:bg-muted/30 transition-colors group/item"
                        >
                            {currentArticle.imageUrl && (
                                <div className="relative flex-shrink-0 w-full sm:w-36 h-32 sm:h-full rounded-2xl overflow-hidden border border-border/50 shadow-lg bg-muted">
                                    <img
                                        src={currentArticle.imageUrl}
                                        alt=""
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                                        onError={(e) => (e.currentTarget.style.display = "none")}
                                        draggable="false"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                </div>
                            )}

                            <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                    <h5 className="font-black text-sm sm:text-base leading-tight text-foreground group-hover/item:text-primary transition-colors line-clamp-2 mb-2 tracking-tight">
                                        {currentArticle.title}
                                    </h5>
                                </div>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded-md border border-border/50 backdrop-blur-sm">
                                            <Globe className="h-3 w-3 text-primary/70" />
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest truncate max-w-[80px]">
                                                {currentArticle.source}
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-widest">
                                            {formatTime(currentArticle.publishedAt)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-primary text-[10px] font-black tracking-widest opacity-0 group-hover/item:opacity-100 transition-all translate-x-2 group-hover/item:translate-x-0">
                                        {t.intel} <ChevronRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <div className="absolute inset-y-0 left-2 flex items-center z-20 pointer-events-none">
                        <button
                            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                            className="pointer-events-auto p-2 bg-background/60 backdrop-blur-xl border border-border/50 rounded-full hover:bg-primary hover:text-white text-foreground transition-all shadow-xl opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 group/nav"
                            aria-label="Previous news"
                        >
                            <ChevronLeft className="h-5 w-5 transition-transform group-hover/nav:-translate-x-0.5" />
                        </button>
                    </div>
                    <div className="absolute inset-y-0 right-2 flex items-center z-20 pointer-events-none">
                        <button
                            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                            className="pointer-events-auto p-2 bg-background/60 backdrop-blur-xl border border-border/50 rounded-full hover:bg-primary hover:text-white text-foreground transition-all shadow-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 group/nav"
                            aria-label="Next news"
                        >
                            <ChevronRight className="h-5 w-5 transition-transform group-hover/nav:translate-x-0.5" />
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedArticle && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedArticle(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-[12px] cursor-zoom-out"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative w-full max-w-4xl bg-background border border-border/50 rounded-[32px] shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
                        >
                            <div className="relative h-72 sm:h-96 w-full overflow-hidden shrink-0">
                                {selectedArticle.imageUrl ? (
                                    <img
                                        src={selectedArticle.imageUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
                                        <Newspaper className="h-24 w-24 text-primary/40" />
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-b from-foreground/20 via-transparent to-transparent opacity-20" />

                                <button
                                    onClick={() => setSelectedArticle(null)}
                                    className="absolute top-6 right-6 p-2.5 bg-background/40 hover:bg-primary text-foreground hover:text-white rounded-full backdrop-blur-md border border-border/50 transition-all z-30 group shadow-lg"
                                >
                                    <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
                                </button>

                                <div className="absolute bottom-8 left-8 right-8 z-20">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-4 mb-4"
                                    >
                                        <span className="px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-black rounded-full shadow-lg uppercase tracking-[0.2em] border border-white/10">
                                            {selectedArticle.source}
                                        </span>
                                        <div className="h-[1px] w-12 bg-foreground/20" />
                                        <span className="text-[10px] font-black text-foreground/60 uppercase tracking-[0.2em]">Verified Stream</span>
                                    </motion.div>

                                    <motion.h2
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="text-2xl sm:text-4xl font-black text-foreground leading-[1.15] tracking-tight max-w-3xl"
                                    >
                                        {selectedArticle.title}
                                    </motion.h2>
                                </div>
                            </div>

                            <div className="p-8 sm:p-12 overflow-y-auto flex-1 bg-gradient-to-b from-background to-muted/20 custom-scrollbar selection:bg-primary/30">
                                <div className="max-w-3xl mx-auto space-y-10">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-y border-border/50"
                                    >
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t.broadcastDate}</p>
                                            <div className="flex items-center gap-2 text-foreground/80 font-bold">
                                                <Calendar className="h-4 w-4 text-foreground/30" />
                                                {new Date(selectedArticle.publishedAt).toLocaleDateString(undefined, {
                                                    month: 'long', day: 'numeric', year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t.protocolStatus}</p>
                                            <div className="flex items-center gap-2 text-emerald-500 font-black italic">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                {t.verifiedIntel}
                                            </div>
                                        </div>
                                        <div className="hidden sm:block space-y-1">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t.originNetwork}</p>
                                            <div className="flex items-center gap-2 text-foreground/80 font-bold">
                                                <Globe className="h-4 w-4 text-foreground/30" />
                                                {activeTab === 'local' && cityName ? `${cityName} Safety` : t.globalSafety}
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="space-y-8"
                                    >
                                        <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed font-medium first-letter:text-5xl first-letter:font-black first-letter:text-primary first-letter:mr-3 first-letter:float-left first-letter:leading-none">
                                            {selectedArticle.description}
                                        </p>

                                        <div className="relative p-8 rounded-[24px] bg-primary/5 border border-primary/20 group overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <ExternalLink className="h-24 w-24 text-primary" />
                                            </div>
                                            <div className="relative z-10">
                                                <h6 className="font-black text-primary text-xs uppercase tracking-[0.2em] mb-3">{t.intelDirective}</h6>
                                                <p className="text-sm text-foreground/60 leading-relaxed mb-8 italic max-w-xl">
                                                    "This intelligence brief is synthesized from the Guardian Network's verified data conduits. For the exhaustive investigative file and original documentation from <span className="text-primary font-bold">{selectedArticle.source}</span>, please proceed to the source terminal below."
                                                </p>
                                                <a
                                                    href={selectedArticle.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/50 group/btn active:scale-95"
                                                >
                                                    {t.accessTerminal}
                                                    <ExternalLink className="h-4 w-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                                                </a>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
