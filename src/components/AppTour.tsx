import { useEffect, useState, useCallback } from "react";
import { Joyride, CallBackProps, STATUS, Step, TooltipRenderProps } from "react-joyride";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

// ─── Custom Animated Tooltip ─────────────────────────────────────────────────
function CustomTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  size,
  isDark,
}: TooltipRenderProps & { isDark: boolean }) {
  return (
    <motion.div
      {...(tooltipProps as any)}
      key={`step-${index}`}
      initial={{ opacity: 0, scale: 0.88, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        borderRadius: "18px",
        maxWidth: "360px",
        minWidth: "300px",
        overflow: "hidden",
        boxShadow: isDark
          ? "0 30px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)"
          : "0 30px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.07)",
      }}
    >
      {/* Gradient header with progress bar */}
      <div style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", padding: "14px 18px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "10px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            SafetyWatch Tour · {index + 1} / {size}
          </span>
          <button
            onClick={closeProps.onClick}
            style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%",
              width: "22px", height: "22px", cursor: "pointer", color: "white",
              fontSize: "13px", display: "flex", alignItems: "center",
              justifyContent: "center", padding: 0,
            }}
          >✕</button>
        </div>
        {/* Animated progress bar */}
        <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.25)", borderRadius: "99px" }}>
          <motion.div
            style={{ height: "100%", backgroundColor: "white", borderRadius: "99px", originX: 0 }}
            initial={false}
            animate={{ scaleX: (index + 1) / size }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "18px 20px 6px", color: isDark ? "#f1f5f9" : "#0f172a", lineHeight: 1.65 }}>
        {step.content}
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 20px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={skipProps.onClick}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: isDark ? "#64748b" : "#94a3b8", fontSize: "12px", fontWeight: 600, padding: "6px 4px",
          }}
        >
          Skip Tour
        </button>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {index > 0 && (
            <button
              onClick={backProps.onClick}
              style={{
                background: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                border: "none", borderRadius: "9px", padding: "8px 14px", cursor: "pointer",
                color: isDark ? "#cbd5e1" : "#475569", fontSize: "13px", fontWeight: 700,
              }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={primaryProps.onClick}
            style={{
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              border: "none", borderRadius: "9px", padding: "8px 18px", cursor: "pointer",
              color: "white", fontSize: "13px", fontWeight: 800,
              boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
              transform: "scale(1)",
              transition: "transform 0.1s ease, box-shadow 0.1s ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)"; }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)"; }}
          >
            {continuous ? (index === size - 1 ? "Finish 🎉" : "Next →") : "Got it!"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main AppTour Component ───────────────────────────────────────────────────
export default function AppTour() {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const { theme, systemTheme } = useTheme();

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const buildSteps = useCallback((): Step[] => {
    const allSteps: Step[] = [
      {
        target: "body",
        content: (
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "8px", color: "#f97316" }}>
              Welcome to SafetyWatch! 🛡️
            </h2>
            <p style={{ fontSize: "0.85rem", opacity: 0.75, margin: 0 }}>
              Let's take a quick tour of all the critical safety features available to keep you and your neighborhood safe.
            </p>
          </div>
        ),
        placement: "center",
        disableBeacon: true,
      },
      {
        target: "#tour-safety-pulse",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>📡 Intelligence Feed</h3>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              This live ticker constantly streams real-time security signals, incident alerts, and system status updates from the command center.
            </p>
          </div>
        ),
        disableBeacon: true,
        placement: "bottom",
      },
      {
        target: "#tour-report-btn",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>📝 Report Incidents</h3>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              Click here to report suspicious activities, hazards, fires, or any safety concern. Your report is reviewed and shared with the community instantly.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-guardian-mode",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px", color: "#ef4444" }}>🆘 Emergency SOS</h3>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              <strong>Hold this button only in real emergencies.</strong> It instantly broadcasts your live GPS location to all nearby neighbors and authorities. Misuse is a serious offence.
            </p>
          </div>
        ),
        disableBeacon: true,
        placement: "right",
      },
      {
        target: "#tour-notification-center",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>🔔 Alerts & Notifications</h3>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              Your personal notification center. Emergency broadcasts, SOS alerts, and all important safety updates appear here in real-time.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-navbar-circles",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>👥 Community Circles</h3>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              Create or join private Circles to coordinate with neighbors, apartment buildings, or local watch groups. Share alerts only with trusted members.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#nearby-section",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>📍 Local Watch</h3>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              Shows verified incidents reported within a 10km radius of your current location. Always stay aware of what is happening around you.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-heatmap",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>🗺️ Live Density Heatmap</h3>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              Red zones indicate high incident activity. Use this interactive map to identify dangerous hotspots and plan safer routes in your area.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-polls-widget",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>📊 Community Surveys</h3>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              Participate in polls to help local authorities understand neighborhood safety concerns. Every vote shapes better community decisions.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "body",
        content: (
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "8px", color: "#f97316" }}>
              You're all set! 🎉
            </h2>
            <p style={{ fontSize: "0.85rem", opacity: 0.75, margin: 0 }}>
              You can replay this tour anytime using the <strong>"App Tour"</strong> button in the menu. Stay safe and stay vigilant!
            </p>
          </div>
        ),
        placement: "center",
        disableBeacon: true,
      },
    ];

    return allSteps;
  }, []);

  // Restart-safe: fully stop, reset steps, then restart with a clean slate
  const startTour = useCallback(() => {
    setRun(false);
    setSteps([]);
    setTimeout(() => {
      const tourSteps = buildSteps();
      setSteps(tourSteps);
      setTimeout(() => setRun(true), 80);
    }, 100);
  }, [buildSteps]);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("has_seen_app_tour");
    const isAlreadyLoggedIn = !!localStorage.getItem("token");

    if (!hasSeenTour) {
      if (isAlreadyLoggedIn) {
        localStorage.setItem("has_seen_app_tour", "true");
      } else {
        setTimeout(startTour, 1800);
      }
    }

    window.addEventListener("start-app-tour", startTour);
    return () => window.removeEventListener("start-app-tour", startTour);
  }, [startTour]);

  // Only handle tour end — let Joyride manage step navigation internally
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      localStorage.setItem("has_seen_app_tour", "true");
    }
  };

  // Inject isDark into the tooltip via closure — avoids passing extra prop
  const ThemedTooltip = useCallback(
    (props: TooltipRenderProps) => <CustomTooltip {...props} isDark={isDark} />,
    [isDark]
  );

  if (!steps.length || !run) {
    return (
      <Joyride
        steps={[]}
        run={false}
        callback={handleJoyrideCallback}
      />
    );
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showSkipButton
      disableScrollParentFix={false}
      disableOverlayClose
      scrollOffset={120}
      spotlightClicks={true}
      tooltipComponent={ThemedTooltip}
      callback={handleJoyrideCallback}
      floaterProps={{ disableAnimation: false }}
      styles={{
        options: {
          primaryColor: "#f97316",
          zIndex: 100000,
          overlayColor: "rgba(0,0,0,0.6)",
          spotlightShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
        },
        spotlight: { borderRadius: "18px" },
      }}
    />
  );
}
