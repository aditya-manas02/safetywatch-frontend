import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";

const GuardianMode = () => {
    const { token, user } = useAuth();
    const [active, setActive] = useState(false);
    const [holding, setHolding] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(false);
    const [activeSOS, setActiveSOS] = useState<any>(null);
    const [sosIncidentId, setSosIncidentId] = useState<string | null>(null);
    const [updateMessage, setUpdateMessage] = useState("");
    const [isSendingUpdate, setIsSendingUpdate] = useState(false);
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

        const handleActivation = async (latitude: number, longitude: number) => {
            try {
                const response = await fetch(`${API_BASE}/incidents/sos`, {
                    method: "POST",
                    headers: getAuthHeaders(token),
                    body: JSON.stringify({
                        latitude: latitude,
                        longitude: longitude,
                        areaCode: user?.areaCode
                    }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Broadcast failed");

                if (data.incident?._id) {
                    setSosIncidentId(data.incident._id);
                }

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
                    description: "Failed to connect to servers. Please try again.",
                    variant: "destructive"
                });
                setActive(false);
            } finally {
                setLoading(false);
            }
        };

        try {
            // Check and Request Permissions for Native Platforms
            if (Capacitor.isNativePlatform()) {
                const permStatus = await Geolocation.checkPermissions();
                if (permStatus.location !== 'granted') {
                    const requestStatus = await Geolocation.requestPermissions();
                    if (requestStatus.location !== 'granted') {
                        throw new Error("Permission denied");
                    }
                }
            }

            // STAGE 1: Quick Fix (might be inaccurate)
            let position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: Capacitor.isNativePlatform(),
                timeout: 10000
            });

            // STAGE 2: Refinement (If accuracy is worse than 100m, wait for satellite lock)
            if (position.coords.accuracy && position.coords.accuracy > 100) {
                console.log(`[SOS] Initial accuracy poor (${position.coords.accuracy}m). Waiting for satellite lock...`);
                try {
                    const refined = await Geolocation.getCurrentPosition({
                        enableHighAccuracy: Capacitor.isNativePlatform(),
                        timeout: 10000 // Give it more time to see satellites
                    });
                    if (refined.coords.accuracy < position.coords.accuracy) {
                        position = refined;
                        console.log(`[SOS] Location refined to ${position.coords.accuracy}m accuracy.`);
                    }
                } catch (e) {
                    console.warn("[SOS] Refinement failed, using initial position.");
                }
            }

            await handleActivation(position.coords.latitude, position.coords.longitude);

        } catch (error: any) {
            setLoading(false);
            const isPermissionError = error.message?.includes("denied") || error.code === 1;
            
            toast({
                title: isPermissionError ? "Permission Required" : "Location Error",
                description: isPermissionError 
                    ? "Please grant location access to use Guardian Mode." 
                    : "Failed to get your location. Please check your GPS settings.",
                variant: "destructive"
            });
        }
    };

    const deactivate = async () => {
        try {
            if (token) {
                await fetch(`${API_BASE}/incidents/sos/safe`, {
                    method: "POST",
                    headers: getAuthHeaders(token),
                    body: JSON.stringify(sosIncidentId ? { incidentId: sosIncidentId } : {})
                });
            }
        } catch (err) {
            console.error("Failed to notify safe status:", err);
        }

        setActive(false);
        setSosIncidentId(null);
        toast({
            title: "Emergency Mode Deactivated",
            description: "Returning to standard monitoring.",
        });
    };

    // Live Tracking for active SOS (Sender side)
    useEffect(() => {
        let watchId: any;
        
        if (active && sosIncidentId && token) {
            console.log("[SOS] Starting live location tracking...");
            
            const updateLiveLocation = async (lat: number, lng: number) => {
                try {
                    await fetch(`${API_BASE}/incidents/sos/${sosIncidentId}/location`, {
                        method: "PATCH",
                        headers: getAuthHeaders(token),
                        body: JSON.stringify({ latitude: lat, longitude: lng }),
                        signal: AbortSignal.timeout(5000)
                    });
                } catch (err) {
                    console.warn("[SOS] Live sync failed", err);
                }
            };

            // Use watchPosition for real-time tracking while moving
            Geolocation.watchPosition({
                enableHighAccuracy: Capacitor.isNativePlatform(),
                timeout: 10000
            }, (position) => {
                if (position) {
                    updateLiveLocation(position.coords.latitude, position.coords.longitude);
                }
            }).then(id => {
                watchId = id;
            });
        }

        return () => {
            if (watchId) {
                Geolocation.clearWatch({ id: watchId });
            }
        };
    }, [active, sosIncidentId, token]);

    // Background check for active SOS in the area
    useEffect(() => {
        const checkActiveSOS = async (retryCount = 0) => {
            const isAuthPage = window.location.pathname.startsWith('/auth');
            if (!token || isAuthPage) return;

            try {
                // Use High Accuracy GPS for maximum precision
                const position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: Capacitor.isNativePlatform(),
                    timeout: 15000 // Give GPS more time for high precision
                });

                const { latitude, longitude, accuracy } = position.coords;
                
                // IGNORE weak or invalid locations
                if ((latitude === 0 && longitude === 0) || (accuracy && accuracy > 300)) {
                    console.warn("[SOS] Ignoring inaccurate location:", accuracy, "meters");
                    return;
                }

                const res = await fetch(`${API_BASE}/incidents/sos/active?lat=${latitude}&lng=${longitude}`, {
                    headers: getAuthHeaders(token),
                    signal: AbortSignal.timeout(10000)
                });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data && (!activeSOS || activeSOS.id !== data.id || activeSOS.status !== data.status)) {
                        setActiveSOS(data);
                        console.log(`[SOS] Active emergency nearby! (Accuracy: ${accuracy}m)`);
                        
                        const event = new CustomEvent('sos_alert_received', {
                            detail: {
                                incidentId: data.id,
                                userName: data.user || "Someone",
                                latitude: data.latitude,
                                longitude: data.longitude,
                                status: data.status 
                            }
                        });
                        window.dispatchEvent(event);
                    } else if (!data) {
                        setActiveSOS(null);
                    }
                } else if (res.status >= 500 && retryCount < 1) {
                    setTimeout(() => checkActiveSOS(retryCount + 1), 2000);
                }
            } catch (err: any) {
                if (retryCount < 1) {
                    setTimeout(() => checkActiveSOS(retryCount + 1), 3000);
                }
            }
        };

        checkActiveSOS();
        const interval = setInterval(() => checkActiveSOS(), 10000); 
        return () => clearInterval(interval);
    }, [token, activeSOS]);

    return (
        <>
            {/* Floating Action Button - Moved to avoid ChatBot and Bottom Nav */}
            <div className="fixed bottom-[calc(90px+env(safe-area-inset-bottom))] md:bottom-6 left-6 z-50 flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                    <AnimatePresence>
                        {(holding || loading) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-card/90 text-foreground text-xs px-4 py-2 rounded-xl font-bold backdrop-blur-md border border-border shadow-lg"
                            >
                                {loading ? "Activating Beacon..." : "Hold to Activate SOS"}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Progress Ring */}
                    <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none transform -rotate-90">
                        <circle
                            cx="50%"
                            cy="50%"
                            r="30"
                            className="stroke-destructive/20 fill-none"
                            strokeWidth="4"
                        />
                        <circle
                            cx="50%"
                            cy="50%"
                            r="30"
                            className="stroke-destructive fill-none transition-colors duration-75"
                            strokeWidth="4"
                            strokeDasharray="188.4" 
                            strokeDashoffset={188.4 - (188.4 * (progress || 0)) / 100}
                            strokeLinecap="round"
                        />
                    </svg>

                    <motion.button
                        id="tour-guardian-mode"
                        whileTap={{ scale: 1.15 }}
                        onMouseDown={startHold}
                        onMouseUp={endHold}
                        onMouseLeave={endHold}
                        onTouchStart={startHold}
                        onTouchEnd={endHold}
                        disabled={loading}
                        className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 relative ${active ? "bg-destructive animate-radar-pulse ring-4 ring-destructive/30" : "bg-card border border-border hover:bg-muted/80"} ${loading ? "opacity-50 cursor-wait" : ""}`}
                    >
                        <ShieldAlert className={`h-6 w-6 ${active ? "text-destructive-foreground" : "text-destructive"}`} />
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
                        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-2xl flex items-center justify-center p-6 overflow-hidden"
                    >
                        {/* Radar Ping Screen Edge Effect */}
                        <div className="absolute inset-0 border-[8px] sm:border-[16px] border-destructive/20 pointer-events-none z-0"></div>
                        <div className="absolute inset-0 border-[8px] sm:border-[16px] border-destructive pointer-events-none z-0 animate-radar-ping"></div>

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="max-w-md w-full bg-card border border-destructive/30 p-8 rounded-[2rem] shadow-premium relative z-10 space-y-8"
                        >
                            <div className="flex justify-center mb-2">
                                <div className="h-28 w-28 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/30">
                                    <ShieldAlert className="h-12 w-12 text-destructive" />
                                </div>
                            </div>

                            <div className="space-y-4 text-center">
                                <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground uppercase tracking-tight leading-none">Emergency Broadcast</h2>
                                <p className="text-muted-foreground text-base">
                                    Your live coordinates are being shared with nearby safety agents and verified neighbors.
                                </p>
                            </div>

                            {/* WARNING BOX */}
                            <div className="bg-destructive/10 border border-destructive/20 p-5 rounded-2xl">
                                <p className="text-destructive text-xs font-black uppercase tracking-widest text-center mb-2">Strict Warning</p>
                                <p className="text-foreground text-sm font-medium text-center leading-relaxed">
                                    If the system finds this broadcast fake, strict legal action will be taken against the account owner.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-destructive/5 p-5 rounded-2xl border border-destructive/10 text-center">
                                    <div className="text-3xl font-mono font-bold text-destructive tabular-nums">{formatDuration(duration)}</div>
                                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-2">Duration</div>
                                </div>
                                <div className="bg-destructive/5 p-5 rounded-2xl border border-destructive/10 text-center">
                                    <div className="text-3xl font-display font-black text-destructive animate-radar-pulse">LIVE</div>
                                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-2">Status</div>
                                </div>
                            </div>

                            {/* Send Message Update */}
                            <div className="flex gap-2 h-14">
                                <input
                                    type="text"
                                    placeholder="Type an update..."
                                    value={updateMessage}
                                    onChange={(e) => setUpdateMessage(e.target.value)}
                                    className="flex-1 h-full bg-destructive/10 border border-destructive/30 rounded-xl px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-destructive"
                                />
                                <Button
                                    onClick={async () => {
                                        if (!sosIncidentId || !updateMessage.trim()) return;
                                        setIsSendingUpdate(true);
                                        try {
                                            const res = await fetch(`${API_BASE}/incidents/sos/${sosIncidentId}/message`, {
                                                method: "POST",
                                                headers: getAuthHeaders(token),
                                                body: JSON.stringify({ message: updateMessage.trim() })
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.message || "Failed to send update");
                                            
                                            toast({
                                                title: "Update Sent",
                                                description: "Your message has been broadcasted.",
                                            });
                                            setUpdateMessage("");
                                        } catch (err: any) {
                                            toast({
                                                title: "Error",
                                                description: err.message,
                                                variant: "destructive"
                                            });
                                        } finally {
                                            setIsSendingUpdate(false);
                                        }
                                    }}
                                    disabled={!updateMessage.trim() || isSendingUpdate}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl px-6 h-full"
                                >
                                    {isSendingUpdate ? "..." : "Send"}
                                </Button>
                            </div>

                            <Button
                                onClick={deactivate}
                                size="lg"
                                className="w-full h-16 text-lg font-bold bg-foreground text-background hover:bg-foreground/90 rounded-xl transition-transform active:scale-95 shadow-xl"
                            >
                                <X className="mr-2 h-6 w-6" />
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
