import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE } from "@/lib/api";
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
  requestType: string;
  masterCategory: string;
  category: string;
  subCategory: string;
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

const CATEGORY_DATA: Record<string, any> = {
  "Emergency & SOS": {
    "Medical & Health": {
      "Ambulance Required": ["Critical/Life-Threatening", "Non-Critical", "Accident Response", "Maternity"],
      "Urgent Care": ["Cardiac Arrest", "Poisoning", "Severe Bleeding", "Burn Injury", "Allergic Reaction"],
      "Medical Supplies": ["Oxygen Cylinder Required", "Blood Requirement", "Urgent Medications", "Wheelchair/Stretcher"],
      "Home Health": ["Elderly Assistance Emergency", "Patient Care / Nurse Required", "Psychiatric Crisis"]
    },
    "Police & Law Enforcement": {
      "Theft & Burglary": ["Vehicle Theft", "Home Break-in", "Shop/Commercial Break-in", "Personal Item Snatched", "Pickpocketing"],
      "Violence & Assault": ["Physical Assault", "Domestic Violence", "Mob/Riot", "Armed Robbery", "Kidnapping/Abduction"],
      "Harassment & Threats": ["Verbal Abuse", "Stalking", "Eve Teasing", "Extortion", "Intimidation"],
      "Suspicious & Illegal": ["Unknown Persons Loitering", "Abandoned Vehicle", "Unattended Baggage", "Drug Activity", "Prostitution/Illegal Trade"],
      "Cybercrime": ["Financial Fraud", "Identity Theft", "Online Harassment", "Hacking Incident"]
    },
    "Fire & Rescue": {
      "Fire Incident": ["Residential Building Fire", "Commercial Complex Fire", "Outdoor/Wildfire", "Vehicle Fire", "Electrical Fire"],
      "Rescue Operations": ["Trapped Person (Elevator)", "Trapped Person (Building Collapse)", "Animal Rescue", "Drowning Incident", "Suicide Attempt"]
    },
    "Disaster Management": {
      "Natural Hazards": ["Flooding/Waterlogging", "Earthquake Damage", "Severe Storm/Cyclone Impact", "Landslide", "Tsunami"],
      "Man-made Hazards": ["Gas Leak", "Chemical Spill", "Structural Collapse", "Radiation/Toxics", "Massive Explosion"]
    }
  },
  "Civic & Municipal Infrastructure": {
    "Roads & Pavements": {
      "Surface Damage": ["Potholes", "Broken Pavement/Footpath", "Open Manhole", "Cave-in/Sinkhole"],
      "Obstructions": ["Dead Animal on Road", "Construction Debris", "Fallen Tree/Branches", "Waterlogging"],
      "Road Safety": ["Illegal Speed Breakers", "Missing Signage", "No Reflectors", "Blind Spot Danger"]
    },
    "Traffic & Transport": {
      "Traffic Issues": ["Broken/Faulty Signal", "Severe Traffic Jam", "Accident Zone/Blockage"],
      "Parking Violations": ["Illegal Parking on Street", "Abandoned Vehicles", "Blocking Driveway", "No Parking Zone Violation"],
      "Public Transport": ["Bus Stop Damage", "Metro/Train Issue", "Public Bus Breakdown", "Auto/Taxi Harassment"]
    },
    "Water & Sanitation": {
      "Water Supply": ["No Water Supply", "Low Water Pressure", "Contaminated/Dirty Water", "Major Pipe Burst/Leak", "Illegal Water Connection"],
      "Drainage & Sewage": ["Blocked Drain", "Sewage Overflow", "Missing Manhole Cover", "Foul Smell/Stagnant Water"],
      "Waste Management": ["Garbage Dump Mounding", "Irregular Trash Collection", "Medical Waste Dumping", "Hazardous Waste"],
      "Public Hygiene": ["Public Toilet Unclean/Broken", "Spitting/Public Urination", "Pest/Rodent Breeding Ground"]
    },
    "Electricity & Power": {
      "Power Outages": ["Total Area Blackout", "Frequent Tripping", "Phase Drop/Low Voltage", "Scheduled Outage Exceeded"],
      "Electrical Hazards": ["Sparking/Hanging Wires", "Fallen Power Lines", "Broken Utility Pole", "Open Transformer/Junction Box"],
      "Street Lighting": ["Streetlight Not Working", "Streetlight On During Day", "Pole Damage"]
    },
    "Public Spaces & Environment": {
      "Parks & Recreation": ["Park Maintenance Needed", "Broken Playground Equipment", "No Lighting in Park", "Anti-social Elements in Park"],
      "Vandalism & Aesthetics": ["Graffiti", "Illegal Hoardings/Posters", "Broken Public Benches/Assets", "Statue/Monument Damage"],
      "Pollution": ["Air Pollution/Toxic Smoke", "Industrial Discharge", "Noise Pollution (Factories)", "Water Body Contamination"]
    }
  },
  "Society & Residential Community": {
    "Common Area Maintenance": {
      "Elevators & Lifts": ["Elevator Malfunction", "Stuck Elevator", "Door Sensor Issue", "Fan/Light Broken in Lift"],
      "Cleaning & Hygiene": ["Corridor Cleaning Required", "Garbage Chute Blocked", "Basement Cleaning", "Pest Infestation in Common Area"],
      "Structural & Core": ["Roof/Terrace Leakage", "Seepage in Common Walls", "Staircase Damage", "Paint Peeling"],
      "Amenities": ["Gym Equipment Broken", "Pool Unclean/Chemical Imbalance", "Clubhouse AC/Lighting Issue", "Garden Sprinklers Broken"]
    },
    "Community Security": {
      "Guards & Personnel": ["Security Guard Absent", "Guard Sleeping/Unattentive", "Rude Behavior"],
      "Access Control": ["Unauthorized Entry", "Gate/Barrier Malfunction", "Boom Barrier Broken", "Intercom Not Working"],
      "Surveillance & Perimeter": ["CCTV Camera Broken/Blind Spot", "Boundary Wall Breach", "Barbed Wire Damage", "Poor Perimeter Lighting"]
    },
    "Community Rules & Disputes": {
      "Neighbor Disputes": ["Loud Music/Party (Late Night)", "Pet Nuisance/Poop", "Water Dropping from Balcony", "Verbal Altercation"],
      "Parking & Vehicles": ["Wrong Parking in Assigned Slot", "Speeding Inside Premises", "Visitor Parking Abuse"],
      "Compliance": ["Illegal Alteration/Construction", "Commercial Activity in Residential Zone", "Encroachment of Common Area", "Unpaid Dues/Maintenance"]
    }
  },
  "Household Fixes & Maintenance": {
    "Plumbing": {
      "Leaks & Blockages": ["Leaking Tap/Faucet", "Blocked Sink/Drain", "Blocked Toilet", "Pipe Burst/Major Leak"],
      "Installations & Fixes": ["Water Heater/Geyser Repair", "Water Purifier Fix", "Flush Tank Malfunction", "Shower Repair"],
      "Tanks & Motors": ["Water Motor Not Working", "Overhead Tank Cleaning", "Underground Sump Cleaning"]
    },
    "Electrical": {
      "Wiring & Power": ["Internal Short Circuit", "MCB Tripping Frequently", "No Power in Specific Room", "Switch/Socket Replacement"],
      "Appliances": ["Fan/Light Fix", "AC Not Cooling", "AC Gas Leak / Servicing", "Inverter/Battery Issue"],
      "Kitchen Appliances": ["Refrigerator Repair", "Washing Machine Repair", "Microwave Repair", "Chimney Cleaning/Repair"]
    },
    "Carpentry & Civil": {
      "Carpentry": ["Furniture Repair", "Door/Window Hinge Fix", "Lock Replacement", "Cabinet/Wardrobe Fix"],
      "Civil Work": ["Seepage/Dampness in Internal Walls", "Painting Request", "Tile/Floor Damage", "False Ceiling Repair"],
      "Glass & Aluminum": ["Broken Window Pane", "Sliding Door Stuck", "Mosquito Mesh Repair"]
    },
    "Cleaning & Pest Control": {
      "Deep Cleaning": ["Full House Deep Cleaning", "Sofa/Carpet Shampooing", "Bathroom Deep Clean", "Kitchen Deep Clean"],
      "Pest Control": ["Mosquito/Dengue Spraying", "Rodent/Rat Issue", "Termite Treatment", "Bedbug Control", "Cockroach Gel Treatment"]
    },
    "IT & Tech Support": {
      "Networking": ["Internet/Broadband Down", "Router Configuration", "Wi-Fi Dead Zones"],
      "Devices": ["PC/Laptop Repair", "Printer Not Working", "Smart Home Device Issue"],
      "Entertainment": ["TV Display Issue", "DTH/Cable No Signal", "Home Theater Setup"]
    }
  },
  "Enquiries, Admin & Information": {
    "Municipal / Government": {
      "Billing & Taxes": ["Property Tax Query", "Water Bill Discrepancy", "Electricity Bill Query"],
      "Documents & IDs": ["Voter ID Info", "Aadhaar/PAN Services", "Ration Card Query", "Passport Verification"],
      "Schemes & Services": ["Government Schemes Info", "Pension Query", "Public Transport Passes"]
    },
    "Society / Community Admin": {
      "Billing & Admin": ["Maintenance Bill Query", "Payment Failure/Receipt", "Account Statement Request"],
      "Permissions & Forms": ["Move-in / Move-out Pass", "Tenant Verification Form", "Vehicle Sticker/Tag Registration", "Renovation Permission"],
      "Facilities": ["Clubhouse/Party Hall Booking", "Guest Room Booking", "Sports Court Booking"]
    },
    "Civic Rules & Policies": {
      "Guidelines": ["Parking Guidelines", "Pet Policies", "Waste Segregation Rules", "Construction Timings"],
      "RWA/HOA": ["By-laws Clarification", "Election Procedures", "AGM Minutes Request"]
    },
    "Events & Notices": {
      "Schedules": ["Upcoming Community Events", "Meeting Schedules", "Festivals / Celebrations"],
      "Alerts": ["Emergency Drills", "Water/Power Cut Notices", "Health Camp Info"]
    }
  },
  "University & Campus": {
    "Campus Security": {
      "Incidents": ["Theft in Hostel/Campus", "Harassment/Ragging", "Suspicious Outsider", "Substance Abuse"],
      "Access & Gates": ["ID Card Issue", "Gate Pass Issue", "Vehicle Entry Denied", "Hostel Curfew Violation"]
    },
    "Hostel & Dorm Maintenance": {
      "Room Fixes": ["Fan/Light Broken", "Bed/Furniture Broken", "Window/Door Lock Issue", "Pest/Bedbug Issue"],
      "Washrooms": ["No Hot Water", "Blocked Toilet", "Cleaning Required", "Broken Mirror/Tap"]
    },
    "Academic Blocks & Facilities": {
      "Classroom/Lab": ["Projector Not Working", "AC/Fan Not Working", "Lab Equipment Broken", "Broken Desks"],
      "Library & WiFi": ["Campus WiFi Down", "Library Noise Disturbance", "Missing Books", "E-Library Access Issue"]
    },
    "Events & Admin": {
      "Administration": ["Fee Payment Issue", "Scholarship Query", "Document/Transcript Request", "Exam Grievance"],
      "Events/Fests": ["Event Registration Issue", "Crowd Management Needed", "Lost & Found"]
    }
  },
  "Feedback & Suggestions": {
    "App & Platform Experience": {
      "Technical Issues": ["Bug Report", "App Crash", "UI/UX Issue", "Login/OTP Issues"],
      "Enhancements": ["Feature Request", "General Suggestion", "Performance Feedback"]
    },
    "Staff & Personnel": {
      "Security Personnel": ["Excellent Service", "Rude Behavior", "Negligence of Duty", "Training Requirement"],
      "Maintenance Staff": ["Plumber/Electrician Feedback", "Cleaning Staff Feedback", "Pest Control Feedback"],
      "Management/Municipal": ["RWA/Committee Feedback", "Municipal Worker Feedback", "Police Responsiveness"]
    },
    "Civic Amenities & Improvements": {
      "Infrastructure": ["Road Safety Suggestion", "Park Improvement Request", "Better Street Lighting Needed"],
      "Environment": ["Better Waste Management Ideas", "Tree Plantation Request", "Rainwater Harvesting Suggestion"],
      "Community": ["Public Library Setup", "Stray Animal Shelter Setup", "Community Kitchen/Pantry"]
    }
  }
};

