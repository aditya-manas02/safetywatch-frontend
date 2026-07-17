import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { X, AlertCircle, MapPin, Type, Camera as CameraIcon, Send, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight, Navigation } from "lucide-react";
import MapPicker from "./MapPicker";
import { Switch } from "@/components/ui/switch";
import { MessageSquareOff, MessageSquareText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { motion, AnimatePresence } from "framer-motion";

interface ReportData {
  type: string;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  imageFile: File | null;
  allowMessages: boolean;
}

interface ReportFormProps {
  onClose: () => void;
  onSubmit: (report: ReportData) => Promise<void>;
}

export default function ReportForm({ onClose, onSubmit }: ReportFormProps) {
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    allowMessages: true,
  });

  const [customType, setCustomType] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera
        });

        if (image.webPath) {
          setImagePreview(image.webPath);
          const response = await fetch(image.webPath);
          const blob = await response.blob();
          const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
          setImageFile(file);
        }
      } catch (err) {
        console.warn("Camera cancelled or failed", err);
      }
      return;
    }

    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast({ title: "Camera Error", description: "Could not access camera. Please check permissions.", variant: "destructive" });
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
            setImageFile(file);
            setImagePreview(URL.createObjectURL(blob));
            stopCamera();
          }
        }, "image/jpeg");
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCapturing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      setFormData(prev => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        location: "Current GPS Location"
      }));
      toast({ title: "Location Acquired", description: "GPS coordinates updated successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to get location. Please check permissions.", variant: "destructive" });
    } finally {
      setIsLocating(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.type) {
        toast({ title: "Incomplete", description: "Please select an event type", variant: "destructive" });
        return;
      }
      if (formData.type === "custom" && !customType.trim()) {
        toast({ title: "Incomplete", description: "Please enter your custom event type", variant: "destructive" });
        return;
      }
      if (!formData.title.trim()) {
        toast({ title: "Incomplete", description: "Please enter a signal title", variant: "destructive" });
        return;
      }
      if (!formData.description.trim()) {
        toast({ title: "Incomplete", description: "Please enter an event log description", variant: "destructive" });
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.location.trim()) {
        toast({ title: "Incomplete", description: "Please provide a specific address or location", variant: "destructive" });
        return;
      }
    }
    
    setDirection(1);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalType = formData.type === "custom" ? customType.trim() : formData.type;

    try {
      await onSubmit({
        ...formData,
        type: finalType,
        imageFile,
      });

      toast({ title: "Success", description: "Incident reported successfully" });
      onClose();
    } catch (error) {
      toast({ title: "Error", description: "Failed to report incident", variant: "destructive" });
    }

    setLoading(false);
  };

  // Animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    })
  };

  return (
    <motion.div
      className="fixed inset-0 bg-background/60 backdrop-blur-md z-50 flex items-start justify-center p-4 overflow-y-auto pt-24 sm:pt-28"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-2xl mb-12"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="relative overflow-hidden border-none shadow-premium glass-card flex flex-col h-[75vh] sm:h-auto sm:max-h-[85vh]">
          {/* Progress Bar Header */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-muted">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary via-blue-400 to-primary"
              initial={{ width: "33%" }}
              animate={{ width: `${(currentStep / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="p-6 sm:p-10 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                {currentStep > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-muted transition-all h-10 w-10 mr-1"
                    onClick={handleBack}
                    type="button"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                )}
                <div>
                  <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                      <AlertCircle className="h-5 w-5 text-primary" />
                    </div>
                    New Report
                  </h2>
                  <p className="text-muted-foreground/60 text-xs font-bold uppercase tracking-widest mt-2 ml-13">
                    Step {currentStep} of 3
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-critical/10 hover:text-critical transition-all h-10 w-10"
                onClick={onClose}
                type="button"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Form Body - Scrollable */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto relative min-h-[350px]">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="w-full absolute inset-0"
                >
                  <form onSubmit={handleSubmit} className="space-y-6 pb-2">
                    
                    {/* STEP 1: INCIDENT DETAILS */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                          <Type className="h-3.5 w-3.5 text-primary/60" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Core Data</span>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                              Classification <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={formData.type}
                              onValueChange={(v) => setFormData({ ...formData, type: v })}
                            >
                              <SelectTrigger className="h-12 bg-white/40 dark:bg-muted/30 border-none ring-1 ring-border/50 focus:ring-primary/20 rounded-xl shadow-sm text-sm font-semibold">
                                <SelectValue placeholder="Event Type" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-border/40 shadow-premium backdrop-blur-xl bg-white/90 dark:bg-card/90 max-h-[300px]">
                                <SelectItem value="theft" className="font-semibold">Theft / Burglary</SelectItem>
                                <SelectItem value="vandalism" className="font-semibold">Property Damage</SelectItem>
                                <SelectItem value="suspicious" className="font-semibold">Suspicious Activity</SelectItem>
                                <SelectItem value="assault" className="font-semibold">Safety Threat / Assault</SelectItem>
                                <SelectItem value="fire" className="font-semibold">Fire / Smoke</SelectItem>
                                <SelectItem value="medical" className="font-semibold">Medical Emergency</SelectItem>
                                <SelectItem value="hazard" className="font-semibold">Natural Hazard / Disaster</SelectItem>
                                <SelectItem value="traffic" className="font-semibold">Traffic / Road Accident</SelectItem>
                                <SelectItem value="infrastructure" className="font-semibold">Infrastructure Failure</SelectItem>
                                <SelectItem value="nuisance" className="font-semibold">Noise / Public Nuisance</SelectItem>
                                <SelectItem value="missing" className="font-semibold">Missing Person / Pet</SelectItem>
                                <SelectItem value="harassment" className="font-semibold">Harassment / Stalking</SelectItem>
                                <SelectItem value="other" className="font-semibold">General Alert</SelectItem>
                                <SelectItem value="custom" className="font-bold text-primary">Write Custom Type...</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <AnimatePresence>
                            {formData.type === "custom" && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 overflow-hidden"
                              >
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                                  Custom Event Type <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  className="h-12 bg-primary/5 border-none ring-1 ring-primary/20 focus-visible:ring-primary rounded-xl shadow-sm text-sm font-semibold text-primary"
                                  placeholder="e.g. Wildlife Sighting"
                                  value={customType}
                                  onChange={(e) => setCustomType(e.target.value)}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                              Signal Title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              className="h-12 bg-white/40 dark:bg-muted/30 border-none ring-1 ring-border/50 focus-visible:ring-primary/20 rounded-xl shadow-sm text-sm font-semibold"
                              placeholder="Identified subject..."
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                              Event Log <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                              className="bg-white/40 dark:bg-muted/30 border-none ring-1 ring-border/50 focus-visible:ring-primary/20 resize-none rounded-xl shadow-sm text-sm font-semibold p-4"
                              rows={4}
                              placeholder="Comprehensive description of the situation..."
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: LOCATION */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between pb-2 border-b border-muted/50">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Location Tracking</span>
                          </div>
                          
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-[10px] font-bold rounded-full px-3"
                            onClick={handleUseCurrentLocation}
                            disabled={isLocating}
                          >
                            {isLocating ? (
                              <RefreshCw className="h-3 w-3 animate-spin mr-1.5" />
                            ) : (
                              <Navigation className="h-3 w-3 mr-1.5" />
                            )}
                            {isLocating ? "Locating..." : "Use GPS"}
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold flex items-center gap-1.5 ml-1">
                              Specific Address <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              className="h-12 bg-muted/40 border-none ring-1 ring-border/50 focus-visible:ring-primary/20 rounded-xl font-semibold"
                              placeholder="Street, landmark, or area..."
                              value={formData.location}
                              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                          </div>

                          <div className="rounded-xl border border-muted/50 overflow-hidden shadow-sm h-[300px]">
                            <MapPicker
                              onSelect={(lat, lng) =>
                                setFormData({
                                  ...formData,
                                  latitude: lat,
                                  longitude: lng,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: EVIDENCE & PRIVACY */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-muted/50">
                          <CameraIcon className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Evidence & Privacy</span>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-3">
                            <Label className="text-xs font-bold flex items-center gap-1.5 ml-1">
                              Upload or Capture Evidence (Optional)
                            </Label>

                            <div className="space-y-4">
                              <div className="flex gap-2">
                                <div className="relative flex-1 group">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    className="h-12 bg-muted/40 border-none ring-1 ring-border/50 focus-visible:ring-primary/20 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 rounded-xl overflow-hidden cursor-pointer"
                                    onChange={handleFileChange}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-12 w-12 rounded-xl border-primary/20 hover:bg-primary/10 transition-colors shrink-0"
                                  onClick={startCamera}
                                >
                                  <CameraIcon className="h-5 w-5 text-primary" />
                                </Button>
                              </div>

                              <AnimatePresence>
                                {isCapturing && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="relative rounded-xl overflow-hidden bg-black shadow-lg"
                                  >
                                    <video ref={videoRef} autoPlay playsInline className="w-full aspect-video object-cover" />
                                    <canvas ref={canvasRef} className="hidden" />
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                                      <Button type="button" size="sm" className="rounded-full px-6 font-bold shadow-xl" onClick={capturePhoto}>
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Capture
                                      </Button>
                                      <Button type="button" size="sm" variant="destructive" className="rounded-full px-4 shadow-xl" onClick={stopCamera}>
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </motion.div>
                                )}

                                {imagePreview && !isCapturing && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative rounded-xl overflow-hidden border border-muted shadow-lg group"
                                  >
                                    <img src={imagePreview} alt="Preview" className="w-full aspect-video object-cover" />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          <div className="bg-primary/[0.03] border border-primary/10 p-5 rounded-2xl flex items-center justify-between group hover:bg-primary/[0.05] transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {formData.allowMessages ? (
                                  <MessageSquareText className="h-4 w-4 text-primary" />
                                ) : (
                                  <MessageSquareOff className="h-4 w-4 text-critical" />
                                )}
                                <Label className="text-sm font-black tracking-tight cursor-pointer">
                                  Community Messaging
                                </Label>
                              </div>
                              <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest pl-6">
                                {formData.allowMessages
                                  ? "Authorized users can contact you."
                                  : "Messaging disabled (Maximum Privacy)."}
                              </p>
                            </div>
                            <Switch
                              checked={formData.allowMessages}
                              onCheckedChange={(checked) => setFormData({ ...formData, allowMessages: checked })}
                              className="data-[state=checked]:bg-primary"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Fixed Footer Buttons */}
            <div className="pt-6 mt-2 border-t border-border/40 flex items-center gap-3 flex-shrink-0 bg-background/50 backdrop-blur-sm z-10">
              {currentStep === 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 h-12 font-bold border-muted-foreground/20 hover:bg-muted/50 rounded-xl"
                >
                  Cancel
                </Button>
              )}
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-12 font-black text-lg shadow-xl shadow-primary/25 rounded-xl hover:scale-[1.01] transition-all"
                >
                  Continue <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 h-12 font-black text-lg shadow-xl shadow-primary/25 rounded-xl hover:scale-[1.01] transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Reporting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Submit Report
                    </>
                  )}
                </Button>
              )}
            </div>

          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
