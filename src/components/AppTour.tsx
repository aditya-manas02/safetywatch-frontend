import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";

export default function AppTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("has_seen_app_tour");
    if (!hasSeenTour) {
      // Small delay to let the app load fully before starting the tour
      setTimeout(() => setRun(true), 1500);
    }

    const handleStartTour = () => {
      setRun(true);
    };

    window.addEventListener("start-app-tour", handleStartTour);
    return () => window.removeEventListener("start-app-tour", handleStartTour);
  }, []);

  const steps: Step[] = [
    {
      target: "body",
      content: (
        <div className="text-left">
          <h2 className="text-xl font-bold mb-2 text-primary">Welcome to SafetyWatch! 🛡️</h2>
          <p className="text-sm text-muted-foreground">Let's take a quick 30-second tour to show you how to keep yourself and your neighborhood safe.</p>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: "#tour-report-btn",
      content: (
        <div className="text-left">
          <h3 className="font-bold mb-1">Report Incidents</h3>
          <p className="text-sm">Use this button to report suspicious activities, hazards, or non-urgent incidents in your area. This helps keep everyone informed.</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: "#tour-guardian-mode",
      content: (
        <div className="text-left">
          <h3 className="font-bold mb-1 text-red-500">Emergency SOS</h3>
          <p className="text-sm">Hold this button ONLY in real emergencies. It immediately broadcasts your live location to all nearby users and authorities.</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: "#tour-navbar-circles",
      content: (
        <div className="text-left">
          <h3 className="font-bold mb-1">Your Community Circles</h3>
          <p className="text-sm">Join or create private Circles to collaborate with specific neighbors, building members, or community watch groups.</p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: "#tour-heatmap",
      content: (
        <div className="text-left">
          <h3 className="font-bold mb-1">Live Heatmap</h3>
          <p className="text-sm">Check the heatmap to see incident density in your area. This helps you identify and avoid dangerous hotspots.</p>
        </div>
      ),
      disableBeacon: true,
    }
  ];

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
          backgroundColor: "#ffffff",
          textColor: "#000000",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        buttonNext: {
          backgroundColor: "#f97316",
          borderRadius: "8px",
          fontWeight: "bold",
        },
        buttonBack: {
          color: "#f97316",
          fontWeight: "bold",
        },
        buttonSkip: {
          color: "#64748b",
        }
      }}
    />
  );
}
