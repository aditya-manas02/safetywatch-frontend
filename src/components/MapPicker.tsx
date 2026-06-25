import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "./ui/button";
import { Navigation } from "lucide-react";
import { toast } from "sonner";

// Custom premium marker for the picker
const customPickerIcon = L.divIcon({
  className: "bg-transparent border-none",
  html: `
    <div class="relative flex items-center justify-center w-8 h-8 group cursor-pointer">
      <span class="absolute inset-[-4px] rounded-full border-2 border-primary/50 animate-slow-breathe"></span>
      <div class="relative flex items-center justify-center bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg border-2 border-background transform transition-transform duration-200">
         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 28],
});

interface MapPickerProps {
  onSelect: (lat: number, lng: number) => void;
  initialPosition?: { lat: number; lng: number } | null;
  readonly?: boolean;
}

function LocationButton({ onSelect, setPosition }: {
  onSelect: (lat: number, lng: number) => void;
  setPosition: (pos: { lat: number; lng: number }) => void;
}) {
  const map = useMap();

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const toastId = toast.loading("Fetching location...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos = { lat: latitude, lng: longitude };
        setPosition(newPos);
        onSelect(latitude, longitude);
        map.setView(newPos, 16);
        toast.success("Location updated", { id: toastId });
      },
      (err) => {
        console.error(err);
        let msg = "Could not get location";
        if (err.code === 1) msg = "Location permission denied";
        toast.error(msg, { id: toastId });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <Button
        type="button"
        size="sm"
        onClick={handleLocate}
        className="shadow-md bg-card hover:bg-primary/10 text-primary border border-primary/30 font-bold px-4 py-2 rounded-xl transition-all"
      >
        <Navigation className="h-4 w-4 mr-2" />
        Use My Location
      </Button>
    </div>
  );
}

export default function MapPicker({ onSelect, initialPosition, readonly }: MapPickerProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(initialPosition || null);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        if (readonly) return;
        setPosition(e.latlng);
        onSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const center = initialPosition || { lat: 28.6139, lng: 77.2090 };

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-border shadow-sm relative bg-muted/20">
      <MapContainer
        center={center}
        zoom={initialPosition ? 16 : 13}
        className="w-full h-full z-0"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {!readonly && <MapEvents />}
        {!readonly && <LocationButton onSelect={onSelect} setPosition={setPosition} />}
        {position && <Marker position={position} icon={customPickerIcon} />}
      </MapContainer>
    </div>
  );
}
