import { useEffect, useState } from "react";
import { Joyride, CallBackProps, STATUS, Step } from "react-joyride";
import { useTheme } from "next-themes";

export default function AppTour() {
  const [run, setRun] = useState(false);
  const { theme, systemTheme } = useTheme();

  // Determine actual theme for Joyride styles
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("has_seen_app_tour");
    const isAlreadyLoggedIn = !!localStorage.getItem("token");

    if (!hasSeenTour) {
      if (isAlreadyLoggedIn) {
        // If they already have an account and token, they are an existing user
        // from before the tour was introduced. Mark it as seen so it doesn't pop up.
        localStorage.setItem("has_seen_app_tour", "true");
      } else {
        // Only auto-show for completely new users
        setTimeout(() => setRun(true), 1500);
      }
    }

    const handleStartTour = () => {
      setRun(true);
    };

    window.addEventListener("start-app-tour", handleStartTour);
    return () => window.removeEventListener("start-app-tour", handleStartTour);
  }, []);

  // Build steps dynamically so we only include targets that currently exist on screen
  const getSteps = (): Step[] => {
    const allSteps: Step[] = [
      {
        target: "body",
        content: (
          <div className="text-left">
            <h2 className="text-xl font-bold mb-2 text-primary">Welcome to SafetyWatch! 🛡️</h2>
            <p className="text-sm text-muted-foreground">Let's take a comprehensive tour to show you all the critical safety features of the system.</p>
          </div>
        ),
        placement: "center",
        disableBeacon: true,
      },
      {
        target: "#tour-safety-pulse",
        content: (
          <div className="text-left">
            <h3 className="font-bold mb-1">Intelligence Feed</h3>
            <p className="text-sm">This ticker provides live, encrypted security updates and system status from the command center.</p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-report-btn",
        content: (
          <div className="text-left">
            <h3 className="font-bold mb-1">Report Incidents</h3>
            <p className="text-sm">Use this to report suspicious activities, hazards, or non-urgent issues to keep everyone informed.</p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-guardian-mode",
        content: (
          <div className="text-left">
            <h3 className="font-bold mb-1 text-red-500">Emergency SOS</h3>
            <p className="text-sm">Hold this button ONLY in real emergencies. It broadcasts your live GPS coordinates to authorities and neighbors instantly.</p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-notification-center",
        content: (
          <div className="text-left">
            <h3 className="font-bold mb-1">Alerts & Notifications</h3>
            <p className="text-sm">Check here for important updates, emergency broadcasts, and direct safety alerts sent to you.</p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-navbar-circles",
        content: (
          <div className="text-left">
            <h3 className="font-bold mb-1">Community Circles</h3>
            <p className="text-sm">Join or create private Circles to collaborate with specific neighbors or community watch groups.</p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#nearby-section",
        content: (
          <div className="text-left">
            <h3 className="font-bold mb-1">Local Watch</h3>
            <p className="text-sm">This section tracks and highlights verified incidents within a 10km radius of your location.</p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-heatmap",
        content: (
          <div className="text-left">
            <h3 className="font-bold mb-1">Live Density Heatmap</h3>
            <p className="text-sm">Monitor this heatmap to identify dangerous hotspots and avoid high-risk areas in real-time.</p>
          </div>
        ),
        disableBeacon: true,
      },
      {
        target: "#tour-polls-widget",
        content: (
          <div className="text-left">
            <h3 className="font-bold mb-1">Community Surveys</h3>
            <p className="text-sm">Participate in quick polls to help local authorities understand neighborhood concerns better.</p>
          </div>
        ),
        disableBeacon: true,
      }
    ];

    // Filter out steps where the target doesn't exist in the DOM (except 'body')
    return allSteps.filter(step => step.target === "body" || document.querySelector(step.target as string));
  };

  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (run) {
      setSteps(getSteps());
    }
  }, [run]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
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
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#f97316", // orange-500
          zIndex: 100000,
          backgroundColor: isDark ? "#020817" : "#ffffff", // slate-950 or white
          textColor: isDark ? "#f8fafc" : "#0f172a", // slate-50 or slate-900
          arrowColor: isDark ? "#020817" : "#ffffff",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        buttonNext: {
          backgroundColor: "#f97316",
          borderRadius: "8px",
          fontWeight: "bold",
          color: "#ffffff",
        },
        buttonBack: {
          color: "#f97316",
          fontWeight: "bold",
        },
        buttonSkip: {
          color: isDark ? "#94a3b8" : "#64748b",
        }
      }}
    />
  );
}
