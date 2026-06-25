import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { motion } from "framer-motion";
import { MapPin, Loader2 } from "lucide-react";
import { API_BASE, VERSION_HEADERS } from "@/lib/api";

export default function RealHeatmap() {
  const mapRef = useRef<L.Map | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [heatLayer, setHeatLayer] = useState<L.Layer | null>(null);
  const [markerLayer, setMarkerLayer] = useState<L.LayerGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [incidentCount, setIncidentCount] = useState(0);

  useEffect(() => {
    const container = document.getElementById("real-heatmap");
    if (!container || mapRef.current) return;

    try {
      const newMap = L.map("real-heatmap", {
        center: [31.25, 75.70],
        zoom: 12,
        zoomControl: false,
        preferCanvas: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "",
      }).addTo(newMap);

      mapRef.current = newMap;
      setMap(newMap);
    } catch (err) {
      console.error("Map init error:", err);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map) return;

    let isMounted = true;

    async function loadHeatPoints() {
      try {
        const res = await fetch(`${API_BASE}/incidents/coords/all`, {
          headers: VERSION_HEADERS
        });
        if (!res.ok) throw new Error("Failed to fetch coordinates");
        const data = await res.json();

        if (!isMounted || !map) return;

        // 1. Prepare Heat Points
        const heatPoints = data
          .filter((i: any) => i.latitude && i.longitude)
          .map((i: any) => [i.latitude, i.longitude, 0.5]);

        setIncidentCount(heatPoints.length);

        // 2. Handle Heat Layer
        if (heatLayer) {
          map.removeLayer(heatLayer);
        }

        // @ts-expect-error - L.heatLayer comes from plugin
        const newHeatLayer = L.heatLayer(heatPoints, {
          radius: 35,
          blur: 20,
          maxZoom: 15,
          gradient: {
            0.0: '#0D9488', // Teal
            0.5: '#F59E0B', // Amber
            1.0: '#DC2626'  // Red
          }
        }).addTo(map);

        if (isMounted) setHeatLayer(newHeatLayer);

        // 3. Handle Marker Layer (Custom Pins)
        if (markerLayer) {
          map.removeLayer(markerLayer);
        }

        const markers: L.Layer[] = [];
        data.forEach((i: any) => {
          if (i.latitude && i.longitude) {
            // Use amber (warning) for pins unless it's a critical SOS
            const isCritical = i.status === "EMERGENCY" || i.type === "sos";
            const ringColor = isCritical ? "border-destructive animate-radar-ping" : "border-amber-500/50 animate-slow-breathe";
            const pinColor = isCritical ? "bg-destructive text-destructive-foreground" : "bg-amber-500 text-white";

            const customIcon = L.divIcon({
              className: "bg-transparent border-none",
              html: `
                      <div class="relative flex items-center justify-center w-8 h-8 group cursor-pointer">
                        <span class="absolute inset-[-4px] rounded-full border-2 ${ringColor}"></span>
                        <div class="relative flex items-center justify-center ${pinColor} rounded-full p-1.5 shadow-lg border-2 border-background transform hover:scale-110 transition-transform duration-200">
                           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                      </div>
                    `,
              iconSize: [32, 32],
              iconAnchor: [16, 28], // Anchor at bottom center approx
              popupAnchor: [0, -24]
            });

            const marker = L.marker([i.latitude, i.longitude], { icon: customIcon })
              .bindPopup(`<div class='font-sans text-xs font-bold'>${i.title || "Incident Point"}</div>`);
            markers.push(marker);
          }
        });

        if (isMounted && map) {
          const newMarkerLayer = L.layerGroup(markers).addTo(map);
          setMarkerLayer(newMarkerLayer);
        }

      } catch (err) {
        console.error("Heatmap load error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHeatPoints();

    return () => {
      isMounted = false;
    };
  }, [map]);

  return (
    <motion.div
      className="relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="bg-primary/5 border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h4 className="font-display font-bold text-sm">Live Heatmap</h4>
        </div>
        {!loading && (
          <span className="text-xs text-muted-foreground font-mono font-medium">
            {incidentCount} incidents
          </span>
        )}
      </div>

      {/* Map Container */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}

        <div
          id="real-heatmap"
          className="w-full h-48 relative z-0"
        />
      </div>

      {/* Footer Info & Legend */}
      <div className="bg-muted/30 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border font-medium">
        <span>Real-time density</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider opacity-70">Low</span>
          <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-teal-600 via-amber-500 to-red-600"></div>
          <span className="text-[10px] uppercase tracking-wider opacity-70">High</span>
        </div>
      </div>
    </motion.div>
  );
}
