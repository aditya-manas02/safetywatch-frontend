import { Suspense, lazy } from "react";
import { MapPin } from "lucide-react";

const RealHeatmap = lazy(() => import("@/components/RealHeatmap"));

export default function MapPage() {
  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
          <MapPin className="h-3.5 w-3.5" />
          Live Incident Map
        </div>
        <h1 className="text-2xl font-black">Safety Heatmap</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time incident density across your area</p>
      </div>

      {/* Full Map */}
      <div className="flex-1 px-4 pb-4">
        <div className="rounded-2xl overflow-hidden border border-border h-full min-h-[60vh]">
          <Suspense
            fallback={
              <div className="h-full w-full bg-muted/20 animate-pulse flex items-center justify-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Loading Heatmap...
              </div>
            }
          >
            <RealHeatmap />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
