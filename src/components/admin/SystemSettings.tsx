import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { 
  ShieldAlert, 
  Save, 
  RotateCcw, 
  Clock, 
  MessageSquare, 
  AlertTriangle,
  Server
} from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  token: string | null;
}

export default function SystemSettings({ token }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    isMaintenanceMode: false,
    maintenanceMessage: "",
    maintenanceExpectedBackAt: ""
  });

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/system/config`);
      const data = await res.json();
      setConfig({
        isMaintenanceMode: data.isMaintenanceMode || false,
        maintenanceMessage: data.maintenanceMessage || "",
        maintenanceExpectedBackAt: data.maintenanceExpectedBackAt ? new Date(data.maintenanceExpectedBackAt).toISOString().slice(0, 16) : ""
      });
    } catch (e) {
      toast({ title: "Error fetching system config", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/system/maintenance`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(token),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isMaintenanceMode: config.isMaintenanceMode,
          maintenanceMessage: config.maintenanceMessage,
          maintenanceExpectedBackAt: config.maintenanceExpectedBackAt ? new Date(config.maintenanceExpectedBackAt).toISOString() : null
        })
      });

      if (!res.ok) throw new Error("Failed to update");
      
      toast({ 
        title: config.isMaintenanceMode ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled",
        description: "Global system configuration has been updated.",
        variant: config.isMaintenanceMode ? "destructive" : "default" 
      });
    } catch (e) {
      toast({ title: "Error saving settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RotateCcw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
            <Server className="text-primary h-6 w-6" /> System Operations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage global application state and maintenance windows.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Deploying..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MAINTENANCE TOGGLE */}
        <div className={`col-span-1 p-6 rounded-2xl border transition-all duration-500 ${
          config.isMaintenanceMode 
            ? "bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-500/10" 
            : "bg-card border-border shadow-sm"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <ShieldAlert className={config.isMaintenanceMode ? "text-rose-500" : "text-muted-foreground"} />
            <div 
              onClick={() => setConfig({ ...config, isMaintenanceMode: !config.isMaintenanceMode })}
              className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                config.isMaintenanceMode ? "bg-rose-500" : "bg-muted"
              }`}
            >
              <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                config.isMaintenanceMode ? "translate-x-7" : "translate-x-0"
              }`} />
            </div>
          </div>
          <h3 className="font-bold text-lg mb-1">Maintenance Mode</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When enabled, all regular users will be redirected to the maintenance page. Only Super Admins can access the dashboard.
          </p>
        </div>

        {/* DETAILS SECTION */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" /> Maintenance Message
                </label>
                <textarea
                  value={config.maintenanceMessage}
                  onChange={(e) => setConfig({ ...config, maintenanceMessage: e.target.value })}
                  placeholder="Tell users why we are down..."
                  className="w-full bg-muted/50 border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none min-h-[100px] transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock className="h-3 w-3" /> Estimated Back Online
                </label>
                <input
                  type="datetime-local"
                  value={config.maintenanceExpectedBackAt}
                  onChange={(e) => setConfig({ ...config, maintenanceExpectedBackAt: e.target.value })}
                  className="w-full bg-muted/50 border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {config.isMaintenanceMode && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-4"
            >
              <AlertTriangle className="text-amber-500 h-6 w-6 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-600">Critical Warning</p>
                <p className="text-xs text-amber-700/80 leading-relaxed">
                  Enabling maintenance mode will immediately disconnect all active citizens. 
                  Ensure your broadcast message is clear about the reason and duration.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
