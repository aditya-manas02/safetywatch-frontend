import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  Users,
  MessageSquare,
  Bot,
  Trophy,
  Bell,
  User,
  Search,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Map,
  Compass,
  Layers,
  HelpCircle,
  Vote,
  Smartphone,
  Settings,
  ThumbsUp,
  Share2,
  Bookmark,
  Send,
  PlusCircle,
  Camera,
  Lock,
  Clock,
  Zap,
  Flame,
  Activity,
  Check,
  CheckCircle,
  X,
  Copy,
  Radio,
  Eye,
  Sliders,
  ChevronRight,
  Volume2,
  Download,
  Settings2,
  FileText,
  UserCheck,
  ShieldCheck,
  Megaphone,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FeatureGuide {
  id: string;
  category: "emergency" | "reporting" | "community" | "ai_gamification" | "account";
  title: string;
  badge: string;
  badgeColor: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  overview: string;
  steps: {
    number: number;
    title: string;
    description: string;
  }[];
  tips: string[];
}

export default function HowToUse() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const guides: FeatureGuide[] = [
    {
      id: "sos-emergency",
      category: "emergency",
      title: "Emergency SOS Alert (Safety Pulse & Global SOS)",
      badge: "Critical Emergency Tool",
      badgeColor: "bg-destructive/10 text-destructive border-destructive/20",
      path: "Home Page / Navbar / Global SOS Button",
      icon: ShieldAlert,
      overview:
        "The Emergency SOS Alert is your instant panic lifeline. Activating SOS locks onto your high-precision GPS coordinates, starts a 3-second safety countdown to prevent false alarms, and dispatches an urgent panic signal to your Safety Circles, emergency contacts, and nearby community members. A real-time Emergency SOS overlay modal appears instantly on nearby users' screens.",
      steps: [
        {
          number: 1,
          title: "Trigger the SOS Button",
          description: "Click and hold the prominent red 'SOS' panic button available in the top header or floating action bar."
        },
        {
          number: 2,
          title: "Safety Countdown Buffer (3s)",
          description: "A 3-second countdown window begins with audio and haptic feedback. If triggered by mistake, tap 'Cancel SOS' immediately."
        },
        {
          number: 3,
          title: "GPS Lock & Live Tracking Stream",
          description: "SafetyWatch captures your exact latitude and longitude, initiating a live tracking broadcast for your emergency contacts."
        },
        {
          number: 4,
          title: "Circle & Area Push Alert Dispatched",
          description: "Members of your Safety Circles and nearby users receive an urgent alert sound with a direct link to your live position map."
        },
        {
          number: 5,
          title: "Deactivate & Mark Yourself Safe",
          description: "Once safe, tap 'I AM SAFE - Deactivate SOS' on your screen to resolve the emergency alert."
        }
      ],
      tips: [
        "Ensure Location permissions are set to 'Always Allow' in your device settings for instant satellite GPS lock.",
        "Add at least 2 trusted phone numbers under Profile > Emergency Contacts for guaranteed push/SMS notifications."
      ]
    },
    {
      id: "report-incident",
      category: "reporting",
      title: "Reporting Safety Incidents",
      badge: "Community Watch",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      path: "Navbar / Mobile Bottom Navigation (+) / Home Hero > Report Modal",
      icon: AlertTriangle,
      overview:
        "Report active safety concerns, suspicious individuals, crimes, environmental hazards, fires, or medical emergencies directly to your neighborhood. Attach photo proof, tag exact map locations, and choose whether to post anonymously.",
      steps: [
        {
          number: 1,
          title: "Open Report Modal",
          description: "Click the '+ Report' button on the mobile bottom navigation bar or desktop top header."
        },
        {
          number: 2,
          title: "Select Category & Severity",
          description: "Choose from Crime, Suspicious Activity, Traffic Hazard, Medical Emergency, Fire, or Lost & Found. Set severity to Low, Medium, High, or Critical."
        },
        {
          number: 3,
          title: "Describe & Attach Photo Evidence",
          description: "Type a detailed description of what happened. Tap the camera icon to upload a photo or video proof attachment from your device."
        },
        {
          number: 4,
          title: "Pin Location on Interactive Map",
          description: "Tap 'Use Current Location' or drag the map pin marker to the exact street location of the incident."
        },
        {
          number: 5,
          title: "Toggle Anonymity & Submit",
          description: "Enable 'Post Anonymously' if you wish to hide your name and avatar. Tap 'Submit Incident' to publish to the community map and feed."
        }
      ],
      tips: [
        "Provide landmark descriptions (e.g. 'Near Metro Station Exit B') for faster verification by neighbors.",
        "Submitting accurate reports earns Safety Points toward your citizen achievement badges!"
      ]
    },
    {
      id: "live-map-heatmap",
      category: "reporting",
      title: "Live Community Map & Threat Heatmaps",
      badge: "Interactive Map",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      path: "Home Page > Live Safety Map Section",
      icon: Map,
      overview:
        "The Live Safety Map displays interactive Leaflet map markers for all active community incidents around your area code. Toggle the Threat Heatmap overlay to visualize color-coded density zones indicating high-risk crime concentration areas.",
      steps: [
        {
          number: 1,
          title: "Locate the Interactive Map",
          description: "Scroll to the main map section on the Home page or tap the map tab."
        },
        {
          number: 2,
          title: "Filter Map Markers",
          description: "Use category filter pills (All Incidents, Crime, Hazards, Suspicious) to display specific report types."
        },
        {
          number: 3,
          title: "Click Markers for Details",
          description: "Click any interactive pin to open the incident details popup showing description, photo thumbnail, upvote count, and timestamp."
        },
        {
          number: 4,
          title: "Toggle Threat Heatmap Mode",
          description: "Click the 'Toggle Heatmap' switch on the top right of the map to display gradient heat circles highlighting high-incident density zones."
        }
      ],
      tips: [
        "Check the threat heatmap before leaving for evening commutes to avoid high-risk travel routes.",
        "Zoom out to monitor security incidents in neighboring area codes."
      ]
    },
    {
      id: "guardian-mode",
      category: "emergency",
      title: "Guardian Mode (Virtual Escort & Route Safety)",
      badge: "Personal Escort",
      badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      path: "Home Page > Guardian Mode Card",
      icon: Shield,
      overview:
        "Guardian Mode acts as your personal virtual escort during solo night walks or travel. Set a countdown timer for your trip. If you fail to check in as safe before the timer expires, SafetyWatch automatically triggers an emergency SOS alert to your selected Guardians.",
      steps: [
        {
          number: 1,
          title: "Open Guardian Mode Card",
          description: "Find the Guardian Mode widget on the home page or tap the Guardian icon."
        },
        {
          number: 2,
          title: "Set Travel Duration",
          description: "Select your estimated journey duration (15 mins, 30 mins, 1 hour, or custom)."
        },
        {
          number: 3,
          title: "Assign Circle Guardians",
          description: "Select trusted members from your Safety Circles who will monitor your session status."
        },
        {
          number: 4,
          title: "Start Guardian Session",
          description: "Tap 'Start Guardian Session'. The safety countdown timer begins running in the background."
        },
        {
          number: 5,
          title: "Safe Check-In",
          description: "Upon safe arrival, tap 'I'm Safe - End Session'. If the timer reaches zero without response, an automatic SOS panic alert is dispatched."
        }
      ],
      tips: [
        "Tap '+ Extend 5 Mins' at any time during your walk if you run into traffic or unexpected delays.",
        "Make sure device volume is turned up to hear check-in reminder chimes."
      ]
    },
    {
      id: "safety-circles",
      category: "community",
      title: "Safety Circles (Private Groups & Invite Codes)",
      badge: "Trusted Network",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      path: "Navbar > Circles (/circles) & Circle Details (/circles/:id)",
      icon: Users,
      overview:
        "Safety Circles allow you to form private networks with family, housemates, or neighborhood watch members. Circle members can view each other's live location on a private map, chat in group channels, and send direct circle emergency broadcasts.",
      steps: [
        {
          number: 1,
          title: "Navigate to Circles Page",
          description: "Click 'Circles' in the main navbar or profile Quick Actions."
        },
        {
          number: 2,
          title: "Create or Join Circle",
          description: "Click 'Create Circle' and enter a name (e.g. 'Oak Street Watch') OR click 'Join Circle' and paste a 6-digit invite code."
        },
        {
          number: 3,
          title: "Share Invite Code",
          description: "Copy your unique 6-digit Circle Code (e.g. `SW-9842`) and share it with family members via SMS or WhatsApp."
        },
        {
          number: 4,
          title: "Access Circle Feed, Chat & Member Map",
          description: "Inside your circle details page, view member online status, private group chat, and circle live member map."
        }
      ],
      tips: [
        "Create separate circles for 'Family', 'Apartment Building', and 'Workplace'.",
        "Circle creators can manage member permissions or generate new invite codes anytime."
      ]
    },
    {
      id: "community-feed",
      category: "community",
      title: "Community Incident Feed & Real-Time Discussions",
      badge: "Live Feed",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      path: "Navbar > Feed (/feed) or Home Feed",
      icon: MessageSquare,
      overview:
        "The Community Feed displays a real-time stream of security reports filed in your area. Confirm credibility by upvoting/verifying reports, leave updates in the comment drawer, and bookmark important posts.",
      steps: [
        {
          number: 1,
          title: "Open Community Feed",
          description: "Tap 'Feed' in the navbar or mobile bottom navigation bar."
        },
        {
          number: 2,
          title: "Filter Feed Content",
          description: "Filter posts by Area Code, 'Nearby (< 5km)', or 'Verified Only'."
        },
        {
          number: 3,
          title: "Verify / Upvote Reports",
          description: "If you witnessed or can confirm a report, tap 'Verify / Upvote' to increase its credibility score."
        },
        {
          number: 4,
          title: "Comment & Discuss",
          description: "Click 'Comment' to open the live incident chat drawer and leave helpful safety notes or status updates."
        }
      ],
      tips: [
        "Only upvote reports you have verified to maintain high community trust.",
        "Bookmark posts to receive automatic notifications when an incident is marked 'Resolved'."
      ]
    },
    {
      id: "ai-copilot",
      category: "ai_gamification",
      title: "AI Safety Assistant (Security Copilot)",
      badge: "24/7 AI Assistance",
      badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
      path: "Floating Shield Chat Icon (Bottom Right Corner)",
      icon: Bot,
      overview:
        "The AI Safety Assistant is an intelligent security copilot available 24/7 at the bottom right of your screen. Ask questions about emergency procedures, local risk advice, app navigation, or self-defense protocols.",
      steps: [
        {
          number: 1,
          title: "Click Floating AI Button",
          description: "Tap the floating blue Shield Chat button on the bottom right of any screen."
        },
        {
          number: 2,
          title: "Select Prompt or Type Query",
          description: "Select suggested quick queries (e.g., 'Night Walk Checklist') or type any safety question."
        },
        {
          number: 3,
          title: "Receive Instant AI Guidance",
          description: "The AI copilot generates step-by-step emergency advice, hotline numbers, or feature navigation instructions."
        }
      ],
      tips: [
        "Ask the AI copilot for immediate local emergency hotline numbers if traveling in another city."
      ]
    },
    {
      id: "gamification-leaderboard",
      category: "ai_gamification",
      title: "Gamification, Achievements & Community Leaderboard",
      badge: "Citizen Rewards",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      path: "Profile > Achievements (/achievements) & Leaderboard (/leaderboard)",
      icon: Trophy,
      overview:
        "Earn Safety Points by reporting valid incidents, verifying reports, and completing Guardian check-ins. Unlock achievement badges and compete on the area leaderboard.",
      steps: [
        {
          number: 1,
          title: "Earn Safety Points",
          description: "Perform helpful security actions across the app to earn points automatically."
        },
        {
          number: 2,
          title: "Unlock Achievement Badges",
          description: "Visit Profile > Achievements to claim badges like 'First Responder', 'Community Sentinel', and 'Master Verifier'."
        },
        {
          number: 3,
          title: "View Community Leaderboard",
          description: "Go to Leaderboard to view rankings of top protective citizens in your area code and city."
        }
      ],
      tips: [
        "Unlocking higher achievement badges increases your report visibility score for moderators."
      ]
    },
    {
      id: "community-polls",
      category: "community",
      title: "Community Safety Polls (Civic Voting)",
      badge: "Neighborhood Voting",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      path: "Home Page > Community Polls Widget",
      icon: Vote,
      overview:
        "Vote on local neighborhood security decisions, such as requesting extra streetlights, organizing volunteer patrols, or recommending camera installations.",
      steps: [
        {
          number: 1,
          title: "Locate Polls Widget",
          description: "Scroll to the Community Polls card on the Home page."
        },
        {
          number: 2,
          title: "Cast Your Vote",
          description: "Select your preferred choice on active neighborhood proposals and tap 'Submit Vote'."
        },
        {
          number: 3,
          title: "View Percentage Results",
          description: "View real-time voting progress bars and total participant counts from verified area residents."
        }
      ],
      tips: [
        "Poll results are forwarded to neighborhood committees to advocate for security improvements."
      ]
    },
    {
      id: "notifications-inbox",
      category: "account",
      title: "Notification Center & Inbox Messages",
      badge: "Real-Time Notifications",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      path: "Navbar > Bell Icon & Messages Inbox (/inbox)",
      icon: Bell,
      overview:
        "Stay informed with real-time push alerts, emergency notifications, circle invitations, and direct messaging.",
      steps: [
        {
          number: 1,
          title: "Notification Bell Tray",
          description: "Click the bell icon on the top header to view unread emergency notifications and incident updates."
        },
        {
          number: 2,
          title: "Messages Inbox",
          description: "Navigate to Inbox (/inbox) to view official security announcements and circle group messages."
        }
      ],
      tips: [
        "Enable mobile push notifications in device settings to receive critical emergency alerts even when the app is closed."
      ]
    },
    {
      id: "profile-area-settings",
      category: "account",
      title: "Profile, Emergency Contacts & Area Code Selector",
      badge: "Account Control",
      badgeColor: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
      path: "Navbar / Top Header > Profile (/profile) & Area Selector",
      icon: User,
      overview:
        "Manage your personal profile details, emergency contact phone numbers, primary neighborhood area code, and theme settings.",
      steps: [
        {
          number: 1,
          title: "Set Primary Area Code",
          description: "Use the Area Selector dropdown at the top header to choose your home neighborhood postal zone."
        },
        {
          number: 2,
          title: "Update Emergency Contacts",
          description: "Go to Profile (/profile) to add trusted family phone numbers for instant emergency alerts."
        },
        {
          number: 3,
          title: "Custom Theme Customization",
          description: "Toggle between Dark Mode, Light Mode, or System theme using the moon/sun icon in the navbar."
        }
      ],
      tips: [
        "Keep your primary area code updated whenever you move or travel long-term to receive localized alerts."
      ]
    },
    {
      id: "admin-moderation",
      category: "account",
      title: "Admin Dashboard & Security Panel (Admins Only)",
      badge: "Admin Moderation",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      path: "Navbar > Admin Panel (/admin) [Visible for Admin accounts]",
      icon: Settings2,
      overview:
        "Comprehensive moderation panel for community admins to verify reports, issue emergency broadcasts, suspend malicious users, create community polls, and manage security content.",
      steps: [
        {
          number: 1,
          title: "Access Admin Dashboard",
          description: "Click 'Admin Panel' in the top navbar (available only for verified admin accounts)."
        },
        {
          number: 2,
          title: "Moderate Reports",
          description: "Review submitted incidents, approve verified posts, reject false reports, or elevate to 'Emergency Broadcast'."
        },
        {
          number: 3,
          title: "User & Area Management",
          description: "Suspend abusive accounts, manage neighborhood area codes, create civic polls, and view audit logs."
        }
      ],
      tips: [
        "Admins can issue high-priority push notifications to all users registered in an area code during active emergencies."
      ]
    },
    {
      id: "support-help",
      category: "account",
      title: "Customer Support & Direct Help Desk",
      badge: "Help Desk",
      badgeColor: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
      path: "Navbar / Profile > Support (/support)",
      icon: HelpCircle,
      overview:
        "Contact SafetyWatch technical support, submit bug reports, or suggest new features directly to our engineering team.",
      steps: [
        {
          number: 1,
          title: "Open Support Page",
          description: "Click 'Support' in the navbar or profile menu."
        },
        {
          number: 2,
          title: "Choose Inquiry Type",
          description: "Select Bug Report, Feature Suggestion, Account Help, or Safety Concern."
        },
        {
          number: 3,
          title: "Submit Ticket",
          description: "Fill in details and tap 'Send Ticket'. Track response status directly on your support page."
        }
      ],
      tips: [
        "Check our FAQ section first for quick resolution of common app questions."
      ]
    }
  ];

  const categories = [
    { id: "all", label: "All Features", icon: Layers },
    { id: "emergency", label: "Emergency & SOS", icon: ShieldAlert },
    { id: "reporting", label: "Incidents & Map", icon: MapPin },
    { id: "community", label: "Circles & Feed", icon: Users },
    { id: "ai_gamification", label: "AI & Gamification", icon: Sparkles },
    { id: "account", label: "Account & Settings", icon: Settings }
  ];

  const filteredGuides = useMemo(() => {
    return guides.filter((g) => {
      const matchesCategory = selectedCategory === "all" || g.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        g.title.toLowerCase().includes(query) ||
        g.overview.toLowerCase().includes(query) ||
        g.path.toLowerCase().includes(query) ||
        g.steps.some((s) => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // RENDER AUTHENTIC SAFETYWATCH UI COMPONENTS MATCHING THE SYSTEM THEME
  const renderRealUIMockup = (guideId: string) => {
    switch (guideId) {
      case "sos-emergency":
        return (
          <div className="bg-card border border-border/60 shadow-xl rounded-3xl p-6 space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                </span>
                <span className="text-xs font-black tracking-wider uppercase text-foreground">
                  EMERGENCY SOS ALERT
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">
                GPS LOCK: HIGH ACCURACY
              </Badge>
            </div>

            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-4 bg-destructive/20 rounded-full blur-md animate-pulse" />
                <button className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-destructive via-red-600 to-rose-500 border-4 border-background shadow-2xl shadow-destructive/40 flex flex-col items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform">
                  <ShieldAlert className="w-10 h-10 animate-bounce" />
                  <span className="text-xs font-black tracking-wider mt-1">HOLD FOR SOS</span>
                </button>
              </div>
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-foreground text-xs font-bold font-mono">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>03s Safety Countdown Buffer</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Location streaming automatically dispatches to 5 Circle Responders & Area Patrols
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-2xl p-3.5 border border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-destructive" />
                <span className="font-mono text-foreground font-semibold">34.0522° N, 118.2437° W (Downtown Sector)</span>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10">
                Cancel SOS
              </Button>
            </div>
          </div>
        );

      case "report-incident":
        return (
          <div className="bg-card border border-border/60 shadow-xl rounded-3xl p-6 text-foreground space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                <span className="text-sm font-black text-foreground">Report Incident Modal</span>
              </div>
              <X className="w-4 h-4 text-muted-foreground cursor-pointer" />
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Select Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary text-primary font-bold flex items-center gap-2 justify-center">
                    <AlertTriangle className="w-4 h-4" /> Suspicious
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-muted-foreground font-bold flex items-center gap-2 justify-center">
                    <ShieldAlert className="w-4 h-4" /> Crime
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-muted-foreground font-bold flex items-center gap-2 justify-center">
                    <Flame className="w-4 h-4" /> Hazard
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Severity Level
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-muted text-muted-foreground font-bold">Low</span>
                  <span className="px-3 py-1 rounded-xl bg-muted text-muted-foreground font-bold">Medium</span>
                  <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black shadow-sm">High</span>
                  <span className="px-3 py-1 rounded-xl bg-muted text-muted-foreground font-bold">Critical</span>
                </div>
              </div>

              <div className="bg-muted/40 rounded-xl p-3 border border-border/50 space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-semibold">Description & Details</span>
                  <Camera className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-background rounded-lg p-2.5 text-foreground italic border border-border">
                  "Unattended bag found near metro entrance on 4th street."
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-4 rounded-full bg-emerald-500/30 border border-emerald-500 relative flex items-center justify-end px-0.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="font-semibold text-foreground">Post Anonymously</span>
                </div>
                <Button size="sm" className="bg-primary text-primary-foreground font-black rounded-xl px-5 h-9">
                  Submit Incident →
                </Button>
              </div>
            </div>
          </div>
        );

      case "live-map-heatmap":
        return (
          <div className="bg-card border border-border/60 shadow-xl rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-2xl border border-border/50">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-primary" />
                <span className="text-xs font-black text-foreground">Live Interactive Safety Map</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">
                🔥 Heatmap Overlay: ACTIVE
              </Badge>
            </div>

            {/* Simulated Map Canvas */}
            <div className="relative h-44 rounded-2xl bg-muted/60 border border-border/60 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--muted-foreground)/0.2)_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Heatmap overlay simulation */}
              <div className="absolute w-32 h-32 rounded-full bg-destructive/20 blur-2xl top-4 left-12 pointer-events-none" />
              <div className="absolute w-24 h-24 rounded-full bg-amber-500/20 blur-xl bottom-2 right-16 pointer-events-none" />

              {/* Map Pins */}
              <div className="absolute top-8 left-16 flex flex-col items-center group cursor-pointer">
                <div className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-[9px] font-black shadow-lg">
                  Armed Robbery (0.2 mi)
                </div>
                <MapPin className="w-6 h-6 text-destructive fill-destructive drop-shadow-md animate-bounce" />
              </div>

              <div className="absolute bottom-6 right-20 flex flex-col items-center group cursor-pointer">
                <div className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black shadow-lg">
                  Street Outage (0.5 mi)
                </div>
                <MapPin className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Map Filters: <strong className="text-foreground">All Incidents (14 Active)</strong></span>
              <span className="text-primary font-bold hover:underline cursor-pointer">Zoom to My Location 📍</span>
            </div>
          </div>
        );

      case "guardian-mode":
        return (
          <div className="bg-card border border-border/60 shadow-xl rounded-3xl p-6 text-foreground space-y-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-black text-foreground">Guardian Mode Escort Widget</span>
              </div>
              <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-[10px] font-bold">
                SESSION ACTIVE
              </Badge>
            </div>

            <div className="flex flex-col items-center py-2 space-y-3">
              <div className="relative w-32 h-32 rounded-full border-4 border-indigo-500/30 bg-indigo-500/10 flex flex-col items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-indigo-500 mb-1" />
                <span className="text-2xl font-black font-mono text-foreground">14:52</span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Remaining</span>
              </div>

              <div className="text-center space-y-1">
                <div className="text-xs font-bold text-foreground">Walking Home Solo • Destination: Elm St</div>
                <div className="text-[11px] text-muted-foreground">Guardians Assigned: <strong>Mom, Sarah M.</strong></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl py-5">
                <CheckCircle className="w-4 h-4 mr-1.5" /> I'M SAFE - END SESSION
              </Button>
              <Button variant="outline" className="border-border text-foreground hover:bg-muted font-bold text-xs rounded-xl py-5">
                + Extend 5 Mins
              </Button>
            </div>
          </div>
        );

      case "safety-circles":
        return (
          <div className="bg-card border border-border/60 shadow-xl rounded-3xl p-6 text-foreground space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-black text-foreground">Oak Street Neighborhood Watch</span>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Code: SW-9842
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-muted/50 rounded-xl p-3 border border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    AJ
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Alex Johnson (You)</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">● Location Stream Active</div>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px]">Admin</Badge>
              </div>

              <div className="bg-muted/50 rounded-xl p-3 border border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                    SM
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Sarah Miller</div>
                    <div className="text-[10px] text-muted-foreground">Checked In (Home)</div>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Online</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-muted font-bold">
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy Code
              </Button>
              <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-muted font-bold">
                <MessageSquare className="w-3.5 h-3.5 mr-1" /> Group Chat
              </Button>
              <Button size="sm" variant="outline" className="border-border text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold">
                <Radio className="w-3.5 h-3.5 mr-1" /> Member Map
              </Button>
            </div>
          </div>
        );

      case "community-feed":
        return (
          <div className="bg-card border border-border/60 shadow-xl rounded-3xl p-6 text-foreground space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center text-xs">
                  JD
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-1">
                    John Citizen <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-[10px] text-muted-foreground">12 mins ago • 0.3 miles away</div>
                </div>
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                SUSPICIOUS ACTIVITY
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-foreground text-sm">Unattended Bag near Subway Entrance</h4>
              <p className="text-muted-foreground leading-relaxed">
                Noticeable black backpack left unattended near Metro Gate B. Transit authority notified.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-emerald-600 dark:text-emerald-400 font-bold">
                <ThumbsUp className="w-3.5 h-3.5" /> Verify (24)
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold">
                <MessageSquare className="w-3.5 h-3.5" /> Comment (8)
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold">
                <Bookmark className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </div>
        );

      case "ai-copilot":
        return (
          <div className="bg-card border border-border/60 shadow-xl rounded-3xl p-5 text-foreground space-y-4">
            <div className="flex items-center justify-between bg-primary/10 p-3 rounded-2xl border border-primary/20">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-xs font-black text-foreground">SafetyWatch AI Security Copilot</span>
              </div>
              <span className="text-[10px] text-primary font-bold">● Online 24/7</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-muted/60 rounded-2xl p-3 border border-border/50 text-foreground max-w-[85%]">
                <span className="text-[10px] font-bold text-primary block mb-1">User Query:</span>
                "What should I do if I suspect someone is following me?"
              </div>

              <div className="bg-primary/10 rounded-2xl p-3 border border-primary/20 text-foreground max-w-[90%] ml-auto space-y-1">
                <span className="text-[10px] font-bold text-primary block">AI Copilot Response:</span>
                <p>1. Head toward a well-lit, populated store or main street.</p>
                <p>2. Activate SafetyWatch Guardian Mode or press SOS.</p>
                <p>3. Do not go directly home.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Input placeholder="Ask AI anything..." className="h-9 text-xs bg-background border-border text-foreground" />
              <Button size="sm" className="h-9 px-4 bg-primary text-primary-foreground font-bold rounded-xl">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        );

      case "gamification-leaderboard":
        return (
          <div className="bg-card border border-border/60 shadow-xl rounded-3xl p-6 text-foreground space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-black text-foreground">Citizen Guardian Rank: #3</span>
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                1,420 SAFETY POINTS
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-muted/50 rounded-2xl p-3 border border-border/50">
                <Shield className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                <div className="font-bold text-foreground text-[11px]">Community Shield</div>
                <div className="text-[9px] text-muted-foreground">Level 3 Unlocked</div>
              </div>
              <div className="bg-muted/50 rounded-2xl p-3 border border-border/50">
                <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <div className="font-bold text-foreground text-[11px]">First Responder</div>
                <div className="text-[9px] text-muted-foreground">Level 2 Unlocked</div>
              </div>
              <div className="bg-muted/50 rounded-2xl p-3 border border-border/50">
                <Eye className="w-5 h-5 text-cyan-500 mx-auto mb-1" />
                <div className="font-bold text-foreground text-[11px]">Sentinel Watch</div>
                <div className="text-[9px] text-muted-foreground">Level 4 Unlocked</div>
              </div>
            </div>
          </div>
        );

      case "community-polls":
        return (
          <div className="bg-card border border-border/60 shadow-xl rounded-3xl p-6 text-foreground space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Vote className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-black text-foreground">Active Neighborhood Poll</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-bold">142 Votes Cast</span>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-foreground">Proposal: Install Night Streetlights on Elm St?</h4>

              <div className="space-y-2">
                <div className="bg-primary/5 rounded-2xl p-3 border border-primary/30 space-y-1">
                  <div className="flex justify-between font-bold text-primary">
                    <span>Option A: Yes, Urgent Priority</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>

                <div className="bg-muted/40 rounded-2xl p-3 border border-border/50 space-y-1">
                  <div className="flex justify-between font-semibold text-muted-foreground">
                    <span>Option B: No, Current Patrols Sufficient</span>
                    <span>22%</span>
                  </div>
                  <Progress value={22} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        );

      case "notifications-inbox":
        return (
          <div className="bg-card border border-border/60 shadow-xl rounded-3xl p-5 text-foreground space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-xs font-black text-foreground">Notification Center (2 Unread)</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-destructive/10 rounded-2xl p-3 border border-destructive/20 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-destructive">Emergency SOS Alert Triggered</div>
                  <div className="text-[10px] text-muted-foreground">Sarah M. activated panic alert (0.4 mi away) • 2m ago</div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-2xl p-3 border border-border/50 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-foreground">Incident Status Resolved</div>
                  <div className="text-[10px] text-muted-foreground">Power Outage on 4th Ave marked resolved • 15m ago</div>
                </div>
              </div>
            </div>
          </div>
        );

      case "profile-area-settings":
        return (
          <div className="bg-card border border-border/60 shadow-xl rounded-3xl p-6 text-foreground space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-foreground" />
                <span className="text-sm font-black text-foreground">Profile & Area Control</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-muted/50 rounded-2xl p-3 border border-border/50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Primary Monitoring Zone</div>
                  <div className="font-bold text-foreground text-sm">Downtown Sector 4 (Code 90012)</div>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-border text-foreground">
                  Change Area
                </Button>
              </div>

              <div className="bg-muted/50 rounded-2xl p-3 border border-border/50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase">Emergency Contact #1</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">+1 (555) 019-2834 (Verified)</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </div>
        );

      case "admin-moderation":
        return (
          <div className="bg-card border border-border/60 shadow-xl rounded-3xl p-6 text-foreground space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-black text-foreground">Admin Security & Moderation Panel</span>
              </div>
              <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px]">
                ADMIN PRIVILEGES ACTIVE
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-muted/50 rounded-2xl p-3 border border-border/50">
                <div className="text-lg font-black text-primary">3</div>
                <div className="text-[10px] text-muted-foreground">Pending Reports</div>
              </div>
              <div className="bg-muted/50 rounded-2xl p-3 border border-border/50">
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">18</div>
                <div className="text-[10px] text-muted-foreground">Verified Today</div>
              </div>
              <div className="bg-muted/50 rounded-2xl p-3 border border-border/50">
                <div className="text-lg font-black text-purple-500">99.9%</div>
                <div className="text-[10px] text-muted-foreground">System Uptime</div>
              </div>
            </div>

            <div className="bg-muted/40 rounded-2xl p-3 border border-border/50 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground block">Report #8492 - Suspicious Vehicle</span>
                <span className="text-[10px] text-muted-foreground">Submitted 5m ago • Pending Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5">
                  Approve
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px] border-destructive/30 text-destructive hover:bg-destructive/10 px-2.5">
                  Reject
                </Button>
              </div>
            </div>
          </div>
        );

      case "support-help":
      default:
        return (
          <div className="bg-card border border-border/60 shadow-xl rounded-3xl p-6 text-foreground space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-black text-foreground">SafetyWatch Support Desk</span>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                RESPONSE &lt; 2 HOURS
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-muted/50 rounded-2xl p-3 border border-border/50 space-y-1">
                <div className="text-[10px] font-bold text-muted-foreground">Active Support Ticket:</div>
                <div className="font-bold text-foreground">#SW-84920 - Feature Inquiry regarding Guardian Mode</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Status: Agent Reviewing • Ticket Submitted</div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* HERO BANNER SECTION */}
      <section className="relative pt-8 pb-12 overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs md:text-sm font-bold shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Official SafetyWatch User Guide & Knowledge Base</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-black tracking-tight text-foreground"
            >
              How to Use <span className="bg-gradient-to-r from-primary via-indigo-500 to-blue-500 bg-clip-text text-transparent">SafetyWatch</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl"
            >
              Master every safety tool in SafetyWatch. Explore step-by-step instructions, navigation paths, and visual feature previews designed to keep you and your community secure.
            </motion.p>

            {/* SEARCH BAR */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-xl relative mt-4"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search any feature (e.g., 'SOS', 'Guardian', 'Circles', 'Report')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-6 text-sm md:text-base rounded-2xl border-border/80 bg-card/80 backdrop-blur-md shadow-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold bg-muted px-2 py-1 rounded-md"
                >
                  Clear
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="container mx-auto px-4 md:px-6 max-w-6xl mt-8">
        {/* CATEGORY FILTER TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm whitespace-nowrap transition-all duration-200 border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-105"
                    : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* RESULTS COUNT SUMMARY */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs md:text-sm font-semibold text-muted-foreground">
            Showing <span className="text-foreground font-bold">{filteredGuides.length}</span> feature guides
            {searchQuery && <span> matching "<span className="text-primary font-bold">{searchQuery}</span>"</span>}
          </p>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-xs font-bold text-primary hover:text-primary/80"
          >
            Back to Home Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {/* FEATURE CARDS LIST */}
        {filteredGuides.length === 0 ? (
          <div className="bg-card border border-border/60 rounded-3xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No feature guides found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We couldn't find any feature matching "{searchQuery}". Try searching for terms like "SOS", "Map", "Circle", or "Report".
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              variant="outline"
              className="rounded-xl font-bold"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredGuides.map((guide, index) => {
              const GuideIcon = guide.icon;

              return (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  {/* HEADER OF FEATURE CARD */}
                  <div className="p-6 md:p-8 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-300">
                          <GuideIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                            {guide.title}
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <Compass className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                              Path: {guide.path}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Badge className={`px-3 py-1 text-xs font-extrabold border ${guide.badgeColor}`}>
                        {guide.badge}
                      </Badge>
                    </div>

                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {guide.overview}
                    </p>

                    {/* STEP-BY-STEP PROCESS WALKTHROUGH */}
                    <div className="pt-4 border-t border-border/40">
                      <h3 className="text-xs font-black uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Step-by-Step Walkthrough
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {guide.steps.map((step) => (
                          <div
                            key={step.number}
                            className="bg-muted/40 border border-border/50 rounded-2xl p-4 space-y-2 hover:bg-muted/70 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center shadow-md">
                                {step.number}
                              </span>
                              <h4 className="text-sm font-extrabold text-foreground">{step.title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-normal">
                              {step.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AUTHENTIC UI SCREENSHOT PREVIEW CARD */}
                    <div className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
                          <span className="flex items-center gap-1.5">
                            <Smartphone className="w-4 h-4 text-primary" /> Visual UI Preview (Real Component View)
                          </span>
                          <span className="text-[10px] uppercase font-mono tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                            SafetyWatch UI System
                          </span>
                        </div>
                        {renderRealUIMockup(guide.id)}
                      </div>
                    </div>

                    {/* PRO TIPS FOOTER */}
                    {guide.tips && guide.tips.length > 0 && (
                      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="text-xs font-extrabold text-primary uppercase tracking-wider">
                            Pro Safety Tip
                          </span>
                          <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                            {guide.tips.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* FREQUENTLY ASKED QUESTIONS SECTION */}
        <section className="mt-16 bg-card border border-border/60 rounded-3xl p-6 md:p-10 shadow-lg space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Common Questions</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground">Frequently Asked Questions</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Everything you need to know about SafetyWatch privileges, permissions, and security.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
            <AccordionItem value="faq-1" className="border-border/60">
              <AccordionTrigger className="text-sm font-bold hover:text-primary">
                Is my location shared continuously with the app?
              </AccordionTrigger>
              <AccordionContent className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                No. SafetyWatch only streams your location when you actively trigger an SOS alert or launch a Guardian Mode session. You can manage or revoke location access at any time in device settings.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="border-border/60">
              <AccordionTrigger className="text-sm font-bold hover:text-primary">
                Can I submit incident reports anonymously?
              </AccordionTrigger>
              <AccordionContent className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Yes! When filing a report, simply enable the 'Post Anonymously' toggle. Your username and profile details will be completely hidden from public view.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="border-border/60">
              <AccordionTrigger className="text-sm font-bold hover:text-primary">
                What happens if I press the SOS button by mistake?
              </AccordionTrigger>
              <AccordionContent className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                SafetyWatch features a 3-second countdown buffer with audio alert. Tap 'Cancel SOS' within 3 seconds to cancel the alarm without alerting your circles.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="border-border/60">
              <AccordionTrigger className="text-sm font-bold hover:text-primary">
                How do I invite family members to my Safety Circle?
              </AccordionTrigger>
              <AccordionContent className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Go to Navbar &gt; Circles &gt; Create Circle. Copy your generated 6-digit Circle Code and send it to your family. They can join by tapping 'Join Circle' and entering the code.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <div className="mt-12 bg-gradient-to-r from-primary via-indigo-600 to-blue-600 text-primary-foreground rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <Shield className="w-12 h-12 mx-auto text-primary-foreground/90 animate-pulse" />
          <h2 className="text-2xl md:text-3xl font-black">Ready to Keep Your Neighborhood Safe?</h2>
          <p className="text-xs md:text-sm text-primary-foreground/80 max-w-lg mx-auto">
            Now that you know how to use SafetyWatch, head over to your main dashboard to set up your Safety Circles and monitor live community alerts.
          </p>
          <div className="pt-2">
            <Button
              onClick={() => navigate("/")}
              size="lg"
              className="bg-background text-foreground hover:bg-background/90 font-black rounded-2xl px-8 shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              Go to Safety Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
