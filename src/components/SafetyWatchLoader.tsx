import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import packageJson from "../../package.json";

export const SafetyWatchLoader = () => {
    const [progress, setProgress] = useState(0);
    const [version, setVersion] = useState(packageJson.version);

    useEffect(() => {
        // Fetch real version if on native
        if (Capacitor.isNativePlatform()) {
            CapacitorApp.getInfo().then(info => {
                setVersion(info.version);
            }).catch(err => {
                console.error("Loader version fetch error:", err);
                setVersion(packageJson.version);
            });
        }

        const duration = 1500; // Reduced to 1.5 seconds to match App.tsx
        const startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min(100, (elapsed / duration) * 100);

            setProgress(newProgress);

            if (newProgress >= 100) {
                clearInterval(interval);
            }
        }, 50); // Update every 50ms for smooth animation

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[50]">
            {/* Fluid mesh background with strict dark masking */}
            <div className="absolute inset-0 bg-background overflow-hidden">
                <div className="mesh-bg opacity-40 mix-blend-screen" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-8">
                    <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                    <motion.img
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        src="/assets/splash.png"
                        alt="SafetyWatch Logo"
                        className="h-full w-full object-contain relative z-10"
                        style={{ filter: 'drop-shadow(0 0 20px hsl(var(--primary) / 0.4))' }}
                    />
                </div>

                <div className="mt-10 flex flex-col items-center">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-5xl font-black tracking-tighter text-foreground"
                        style={{ filter: 'drop-shadow(0 0 15px hsl(var(--foreground) / 0.2))' }}
                    >
                        SafetyWatch
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="flex items-center gap-2 mt-4"
                    >
                        <div className="h-[1px] w-6 bg-primary/50" />
                        <p className="text-foreground/80 font-mono tracking-[0.4em] text-[10px] font-bold uppercase">
                            v{version} • SAFETYWATCH SECURE
                        </p>
                        <div className="h-[1px] w-6 bg-primary/50" />
                    </motion.div>
                </div>

            </div>

            <div className="absolute bottom-16 flex flex-col items-center gap-4">
                <div className="w-56 h-[3px] bg-foreground/10 rounded-full overflow-hidden relative border border-foreground/5 shadow-md">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 3, ease: [0.65, 0, 0.35, 1] }}
                        className="h-full bg-primary"
                        style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.9)' }}
                    />
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.7, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-[10px] font-black text-foreground tracking-[0.5em] uppercase"
                    style={{ filter: 'drop-shadow(0 0 5px hsl(var(--foreground) / 0.5))' }}
                >
                    Checking for Updates...
                </motion.p>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.7, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                    className="text-[9px] font-medium text-foreground/50 tracking-[0.3em] uppercase"
                >
                    Initializing Secure Systems
                </motion.p>
            </div>
        </div>
    );
};
