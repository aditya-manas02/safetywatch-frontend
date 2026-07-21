import { useEffect, useState, useCallback } from "react";
import { Joyride, CallBackProps, STATUS, Step, TooltipRenderProps } from "react-joyride";
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
      <div style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))", padding: "14px 18px 12px" }}>
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
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
              border: "none", borderRadius: "9px", padding: "8px 18px", cursor: "pointer",
              color: "white", fontSize: "13px", fontWeight: 800,
              boxShadow: "0 4px 14px hsl(var(--primary) / 0.4)",
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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const buildSteps = useCallback((): Step[] => {
    const isMobile = window.innerWidth < 768;

    const allSteps: Step[] = [
      {
        target: "body",
        content: (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "8px", color: "hsl(var(--primary))" }}>
              Welcome to SafetyWatch! 🛡️
            </h2>
            <p style={{ fontSize: "0.9rem", opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
              Your ultimate community safety companion. Let's take a comprehensive tour of all the critical features designed to keep you and your neighborhood secure.
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
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>📡 Live Intelligence Feed</h3>
            <p style={{ fontSize: "0.9rem", margin: 0, opacity: 0.85, lineHeight: 1.5 }}>
              This ticker constantly streams real-time security signals, incident alerts, and system status updates straight from the command center to keep you informed up-to-the-minute.
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
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>📝 Report & Protect</h3>
            <p style={{ fontSize: "0.9rem", margin: 0, opacity: 0.85, lineHeight: 1.5 }}>
              Notice something suspicious? A local hazard? Use this button to instantly report it. Your report will be quickly verified and broadcasted to alert the entire community.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-guardian-mode",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px", color: "#ef4444" }}>🆘 Guardian SOS</h3>
            <p style={{ fontSize: "0.9rem", margin: 0, opacity: 0.85, lineHeight: 1.5 }}>
              <strong>For extreme emergencies only.</strong> Activating this instantly broadcasts your live GPS coordinates to nearby neighbors and your registered emergency contacts via SMS & Telegram.
            </p>
          </div>
        ),
        disableBeacon: true,
        placement: "right",
      },
      {
        target: isMobile ? "#tour-notification-center-mobile" : "#tour-notification-center-desktop",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>🔔 Real-Time Alerts</h3>
            <p style={{ fontSize: "0.9rem", margin: 0, opacity: 0.85, lineHeight: 1.5 }}>
              Your personal safety inbox. Emergency broadcasts, SOS alerts, direct messages from neighbors, and important local updates will all appear right here.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      // Conditional desktop-only steps
      ...(!isMobile ? [
        {
          target: "#tour-navbar-circles",
          content: (
            <div>
              <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>👥 Private Circles</h3>
              <p style={{ fontSize: "0.9rem", margin: 0, opacity: 0.85, lineHeight: 1.5 }}>
                Safety is a team effort. Create or join exclusive Circles to coordinate privately with neighbors, your apartment building, or a local watch group.
              </p>
            </div>
          ),
          disableBeacon: true,
        }
      ] : []),
      {
        target: "#nearby-section",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>📍 Local Watch Radar</h3>
            <p style={{ fontSize: "0.9rem", margin: 0, opacity: 0.85, lineHeight: 1.5 }}>
              Stay hyper-aware of your surroundings. This section dynamically filters and displays verified incidents reported within a 10km radius of your current location.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#popular-section",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>🔥 Trending Alerts</h3>
            <p style={{ fontSize: "0.9rem", margin: 0, opacity: 0.85, lineHeight: 1.5 }}>
              Discover the most critical and highly-discussed safety issues in your wider area right now. Stay informed on what the community is focusing on.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-heatmap",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>🗺️ Density Heatmap</h3>
            <p style={{ fontSize: "0.9rem", margin: 0, opacity: 0.85, lineHeight: 1.5 }}>
              A powerful visual tool. Glowing red zones highlight historical and active incident hotspots, helping you identify dangerous areas and plan the safest travel routes.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-polls-widget",
        content: (
          <div>
            <h3 style={{ fontWeight: 700, margin: "0 0 6px" }}>📊 Community Voice</h3>
            <p style={{ fontSize: "0.9rem", margin: 0, opacity: 0.85, lineHeight: 1.5 }}>
              Your opinion matters! Participate in safety polls and surveys. Your votes directly influence local authorities and help shape better neighborhood policies.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "body",
        content: (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "8px", color: "hsl(var(--primary))" }}>
              You're all set! 🎉
            </h2>
            <p style={{ fontSize: "0.9rem", opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
              Remember, you can restart this tour anytime from the menu. Stay vigilant, stay connected, and let's keep our neighborhood safe together!
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
      disableScrollParentFix={true}
      disableOverlayClose
      scrollOffset={150}
      spotlightClicks={true}
      tooltipComponent={ThemedTooltip}
      callback={handleJoyrideCallback}
      floaterProps={{ disableAnimation: true }}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          zIndex: 100000,
          overlayColor: "rgba(0,0,0,0.6)",
          spotlightShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
        },
        spotlight: { borderRadius: "18px" },
      }}
    />
  );
}
