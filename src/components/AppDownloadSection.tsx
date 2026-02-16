import { motion } from "framer-motion";
import { Smartphone, Download, CheckCircle2, Shield, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";

const AppDownloadSection = () => {
    // Strict web-only check
    if (Capacitor.isNativePlatform()) return null;

    const downloadUrl = "https://safetywatch-backend.onrender.com/SafetyWatch.apk";

    return (
        <section className="relative py-24 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-5xl mx-auto bg-card/30 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 md:p-16 shadow-2xl relative overflow-hidden group">
                    {/* Interior Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 pointer-events-none" />

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Right Content (Mobile View First) */}
                        <div className="order-2 md:order-1 space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                                <Smartphone className="w-3.5 h-3.5" />
                                Optimal Experience Available
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1]">
                                Take Safety <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Into Your Own Hands.</span>
                            </h2>

                            <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                                Get the full SafetyWatch experience with real-time push alerts, offline maps, and hyper-local security signals.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { icon: Activity, text: "Instant Real-Time Pulse Notifications" },
                                    { icon: Shield, text: "Native Security Binary Protocols" },
                                    { icon: CheckCircle2, text: "Seamless Background Synchronization" }
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-foreground opacity-80">
                                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                            <feature.icon className="w-4 h-4" />
                                        </div>
                                        {feature.text}
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4">
                                <Button
                                    size="lg"
                                    onClick={() => window.open(downloadUrl, '_blank')}
                                    className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all group"
                                >
                                    <Download className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                                    Download Android App
                                </Button>
                                <p className="mt-4 text-[11px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
                                    Direct APK Sync • Version 1.4.6-FINAL
                                </p>
                            </div>
                        </div>

                        {/* Left Phone Mock (Visual Component) */}
                        <div className="order-1 md:order-2 flex justify-center relative">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="relative w-full max-w-[320px] aspect-[9/19] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
                            >
                                {/* Screen Content Mock */}
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900 p-6 flex flex-col gap-6">
                                    <div className="flex justify-between items-center text-[10px] text-white/40 uppercase font-black tracking-widest pt-2">
                                        <span>4G LTE</span>
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span>Sync active</span>
                                        </div>
                                    </div>

                                    <div className="h-2 rounded-full bg-white/5 w-1/3" />

                                    <div className="space-y-4 pt-4">
                                        <div className="h-32 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                            <Activity className="w-12 h-12 text-primary opacity-20" />
                                        </div>
                                        <div className="h-4 rounded-full bg-white/10 w-3/4" />
                                        <div className="h-4 rounded-full bg-white/5 w-1/2" />
                                    </div>

                                    <div className="mt-auto space-y-3 pb-4">
                                        <div className="h-12 rounded-2xl bg-white/5 border border-white/10" />
                                        <div className="h-12 rounded-2xl bg-primary shadow-lg" />
                                    </div>
                                </div>

                                {/* Reflection Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                            </motion.div>

                            {/* Orbital Particles */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-[-40px] pointer-events-none opacity-20"
                            >
                                <div className="absolute top-0 left-1/2 w-4 h-4 bg-primary rounded-full blur-md" />
                                <div className="absolute bottom-1/4 right-0 w-3 h-3 bg-blue-400 rounded-full blur-sm" />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AppDownloadSection;
