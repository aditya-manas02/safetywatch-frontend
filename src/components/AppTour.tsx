import { useEffect, useState, useCallback } from "react";
import { Joyride, CallBackProps, STATUS, Step } from "react-joyride";
import { useTheme } from "next-themes";

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
          <div className="text-left">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "8px", color: "#f97316" }}>
              Welcome to SafetyWatch! 🛡️
            </h2>
            <p style={{ fontSize: "0.85rem", opacity: 0.75 }}>
              Let's take a comprehensive tour of all the critical safety features in this system.
            </p>
          </div>
        ),
        placement: "center",
        disableBeacon: true,
      },
      {
        target: "#tour-safety-pulse",
        content: (
          <div className="text-left">
            <h3 style={{ fontWeight: 700, marginBottom: "6px" }}>📡 Intelligence Feed</h3>
            <p style={{ fontSize: "0.85rem" }}>
              This live ticker at the top shows real-time security signals, incident alerts, and network status updates from the command center.
            </p>
          </div>
        ),
        disableBeacon: true,
        placement: "bottom",
      },
      {
        target: "#tour-report-btn",
        content: (
          <div className="text-left">
            <h3 style={{ fontWeight: 700, marginBottom: "6px" }}>📝 Report Incidents</h3>
            <p style={{ fontSize: "0.85rem" }}>
              Click here to report suspicious activities, hazards, fires, or any safety concern in your area. Your report will be reviewed and shared with the community.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-guardian-mode",
        content: (
          <div className="text-left">
            <h3 style={{ fontWeight: 700, marginBottom: "6px", color: "#ef4444" }}>🆘 Emergency SOS</h3>
            <p style={{ fontSize: "0.85rem" }}>
              <strong>Hold this red button only in real emergencies.</strong> It instantly broadcasts your live GPS location to all nearby neighbors and authorities. Misuse is a strict offence.
            </p>
          </div>
        ),
        disableBeacon: true,
        placement: "right",
      },
      {
        target: "#tour-notification-center",
        content: (
          <div className="text-left">
            <h3 style={{ fontWeight: 700, marginBottom: "6px" }}>🔔 Alerts & Notifications</h3>
            <p style={{ fontSize: "0.85rem" }}>
              Your personal notification center. Emergency broadcasts, SOS alerts from neighbors, and important safety updates will appear here in real-time.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-navbar-circles",
        content: (
          <div className="text-left">
            <h3 style={{ fontWeight: 700, marginBottom: "6px" }}>👥 Community Circles</h3>
            <p style={{ fontSize: "0.85rem" }}>
              Join or create private Circles to collaborate with specific neighbors, apartment residents, or community watch groups. Share alerts only with trusted members.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#nearby-section",
        content: (
          <div className="text-left">
            <h3 style={{ fontWeight: 700, marginBottom: "6px" }}>📍 Local Watch</h3>
            <p style={{ fontSize: "0.85rem" }}>
              This section shows verified incidents reported within a 10km radius of your current location. Always stay aware of what's happening around you.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-heatmap",
        content: (
          <div className="text-left">
            <h3 style={{ fontWeight: 700, marginBottom: "6px" }}>🗺️ Live Density Heatmap</h3>
            <p style={{ fontSize: "0.85rem" }}>
              The heatmap shows incident hotspots in your area. Red zones have high activity. Use this to plan safer routes and avoid dangerous locations.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-polls-widget",
        content: (
          <div className="text-left">
            <h3 style={{ fontWeight: 700, marginBottom: "6px" }}>📊 Community Surveys</h3>
            <p style={{ fontSize: "0.85rem" }}>
              Participate in quick polls to help local authorities understand neighborhood safety concerns. Every vote contributes to better community decisions.
            </p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "body",
        content: (
          <div className="text-left">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "8px", color: "#f97316" }}>
              You're all set! 🎉
            </h2>
            <p style={{ fontSize: "0.85rem", opacity: 0.75 }}>
              You can replay this tour anytime by clicking the <strong>"App Tour"</strong> button in the menu. Stay safe and stay vigilant!
            </p>
          </div>
        ),
        placement: "center",
        disableBeacon: true,
      },
    ];

    // Only include steps where the DOM target exists (except 'body' steps)
    return allSteps.filter(
      (step) => step.target === "body" || document.querySelector(step.target as string)
    );
  }, []);

  // Single function that builds steps and then starts the tour with a small delay
  // to ensure React has committed the steps state before Joyride reads it.
  const startTour = useCallback(() => {
    const tourSteps = buildSteps();
    setSteps(tourSteps);
    // Small delay ensures steps are in state before run=true triggers Joyride
    setTimeout(() => setRun(true), 80);
  }, [buildSteps]);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("has_seen_app_tour");
    const isAlreadyLoggedIn = !!localStorage.getItem("token");

    if (!hasSeenTour) {
      if (isAlreadyLoggedIn) {
        // Silently mark as seen for existing users — don't auto-show
        localStorage.setItem("has_seen_app_tour", "true");
      } else {
        // Auto-show for brand new users after page loads
        setTimeout(startTour, 1500);
      }
    }

    window.addEventListener("start-app-tour", startTour);
    return () => window.removeEventListener("start-app-tour", startTour);
  }, [startTour]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      localStorage.setItem("has_seen_app_tour", "true");
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      disableScrollParentFix
      callback={handleJoyrideCallback}
      locale={{
        back: "← Back",
        close: "Close",
        last: "Finish Tour ✓",
        next: "Next →",
        skip: "Skip Tour",
      }}
      styles={{
        options: {
          primaryColor: "#f97316",
          zIndex: 100000,
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          textColor: isDark ? "#f1f5f9" : "#0f172a",
          arrowColor: isDark ? "#0f172a" : "#ffffff",
          overlayColor: "rgba(0, 0, 0, 0.55)",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltip: {
          borderRadius: "14px",
          padding: "20px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        },
        buttonNext: {
          backgroundColor: "#f97316",
          borderRadius: "8px",
          fontWeight: "bold",
          color: "#ffffff",
          padding: "8px 18px",
        },
        buttonBack: {
          color: "#f97316",
          fontWeight: "bold",
          marginRight: "8px",
        },
        buttonSkip: {
          color: isDark ? "#94a3b8" : "#64748b",
          fontWeight: "500",
        },
        buttonClose: {
          color: isDark ? "#94a3b8" : "#64748b",
        },
        beacon: {
          inner: "#f97316",
          outer: "#f9731650",
        },
      }}
    />
  );
}
