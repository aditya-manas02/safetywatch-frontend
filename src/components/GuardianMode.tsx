import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, getAuthHeaders } from "@/lib/api";

const GuardianMode = () => {
    const { token, user } = useAuth();
    const [active, setActive] = useState(false);
    const [holding, setHolding] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(false);
    const [activeSOS, setActiveSOS] = useState<any>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (active) {
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setDuration(0);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [active]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startHold = () => {
        if (!token) {
            toast({
                title: "Login Required",
                description: "Please sign in to use Guardian Mode.",
                variant: "destructive"
            });
            return;
        }
        setHolding(true);
        setProgress(0);
        const startTime = Date.now();

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / 2000) * 100, 100); 
            setProgress(newProgress);

            if (newProgress >= 100) {
                activateGuardianMode();
            }
        }, 50);
    };

    const endHold = () => {
        setHolding(false);
        setProgress(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const activateGuardianMode = async () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setHolding(false);
        setProgress(0);
        setLoading(true);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const response = await fetch(`${API_BASE}/incidents/sos`, {
                            method: "POST",
                            headers: getAuthHeaders(token),
                            body: JSON.stringify({
                                latitude: latitude,
                                longitude: longitude,
                                areaCode: user?.areaCode
                            }),
                        });

                        if (!response.ok) throw new Error("Broadcast failed");

                        setActive(true);
                        toast({
                            title: "EMERGENCY BROADCAST ACTIVE",
                            description: "Nearby neighbors and police have been notified.",
                            variant: "destructive",
                            duration: 10000
                        });
                    } catch (err) {
                        toast({
                            title: "Broadcast Error",
                            description: "Failed to notify neighbors. Retrying in background...",
                            variant: "destructive"
                        });
                        setActive(true);
                    } finally {
                        setLoading(false);
                    }
                },
                (error) => {
                    setLoading(false);
                    toast({
                        title: "Location Error",
                        description: "Please enable location to notify nearby help.",
                        variant: "destructive"
                    });
                }
            );
        } else {
            setLoading(false);
            toast({
                title: "Not Supported",
                description: "Location is required for Guardian Mode.",
                variant: "destructive"
            });
        }
    };

    const deactivate = () => {
        setActive(false);
        toast({
            title: "Emergency Mode Deactivated",
            description: "Returning to standard monitoring.",
        });
    };

    // Background check for active SOS in the area
    useEffect(() => {
        const checkActiveSOS = async () => {
            // Safety: Don't poll if on auth page or if token missing
            const isAuthPage = window.location.pathname.startsWith('/auth');
            if (!token || isAuthPage) return;

            try {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(`${API_BASE}/incidents/sos/active?lat=${latitude}&lng=${longitude}`, {
                        headers: getAuthHeaders(token)
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        if (data && (!activeSOS || activeSOS.id !== data.id)) {
                            setActiveSOS(data);
                            console.log("[SOS] Active emergency detected nearby!");
                            
                            // Dispatch custom event to trigger SOSAlert in App.tsx
                            const event = new CustomEvent('sos_alert_received', {
                                detail: {
                                    incidentId: data.id,
                                    userName: data.user || "Someone",
                                    latitude: data.latitude,
                                    longitude: data.longitude
                                }
                            });
                            window.dispatchEvent(event);
                        } else if (!data) {
                            setActiveSOS(null);
                        }
                    }
                }, () => {}, { timeout: 10000 });
            } catch (err) {
                console.error("[SOS] Polling failed", err);
            }
        };

        checkActiveSOS();
        const interval = setInterval(checkActiveSOS, 30000); 
        return () => clearInterval(interval);
    }, [token]);

    return (
        <>
            {/* Floating Action Button - Moved to Left to avoid ChatBot overlap */}
            <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-2">
                <AnimatePresence>
                    {(holding || loading) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-black/80 text-white text-xs px-3 py-1.5 rounded-full mb-2 font-bold backdrop-blur-sm border border-white/10"
                        >
                            {loading ? "Activating Beacon..." : "Hold to Activate SOS"}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative">
                    {/* Progress Ring */}
                    <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none transform -rotate-90">
                        <circle
                            cx="50%"
                            cy="50%"
                            r="30"
                            className="stroke-red-500/20 fill-none"
                            strokeWidth="4"
                        />
                        <circle
                            cx="50%"
                            cy="50%"
                            r="30"
                            className="stroke-red-500 fill-none transition-all duration-75"
                            strokeWidth="4"
                            strokeDasharray="188.4" 
                            strokeDashoffset={188.4 - (188.4 * progress) / 100}
                            strokeLinecap="round"
                        />
                    </svg>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onMouseDown={startHold}
                        onMouseUp={endHold}
                        onMouseLeave={endHold}
                        onTouchStart={startHold}
                        onTouchEnd={endHold}
                        disabled={loading}
                        className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative ${active ? "bg-rose-600 animate-pulse ring-4 ring-rose-500/50" : "bg-card border border-border hover:bg-muted/80"} ${loading ? "opacity-50 cursor-wait" : ""}`}
                    >
                        <ShieldAlert className={`h-6 w-6 ${active ? "text-white" : "text-rose-600"}`} />
                    </motion.button>
                </div>
            </div>

            {/* Full Screen Emergency Overlay */}
            <AnimatePresence>
                {active && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-rose-950/98 backdrop-blur-2xl flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="max-w-md w-full bg-black/40 border-2 border-rose-500/50 p-8 rounded-[2.5rem] shadow-[0_0_80px_rgba(225,29,72,0.4)] space-y-8 backdrop-blur-3xl"
                        >
                            <div className="flex justify-center">
                                <div className="h-28 w-28 rounded-full bg-red-600/30 flex items-center justify-center border-4 border-red-500/50 relative">
                                    <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-40"></div>
                                    <ShieldAlert className="h-14 w-14 text-red-500" />
                                </div>
                            </div>

                            <div className="space-y-4 text-center">
                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Emergency Broadcaster</h2>
                                <p className="text-rose-200/80 text-lg font-medium">
                                    Your live coordinates are being shared with nearby safety agents and verified neighbors.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-red-500/10 p-5 rounded-3xl border border-red-500/20 text-center">
                                    <div className="text-3xl font-black text-white tabular-nums">{formatDuration(duration)}</div>
                                    <div className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mt-1">Duration</div>
                                </div>
                                <div className="bg-red-500/10 p-5 rounded-3xl border border-red-500/20 text-center">
                                    <div className="text-3xl font-black text-white animate-pulse">LIVE</div>
                                    <div className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mt-1">Status</div>
                                </div>
                            </div>

                            <Button
                                onClick={deactivate}
                                size="lg"
                                className="w-full h-16 text-xl font-black bg-white text-rose-950 hover:bg-white/90 rounded-2xl shadow-xl transition-transform active:scale-95"
                            >
                                <X className="mr-3 h-6 w-6" />
                                I AM SAFE - CANCEL
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default GuardianMode;
