import React from "react";
import { AlertTriangle, MapPin, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SOSAlertProps {
  incidentId: string;
  userName: string;
  latitude: number;
  longitude: number;
  status?: string;
  onClose: () => void;
}

const SOSAlert: React.FC<SOSAlertProps> = ({ incidentId, userName, latitude, longitude, status, onClose }) => {
  const isSafe = status === "problem solved";
  const { token } = useAuth();
  const { toast } = useToast();

  const handleNavigate = () => {
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent);

    if (isAndroid) {
      window.open(`geo:0,0?q=${latitude},${longitude}(Emergency+Location)`, "_system");
    } else if (isIOS) {
      window.open(`maps://?daddr=${latitude},${longitude}`, "_system");
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, "_blank");
    }
  };

  const handleReportFake = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/incidents/${incidentId}/report`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          reportedUserId: "system", // This should ideally be the user who triggered it, but we'll use 'system' for the incident context
          reason: "Fake SOS Alert / Misuse of Emergency Button",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Report Submitted",
          description: "Admin will verify this alert. Misuse of the SOS button is a serious offence.",
        });
        onClose();
      } else {
        throw new Error(data.message || "Failed to submit report");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-premium animate-in zoom-in-95 duration-300 border-2 ${isSafe ? 'border-emerald-500' : 'border-destructive'}`}>
        <div className={`${isSafe ? 'bg-emerald-500' : 'bg-destructive'} p-6 text-center text-white`}>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
            {isSafe ? <ShieldAlert size={48} className="text-white" /> : <ShieldAlert size={48} className="text-white animate-slow-breathe" />}
          </div>
          <h2 className="text-2xl font-display font-black uppercase tracking-tight">
            {isSafe ? "Emergency Resolved" : "Emergency Alert"}
          </h2>
          <p className="mt-1 text-sm font-medium opacity-90">
            {isSafe ? "The situation is under control." : "Someone is in danger near you!"}
          </p>
        </div>

        <div className="p-6">
          <div className={`mb-6 flex items-start gap-4 rounded-xl p-4 border ${isSafe ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
            <AlertTriangle className={`mt-1 h-6 w-6 shrink-0 ${isSafe ? 'text-emerald-500' : 'text-destructive'}`} />
            <div>
              <p className={`text-sm font-bold ${isSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}`}>
                {isSafe ? `${userName} is safe now.` : `${userName} needs help!`}
              </p>
              <p className="text-xs mt-1 text-muted-foreground">
                {isSafe ? "The user has marked themselves as safe." : "Triggered from a nearby location. Verified GPS coords available."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!isSafe && (
              <Button 
                onClick={handleNavigate}
                className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
              >
                <MapPin className="mr-2 h-5 w-5" />
                NAVIGATE
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleReportFake}
              className={`h-12 border-destructive/30 text-destructive hover:bg-destructive/10 font-bold rounded-xl ${isSafe ? 'col-span-2' : ''}`}
            >
              REPORT FAKE
            </Button>
          </div>

          <Button 
            variant="ghost" 
            onClick={onClose}
            className="mt-4 w-full text-muted-foreground hover:text-foreground rounded-xl"
          >
            DISMISS
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SOSAlert;
