// src/components/admin/CyberIncidentModal.tsx
import { X, Trash2, Star, CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { Button } from "@/components/ui/button";

import { Incident } from "@/types";

export interface CyberIncidentModalProps {
  incident: Incident | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Incident['status']) => void;
  onToggleImportant: (id: string, important: boolean) => void;
  onDelete: (id: string) => void;
}

export default function CyberIncidentModal({
  incident,
  onClose,
  onUpdateStatus,
  onToggleImportant,
  onDelete,
}: CyberIncidentModalProps) {
  if (!incident) return null;

  const imgUrl =
    typeof incident.imageUrl === "string" && incident.imageUrl.trim() !== ""
      ? incident.imageUrl
      : null;

  const statuses: Incident['status'][] = ["pending", "under process", "approved", "rejected", "problem solved"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-card border border-border rounded-xl overflow-hidden shadow-2xl my-auto flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-base md:text-lg font-bold text-foreground line-clamp-1">{incident.title}</h3>
            {incident.isImportant && <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 fill-yellow-500 shrink-0" />}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">

          {/* LEFT SIDE */}
          <div className="md:col-span-2 space-y-4">
            {imgUrl ? (
              <img
                src={imgUrl}
                className="w-full h-48 md:h-80 object-cover rounded-lg border border-border shadow-md"
                alt="Incident"
              />
            ) : (
              <div className="w-full h-48 md:h-64 bg-muted rounded-lg border border-border flex items-center justify-center text-muted-foreground flex-col gap-2">
                <CheckCircle className="h-8 w-8 opacity-20" />
                No Image Provided
              </div>
            )}

            <div className="text-foreground">
              <p className="mb-4 text-sm md:text-base leading-relaxed bg-muted/30 p-4 rounded-lg border border-border/50">{incident.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-4">
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Location</p>
                  <p className="text-sm font-black">{incident.location}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Reported</p>
                  <p className="text-sm font-black">{new Date(incident.createdAt).toLocaleString()}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Category</p>
                  <p className="text-sm capitalize font-black">{incident.type}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <p className="text-muted-foreground text-[10px] uppercase font-bold mb-1">Report ID</p>
                  <p className="text-xs text-muted-foreground/60 font-mono break-all font-medium">{incident._id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="md:col-span-1 space-y-4">

            {/* STATUS MANAGEMENT */}
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <p className="text-muted-foreground text-[10px] uppercase font-bold mb-3 flex items-center gap-2">
                <Clock className="h-3 w-3" /> Management
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-bold">Update Status</label>
                  <select
                    value={incident.status}
                    onChange={(e) => onUpdateStatus(incident._id, e.target.value as Incident['status'])}
                    className="w-full h-10 bg-background border border-border rounded-lg px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer font-bold appearance-none hover:border-primary/50"
                  >
                    {statuses.map(s => (
                      <option key={s} value={s} className="capitalize bg-background text-foreground">{s}</option>
                    ))}
                  </select>
                </div>

                <Button
                  variant={incident.isImportant ? "secondary" : "outline"}
                  className={`w-full justify-start gap-2 h-10 border-border font-bold ${incident.isImportant ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" : ""}`}
                  onClick={() => onToggleImportant(incident._id, !incident.isImportant)}
                >
                  <Star className={`h-4 w-4 ${incident.isImportant ? "fill-yellow-500 text-yellow-500" : ""}`} />
                  {incident.isImportant ? "Marked Important" : "Mark as Important"}
                </Button>

                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2 h-10 font-bold shadow-lg shadow-destructive/10"
                  onClick={() => {
                    if (window.confirm(`Permanently delete this report?`)) {
                      onDelete(incident._id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Delete Report
                </Button>
              </div>
            </div>

            {/* MAP */}
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <p className="text-muted-foreground text-[10px] uppercase font-bold mb-2">Geolocation</p>

              {incident.latitude && incident.longitude ? (
                <div className="rounded-md overflow-hidden border border-border h-44 shadow-inner">
                  <MapPicker
                    onSelect={() => { }}
                    initialPosition={{
                      lat: incident.latitude,
                      lng: incident.longitude,
                    }}
                    readonly
                  />
                </div>
              ) : (
                <div className="h-40 rounded bg-muted/50 border border-border flex items-center justify-center text-muted-foreground text-xs font-medium italic">
                  Coordinates Unavailable
                </div>
              )}
            </div>

            <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground font-bold" onClick={onClose}>
              Close Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
