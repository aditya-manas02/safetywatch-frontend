import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import packageJson from "../../package.json";

export const SafetyWatchLoader = () => {
    const [progress, setProgress] = useState(0);
    const [displayVersion, setDisplayVersion] = useState(packageJson.version);

    useEffect(() => {
        // Fetch real version if on native
        if (Capacitor.isNativePlatform()) {
            CapacitorApp.getInfo().then(info => {
                setDisplayVersion(info.version);
            }).catch(err => console.error("Loader version fetch error:", err));
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
        <div className="fixed inset-0 bg-[#020817] flex flex-col items-center justify-center z-[50]">
            {/* Fluid mesh background with strict dark masking */}
            <div className="absolute inset-0 bg-[#020817] overflow-hidden">
                <div className="mesh-bg opacity-40 mix-blend-screen" style={{ backgroundColor: '#020817' }} />
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-8">
                    <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
                    <motion.img
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        src="/assets/splash.png"
                        alt="Nexus AI"
                        className="h-full w-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                    />
                </div>

                <div className="mt-10 flex flex-col items-center">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    >
                        SafetyWatch
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="flex items-center gap-2 mt-4"
                    >
                        <div className="h-[1px] w-6 bg-blue-500/50" />
                        <p className="text-white/80 font-mono tracking-[0.4em] text-[10px] font-bold uppercase">
                            v{displayVersion} • NEXUS AI SECURE
                        </p>
                        <div className="h-[1px] w-6 bg-blue-500/50" />
                    </motion.div>
                </div>

            </div>

            <div className="absolute bottom-16 flex flex-col items-center gap-4">
                <div className="w-56 h-[3px] bg-white/10 rounded-full overflow-hidden relative border border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 3, ease: [0.65, 0, 0.35, 1] }}
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.9)]"
                    />
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.7, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-[10px] font-black text-white tracking-[0.5em] uppercase drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                >
                    Checking for Updates...
                </motion.p>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.7, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                    className="text-[9px] font-medium text-white/50 tracking-[0.3em] uppercase"
                >
                    Initializing Secure Systems
                </motion.p>
            </div>
        </div>
    );
};
