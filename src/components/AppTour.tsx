import { useEffect, useState, useCallback } from "react";
import { Joyride, CallBackProps, STATUS, Step, TooltipRenderProps, EVENTS, ACTIONS } from "react-joyride";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

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
      key={index}
      initial={{ opacity: 0, scale: 0.88, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 16 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        borderRadius: "18px",
        maxWidth: "360px",
        minWidth: "300px",
        overflow: "hidden",
        boxShadow: isDark
          ? "0 30px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)"
          : "0 30px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
      }}
    >
      {/* Orange gradient header with progress bar */}
      <div style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", padding: "16px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "10px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            SafetyWatch Tour · {index + 1}/{size}
          </span>
          <button
            {...closeProps}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              cursor: "pointer",
              color: "white",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Animated progress bar */}
        <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.25)", borderRadius: "99px", overflow: "hidden" }}>
          <motion.div
            style={{ height: "100%", backgroundColor: "white", borderRadius: "99px", originX: 0 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: (index + 1) / size }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: "20px 22px 4px", color: isDark ? "#f1f5f9" : "#0f172a", lineHeight: 1.6 }}>
        {step.content}
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 22px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          {...skipProps}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: isDark ? "#64748b" : "#94a3b8",
            fontSize: "12px",
            fontWeight: 600,
            padding: "6px 4px",
          }}
        >
          Skip Tour
        </button>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {index > 0 && (
            <button
              {...backProps}
              style={{
                background: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                border: "none",
                borderRadius: "9px",
                padding: "8px 14px",
                cursor: "pointer",
                color: isDark ? "#cbd5e1" : "#475569",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              ← Back
            </button>
          )}
          <motion.button
            {...primaryProps}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              border: "none",
              borderRadius: "9px",
              padding: "8px 18px",
              cursor: "pointer",
              color: "white",
              fontSize: "13px",
              fontWeight: 800,
              boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
            }}
          >
            {continuous ? (index === size - 1 ? "Finish 🎉" : "Next →") : "Got it!"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main AppTour Component ───────────────────────────────────────────────────
export default function AppTour() {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
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
              Let's take a 2-minute tour of all the critical safety features available to keep you and your neighborhood safe.
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
            <h3 style={{ fontWeight: 700, marginBottom: "6px", margin: "0 0 6px" }}>📡 Intelligence Feed</h3>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>
              This live ticker at the top constantly streams real-time security signals, incident alerts, and system status updates from the command center.
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
              Click here to report suspicious activities, hazards, fires, or any safety concern in your area. Your report is reviewed and shared with the community to keep everyone informed.
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
              Your personal notification center. Emergency broadcasts, SOS alerts from neighbors, and all important safety updates appear here in real-time.
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
              Create or join private Circles to coordinate with neighbors, apartment buildings, or local watch groups. Share alerts only with people you trust.
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
              Shows verified incidents reported within a 10km radius of your current location. Always be aware of what is happening around you.
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
              Participate in quick polls to help local authorities understand neighborhood safety concerns. Every vote shapes better community decisions.
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
              You now know all the key features. You can replay this tour anytime from the <strong>"App Tour"</strong> button in the menu. Stay safe and stay vigilant!
            </p>
          </div>
        ),
        placement: "center",
        disableBeacon: true,
      },
    ];

    return allSteps.filter(
      (step) => step.target === "body" || document.querySelector(step.target as string)
    );
  }, []);

  const startTour = useCallback(() => {
    // Full reset first — this fixes "only works once" bug
    setRun(false);
    setStepIndex(0);
    setSteps([]);

    const tourSteps = buildSteps();

    // Short delay to let React flush the reset before starting
    setTimeout(() => {
      setSteps(tourSteps);
      setTimeout(() => setRun(true), 60);
    }, 60);
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

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, action } = data;

    // Track step navigation manually for reliable stepIndex control
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      setStepIndex(0);
      localStorage.setItem("has_seen_app_tour", "true");
    }
  };

  // Custom tooltip that receives isDark via closure
  const TooltipWithTheme = useCallback(
    (props: TooltipRenderProps) => <CustomTooltip {...props} isDark={isDark} />,
    [isDark]
  );

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      showSkipButton
      disableScrollParentFix
      disableOverlayClose
      tooltipComponent={TooltipWithTheme}
      callback={handleJoyrideCallback}
      floaterProps={{
        disableAnimation: false,
        styles: {
          floater: { filter: "none" },
        },
      }}
      styles={{
        options: {
          primaryColor: "#f97316",
          zIndex: 100000,
          overlayColor: "rgba(0,0,0,0.52)",
          spotlightShadow: "0 0 0 9999px rgba(0,0,0,0.52)",
        },
        spotlight: {
          borderRadius: "12px",
        },
        overlay: {
          mixBlendMode: "normal",
        },
      }}
    />
  );
}