const AREA_TYPE_FILTERS: Record<string, string[]> = {
  "university": ["Emergency & SOS", "University & Campus", "Feedback & Suggestions"],
  "society": ["Emergency & SOS", "Society & Residential Community", "Household Fixes & Maintenance", "Enquiries, Admin & Information", "Feedback & Suggestions"],
  "city": ["Emergency & SOS", "Civic & Municipal Infrastructure", "Enquiries, Admin & Information", "Feedback & Suggestions"],
  "ward": ["Emergency & SOS", "Civic & Municipal Infrastructure", "Enquiries, Admin & Information", "Feedback & Suggestions"],
  "default": ["Emergency & SOS", "Civic & Municipal Infrastructure", "Society & Residential Community", "Household Fixes & Maintenance", "Enquiries, Admin & Information", "Feedback & Suggestions"]
};

export default function ReportForm({ onClose, onSubmit }: ReportFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [areaType, setAreaType] = useState("default");

  useEffect(() => {
    if (user?.areaCode && user.areaCode !== "DEFAULT") {
      fetch(`${API_BASE}/auth/verify-area-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaCode: user.areaCode })
      })
      .then(res => res.json())
      .then(data => {
        if (data.valid && data.areaCode?.areaType) {
          setAreaType(data.areaCode.areaType);
        }
      })
      .catch(console.error);
    }
  }, [user, API_BASE]);

  const [formData, setFormData] = useState<ReportData>({
    type: "other",
    requestType: "",
    masterCategory: "",
    category: "",
    subCategory: "",
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
      let lat, lng;
      
      // On web/desktop, high accuracy often fails or hangs indefinitely without a GPS chip.
      if (Capacitor.isNativePlatform()) {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } else {
        // Fallback for Web/Windows
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
             reject(new Error("Browser does not support geolocation"));
             return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false, // Prevents hanging on Windows
            timeout: 30000, // Increased to 30 seconds
            maximumAge: 60000
          });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }

      let addressName = "Current Location";
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const geoData = await geoRes.json();
        if (geoData && geoData.display_name) {
          addressName = geoData.display_name;
        }
      } catch (e) {
        console.warn("Reverse geocoding failed", e);
      }

      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        location: addressName
      }));
      toast({ title: "Location Acquired", description: "GPS coordinates updated successfully." });
    } catch (error: any) {
      console.warn("Location error:", error);
      
      // Fallback to IP Geolocation
      try {
        const ipRes = await fetch("https://ipapi.co/json/");
        const ipData = await ipRes.json();
        if (ipData && ipData.latitude && ipData.longitude) {
          let fallbackAddress = "Approximate Location";
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${ipData.latitude}&lon=${ipData.longitude}&zoom=18&addressdetails=1`);
            const geoData = await geoRes.json();
            if (geoData && geoData.display_name) {
              fallbackAddress = geoData.display_name;
            }
          } catch (e) {
            console.warn("Reverse geocoding fallback failed", e);
          }

          setFormData(prev => ({
            ...prev,
            latitude: ipData.latitude,
            longitude: ipData.longitude,
            location: fallbackAddress
          }));
          toast({ title: "Location Acquired", description: "Approximate location fetched via IP." });
          setIsLocating(false);
          return;
        }
      } catch (ipErr) {
        console.error("IP fallback also failed:", ipErr);
      }

      let errorMsg = error.message || "Failed to get location. Ensure Location Services are enabled.";
      if (error.code === 1) errorMsg = "Permission denied. Please allow location access in your browser/system settings.";
      if (error.code === 2) errorMsg = "Position unavailable. Device cannot determine location. Please check Windows Privacy settings.";
      if (error.code === 3) errorMsg = "Location request timed out. Try again.";
      toast({ title: "Location Error", description: errorMsg, variant: "destructive", duration: 7000 });
    } finally {
      setIsLocating(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.requestType || !formData.masterCategory || !formData.category || !formData.subCategory) {
        toast({ title: "Incomplete", description: "Please complete all classification steps", variant: "destructive" });
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

    try {
      await onSubmit({
        ...formData,
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
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                                Request Type <span className="text-destructive">*</span>
                              </Label>
                              <Select
                                value={formData.requestType}
                                onValueChange={(v) => setFormData({ ...formData, requestType: v, masterCategory: "", category: "", subCategory: "" })}
                              >
                                <SelectTrigger className="h-12 bg-white/40 dark:bg-muted/30 border-none ring-1 ring-border/50 focus:ring-primary/20 rounded-xl shadow-sm text-sm font-semibold">
                                  <SelectValue placeholder="Select Request Type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/40 shadow-premium backdrop-blur-xl bg-white/90 dark:bg-card/90 max-h-[300px]">
                                  {(AREA_TYPE_FILTERS[areaType] || AREA_TYPE_FILTERS["default"]).map(key => (
                                    <SelectItem key={key} value={key} className="font-semibold">{key}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {formData.requestType && (
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                                  Master Category <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={formData.masterCategory}
                                  onValueChange={(v) => setFormData({ ...formData, masterCategory: v, category: "", subCategory: "" })}
                                >
                                  <SelectTrigger className="h-12 bg-white/40 dark:bg-muted/30 border-none ring-1 ring-border/50 focus:ring-primary/20 rounded-xl shadow-sm text-sm font-semibold">
                                    <SelectValue placeholder="Select Master Category" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl border-border/40 shadow-premium backdrop-blur-xl bg-white/90 dark:bg-card/90 max-h-[300px]">
                                    {Object.keys(CATEGORY_DATA[formData.requestType]).map(key => (
                                      <SelectItem key={key} value={key} className="font-semibold">{key}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {formData.masterCategory && (
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                                  Category <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={formData.category}
                                  onValueChange={(v) => setFormData({ ...formData, category: v, subCategory: "" })}
                                >
                                  <SelectTrigger className="h-12 bg-white/40 dark:bg-muted/30 border-none ring-1 ring-border/50 focus:ring-primary/20 rounded-xl shadow-sm text-sm font-semibold">
                                    <SelectValue placeholder="Select Category" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl border-border/40 shadow-premium backdrop-blur-xl bg-white/90 dark:bg-card/90 max-h-[300px]">
                                    {Object.keys(CATEGORY_DATA[formData.requestType][formData.masterCategory]).map(key => (
                                      <SelectItem key={key} value={key} className="font-semibold">{key}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {formData.category && (
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                                  Sub-Category <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={formData.subCategory}
                                  onValueChange={(v) => {
                                    // Also set a default 'type' based on selection for backward compatibility with icons
                                    let inferredType = "other";
                                    const mc = formData.masterCategory.toLowerCase();
                                    const cat = formData.category.toLowerCase();
                                    if (mc.includes("medical") || mc.includes("care")) inferredType = "medical";
                                    else if (mc.includes("police")) {
                                      if (cat.includes("theft") || cat.includes("robbery") || cat.includes("pickpocketing")) inferredType = "theft";
                                      else if (cat.includes("assault") || cat.includes("violence") || cat.includes("mob")) inferredType = "assault";
                                      else if (cat.includes("harassment") || cat.includes("threat")) inferredType = "harassment";
                                      else inferredType = "suspicious";
                                    }
                                    else if (mc.includes("fire") || mc.includes("rescue") || mc.includes("disaster") || mc.includes("hazard")) inferredType = "fire";
                                    else if (mc.includes("traffic") || mc.includes("transport") || cat.includes("parking")) inferredType = "traffic";
                                    else if (mc.includes("water") || mc.includes("sanitation") || mc.includes("electricity") || mc.includes("power") || mc.includes("road") || mc.includes("plumbing") || mc.includes("electrical") || mc.includes("carpentry") || mc.includes("maintenance") || mc.includes("structural") || mc.includes("amenities") || mc.includes("public spaces")) inferredType = "infrastructure";
                                    else if (mc.includes("security") || mc.includes("access control") || mc.includes("surveillance")) inferredType = "suspicious";
                                    else if (mc.includes("dispute") || mc.includes("nuisance") || mc.includes("cleaning") || mc.includes("pest") || cat.includes("pollution") || cat.includes("vandalism")) inferredType = "nuisance";
                                    else if (mc.includes("admin") || mc.includes("municipal") || mc.includes("rules") || mc.includes("events") || mc.includes("tech")) inferredType = "other";
                                    
                                    setFormData({ ...formData, subCategory: v, type: inferredType });
                                  }}
                                >
                                  <SelectTrigger className="h-12 bg-white/40 dark:bg-muted/30 border-none ring-1 ring-border/50 focus:ring-primary/20 rounded-xl shadow-sm text-sm font-semibold">
                                    <SelectValue placeholder="Select Sub-Category" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl border-border/40 shadow-premium backdrop-blur-xl bg-white/90 dark:bg-card/90 max-h-[300px]">
                                    {CATEGORY_DATA[formData.requestType][formData.masterCategory][formData.category].map((val: string) => (
                                      <SelectItem key={val} value={val} className="font-semibold">{val}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

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
                              onSelect={async (lat, lng) => {
                                setFormData(prev => ({
                                  ...prev,
                                  latitude: lat,
                                  longitude: lng,
                                }));
                                try {
                                  const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                                  const geoData = await geoRes.json();
                                  if (geoData && geoData.display_name) {
                                    setFormData(prev => ({
                                      ...prev,
                                      location: geoData.display_name
                                    }));
                                  }
                                } catch (e) {
                                  console.warn("Reverse geocoding from MapPicker failed", e);
                                }
                              }}
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
