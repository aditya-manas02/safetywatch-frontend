import React, { useState, useRef, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const SOSButton: React.FC = () => {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const HOLD_DURATION = 3000; // 3 seconds

  const handleStart = () => {
    if (!token) {
      toast({
        title: "Login Required",
        description: "Please log in to use the SOS feature.",
        variant: "destructive",
      });
      return;
    }

    setIsHolding(true);
    setProgress(0);

    const startTime = Date.now();
    
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(progressRef.current!);
      }
    }, 50);

    timerRef.current = setTimeout(triggerSOS, HOLD_DURATION);
  };

  const handleEnd = () => {
    setIsHolding(false);
    setProgress(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  const triggerSOS = async () => {
    handleEnd();

    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Error",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(`${API_BASE}/incidents/sos`, {
            method: "POST",
            headers: getAuthHeaders(token),
            body: JSON.stringify({
              latitude,
              longitude,
              areaCode: user?.areaCode
            }),
          });

          const data = await response.json();
          if (response.ok) {
            toast({
              title: "🚨 SOS ALERT SENT",
              description: "Nearby users and police have been notified.",
              className: "bg-red-600 text-white border-none",
            });
          } else {
            throw new Error(data.message || "Failed to send SOS");
          }
        } catch (error: any) {
          toast({
            title: "SOS Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      },
      (error) => {
        toast({
          title: "Location Access Denied",
          description: "Please enable location services to use SOS.",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="fixed bottom-32 left-8 z-[10001] flex flex-col items-center gap-2 pointer-events-auto">
      <div className="relative">
        {/* Progress ring */}
        {isHolding && (
          <svg className="absolute -inset-2 h-20 w-20 -rotate-90 transform">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="white"
              strokeWidth="4"
              fill="transparent"
              className="opacity-20"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="red"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={226}
              strokeDashoffset={226 - (226 * progress) / 100}
              className="transition-all duration-75"
            />
          </svg>
        )}
        
        <button
          onMouseDown={handleStart}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchEnd={handleEnd}
          className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-2xl transition-transform active:scale-90 ${
            isHolding ? "animate-pulse" : ""
          }`}
        >
          <AlertCircle size={32} />
        </button>
      </div>
      <span className="text-xs font-bold text-red-600 drop-shadow-md">
        {isHolding ? "HOLDING..." : "SOS"}
      </span>
    </div>
  );
};

export default SOSButton;
