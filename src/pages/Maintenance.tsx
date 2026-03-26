import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import { SafetyWatchLoader } from "@/components/SafetyWatchLoader";
import AnimatedBackground from "@/components/AnimatedBackground";
import { motion } from "framer-motion";
import { Hammer, Clock, ShieldCheck } from "lucide-react";

const Maintenance = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/system/config`);
        const data = await res.json();
        setConfig(data);
        
        // If maintenance is OFF, redirect back to home
        if (data && !data.isMaintenanceMode) {
          window.location.href = "/";
        }
      } catch (e) {
        console.error("Failed to fetch system status", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <SafetyWatchLoader />;

  const backTime = config?.maintenanceExpectedBackAt 
    ? new Date(config.maintenanceExpectedBackAt).toLocaleString([], { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }) 
    : "Soon";

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full bg-slate-900/60 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-12 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/10 blur-[100px] rounded-full" />

          <div className="relative z-10">
            <div className="mb-8 inline-flex items-center justify-center p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <Hammer className="w-12 h-12 text-blue-400 animate-pulse" />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Systems <span className="text-blue-400">Upgrading</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              {config?.maintenanceMessage || "SafetyWatch is currently undergoing scheduled maintenance to improve your experience."}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                <Clock className="w-6 h-6 text-blue-400 shrink-0" />
                <div className="text-left">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Estimated Return</p>
                  <p className="text-slate-100 font-medium">{backTime}</p>
                </div>
              </div>
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Status</p>
                  <p className="text-slate-100 font-medium">Data Secured</p>
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-sm">
              Our team is working hard to bring everything back online safely. 
              Thank you for your patience.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatedBackground>
  );
};

export default Maintenance;
