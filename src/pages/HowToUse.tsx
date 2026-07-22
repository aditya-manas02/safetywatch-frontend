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
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  mockUI: {
    type: string;
    title: string;
    subtitle?: string;
    elements: { label: string; detail: string; highlight?: boolean; badge?: string }[];
  };
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
      title: "Emergency SOS Alert (Safety Pulse)",
      badge: "Critical Feature",
      badgeColor: "bg-red-500/10 text-red-500 border-red-500/30",
      path: "Home Page / Floating Header / Global SOS Button",
      icon: ShieldAlert,
      overview:
        "The Emergency SOS Alert is your instant safety lifeline. When activated, it immediately captures your real-time GPS coordinates and dispatches high-priority panic alerts to your designated Safety Circles, emergency contacts, and registered community members within your area radius.",
      steps: [
        {
          number: 1,
          title: "Trigger the SOS Button",
          description: "Tap and hold the prominent red 'SOS' button available in the app header or floating menu."
        },
        {
          number: 2,
          title: "Safety Countdown (3 Seconds)",
          description: "A 3-second countdown window begins with loud haptic feedback. If pressed by mistake, tap 'Cancel' immediately."
        },
        {
          number: 3,
          title: "Automatic GPS & Data Capture",
          description: "SafetyWatch locks onto your high-precision location coordinates and logs a live panic event."
        },
        {
          number: 4,
          title: "Instant Circle & Push Broadcast",
          description: "Your emergency contacts and Safety Circle members receive an urgent sound alert with a direct link to your live tracking stream."
        },
        {
          number: 5,
          title: "Resolution & Deactivation",
          description: "Once safe, enter your secure PIN or tap 'Mark Myself Safe' to resolve the emergency alert."
        }
      ],
      mockUI: {
        type: "card",
        title: "EMERGENCY SOS BROADCAST ACTIVE",
        subtitle: "Live GPS Tracking Engaged • 5 Responders Notified",
        elements: [
          { label: "User Name", detail: "Alex Johnson (You)" },
          { label: "Current Location", detail: "34.0522° N, 118.2437° W (Downtown Zone)", highlight: true },
          { label: "Alert Dispatched To", detail: "Family Safety Circle & 12 Nearby Responders" },
          { label: "Status", detail: "Broadcasting Live GPS Signal...", badge: "LIVE" }
        ]
      },
      tips: [
        "Make sure Location permissions are set to 'Always Allow' in your device settings for instant accurate GPS lock.",
        "Add at least 2 emergency contacts in your Safety Circles for guaranteed notifications."
      ]
    },
    {
      id: "report-incident",
      category: "reporting",
      title: "Reporting Safety Incidents",
      badge: "Essential Community Tool",
      badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/30",
      path: "Navbar / Mobile Bottom Navigation (+) / Home Hero > Report Modal",
      icon: AlertTriangle,
      overview:
        "The Report Incident feature allows you to instantly notify your neighborhood about active safety concerns, suspicious activity, crimes, environmental hazards, or traffic accidents. Adding photo evidence and precise map tags helps protect fellow citizens.",
      steps: [
        {
          number: 1,
          title: "Open the Report Modal",
          description: "Click the '+ Report' button on the mobile bottom navigation bar or desktop header."
        },
        {
          number: 2,
          title: "Select Category & Severity",
          description: "Choose from Crime, Suspicious Activity, Traffic Hazard, Medical, Fire, or Lost & Found. Set severity to Low, Medium, High, or Critical."
        },
        {
          number: 3,
          title: "Describe & Attach Media",
          description: "Type a clear title and description. Tap the camera icon to upload photo or video proof from your device."
        },
        {
          number: 4,
          title: "Pin Exact Location",
          description: "Select 'Use My Current Location' or drag the map pin directly to the exact location of the occurrence."
        },
        {
          number: 5,
          title: "Toggle Anonymity & Submit",
          description: "Turn on 'Post Anonymously' if you wish to remain hidden. Tap 'Submit Incident' to publish to the community map & feed."
        }
      ],
      mockUI: {
        type: "form",
        title: "Report New Incident",
        subtitle: "Help keep your neighborhood informed and safe",
        elements: [
          { label: "Category", detail: "Suspicious Activity", badge: "HIGH SEVERITY" },
          { label: "Location", detail: "Main St & 4th Avenue (Pinned on Map)" },
          { label: "Attachment", detail: "photo_evidence_01.jpg (Uploaded)", highlight: true },
          { label: "Privacy Option", detail: "Post Anonymously: ON" }
        ]
      },
      tips: [
        "Include distinct landmarks or street names in your description for quick verification.",
        "Verified reports earn extra Safety Points for your achievement badges!"
      ]
    },
    {
      id: "live-map-heatmap",
      category: "reporting",
      title: "Live Community Map & Threat Heatmaps",
      badge: "Interactive Radar",
      badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      path: "Home Page > Interactive Safety Map",
      icon: Map,
      overview:
        "The Live Community Map provides an interactive spatial overview of all active incidents, emergency alerts, and safety heatmaps around your current location or selected area code.",
      steps: [
        {
          number: 1,
          title: "Access the Map",
          description: "Scroll to the main map section on the Home page or tap the map tab."
        },
        {
          number: 2,
          title: "Filter by Category",
          description: "Use the filter buttons (All, Crimes, Hazards, Emergency) to view specific types of reports."
        },
        {
          number: 3,
          title: "Tap Pins for Details",
          description: "Click any interactive marker on the map to see the incident popup card with description, photos, and time posted."
        },
        {
          number: 4,
          title: "Toggle Threat Heatmap Mode",
          description: "Click the 'Toggle Heatmap' switch on the top right of the map to render color-coded density zones showing high-incident areas."
        }
      ],
      mockUI: {
        type: "map",
        title: "Safety Watch Interactive Map",
        subtitle: "Showing 14 active incidents in your area",
        elements: [
          { label: "Active Filter", detail: "All Incidents (Last 24 Hours)" },
          { label: "Heatmap Overlay", detail: "ENABLED (High-risk zones highlighted in red/orange)", highlight: true },
          { label: "Selected Pin", detail: "Street Light Outage • 0.3 miles away" },
          { label: "Safety Radius", detail: "2.5 km Monitoring Buffer Active" }
        ]
      },
      tips: [
        "Check the heatmap before planning late-night walks or travel routes to avoid high-risk zones.",
        "Zoom out to inspect neighboring area codes and city-wide trends."
      ]
    },
    {
      id: "guardian-mode",
      category: "emergency",
      title: "Guardian Mode (Virtual Escort & Route Safety)",
      badge: "Personal Protection",
      badgeColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/30",
      path: "Home Page > Guardian Mode Widget",
      icon: Shield,
      overview:
        "Guardian Mode acts as your automated virtual escort. Perfect for solo night walks or rides home, it monitors your trip duration with a safety timer. If you fail to check in as safe before the timer expires, an emergency alert is automatically dispatched.",
      steps: [
        {
          number: 1,
          title: "Open Guardian Mode Widget",
          description: "Locate the Guardian Mode card on the home dashboard or tap the floating Guardian icon."
        },
        {
          number: 2,
          title: "Set Estimated Duration",
          description: "Choose your expected travel time (e.g. 15 mins, 30 mins, or custom duration)."
        },
        {
          number: 3,
          title: "Select Guardian Contacts",
          description: "Choose trusted members from your Safety Circles who will monitor your session."
        },
        {
          number: 4,
          title: "Start Session",
          description: "Tap 'Start Guardian Session'. The countdown timer begins running safely in the background."
        },
        {
          number: 5,
          title: "Safe Check-In",
          description: "Once you arrive safely, tap 'I am Safe' to stop the timer. If the timer runs out without response, an automatic SOS alert triggers."
        }
      ],
      mockUI: {
        type: "timer",
        title: "Guardian Escort Session Running",
        subtitle: "Walk Home • 12:45 Remaining",
        elements: [
          { label: "Assigned Guardians", detail: "Mom, Sarah (Circle Members)" },
          { label: "Check-in Status", detail: "Timer active • Countdown 12m 45s", highlight: true },
          { label: "Safety Action", detail: "[I'M SAFE BUTTON] • Tap to complete session" }
        ]
      },
      tips: [
        "You can extend your session timer at any point during your trip if you run into delays.",
        "Keep your device volume turned up to hear check-in reminder chimes."
      ]
    },
    {
      id: "safety-circles",
      category: "community",
      title: "Safety Circles (Private Groups)",
      badge: "Trusted Network",
      badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
      path: "Navbar > Circles (/circles) or Profile Menu",
      icon: Users,
      overview:
        "Safety Circles allow you to form private networks with family, housemates, or trusted neighbors. Circle members can share live location streams, send direct emergency broadcasts, and communicate in private group channels.",
      steps: [
        {
          number: 1,
          title: "Navigate to Circles Page",
          description: "Click 'Circles' in the main navbar or profile dashboard."
        },
        {
          number: 2,
          title: "Create or Join Circle",
          description: "Click 'Create Circle' and set a name (e.g. 'Family Watch') OR click 'Join Circle' and enter a 6-digit invite code."
        },
        {
          number: 3,
          title: "Invite Trusted Members",
          description: "Copy your unique Circle invite code or link and send it via text/WhatsApp to trusted friends and family."
        },
        {
          number: 4,
          title: "Access Circle Feed & Live Map",
          description: "Inside your circle, view member status updates, private incident pins, and direct group messages."
        }
      ],
      mockUI: {
        type: "circle",
        title: "Oak Street Neighborhood Watch",
        subtitle: "8 Active Members • Circle Code: SW-9842",
        elements: [
          { label: "Circle Admin", detail: "You (Creator)" },
          { label: "Live Members", detail: "4 Members Online • 0 Active Alerts", highlight: true },
          { label: "Quick Actions", detail: "Share Invite Code • Group Chat • Broadcast Alert" }
        ]
      },
      tips: [
        "Create separate circles for 'Family', 'Work Commute', and 'Neighborhood Block Watch'.",
        "Circle admins can remove members or generate new invite codes anytime."
      ]
    },
    {
      id: "community-feed",
      category: "community",
      title: "Community Incident Feed & Verification",
      badge: "Real-Time Updates",
      badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/30",
      path: "Navbar > Feed (/feed) or Home Feed",
      icon: MessageSquare,
      overview:
        "The Community Feed is a chronological stream of safety reports posted by citizens in your area. Users can verify authenticity, leave comments, upvote helpful posts, and bookmark important safety alerts.",
      steps: [
        {
          number: 1,
          title: "Open the Community Feed",
          description: "Tap 'Feed' in the navbar or bottom mobile bar."
        },
        {
          number: 2,
          title: "Filter Feed Content",
          description: "Switch between 'Nearby (< 5km)', 'All Area Reports', and 'Verified Incidents'."
        },
        {
          number: 3,
          title: "Verify / Upvote Reports",
          description: "If you witnessed or can confirm a report, tap the 'Verify / Upvote' button to increase its credibility score."
        },
        {
          number: 4,
          title: "Comment & Discuss",
          description: "Add updates, advice, or warning notes in the comments section under any post."
        }
      ],
      mockUI: {
        type: "feed",
        title: "Community Feed Stream",
        subtitle: "Filtered by: Nearby (< 5km)",
        elements: [
          { label: "Report", detail: "Power Outage reported on 5th Street" },
          { label: "Verification Score", detail: "98% Credibility (24 Upvotes)", highlight: true },
          { label: "User Action", detail: "[Verify Report] • [Comment] • [Share]" }
        ]
      },
      tips: [
        "Only upvote reports that you have personally confirmed to maintain community accuracy.",
        "Bookmark posts to receive notification when the incident status changes to Resolved."
      ]
    },
    {
      id: "ai-copilot",
      category: "ai_gamification",
      title: "AI Safety Assistant (Security Copilot)",
      badge: "24/7 AI Guidance",
      badgeColor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
      path: "Floating Shield Icon (Bottom Right of Screen)",
      icon: Bot,
      overview:
        "The AI Safety Assistant is an intelligent security copilot available 24/7. Ask questions about safety procedures, emergency protocols, app navigation, or local risk summaries.",
      steps: [
        {
          number: 1,
          title: "Open Chat Assistant",
          description: "Click the floating blue Shield Chat button located at the bottom-right of your screen."
        },
        {
          number: 2,
          title: "Select or Type Question",
          description: "Pick from suggested quick queries or type any custom safety question into the prompt box."
        },
        {
          number: 3,
          title: "Receive Instant Advice",
          description: "The AI instantly generates step-by-step guidance, emergency phone numbers, or feature instructions tailored to your context."
        }
      ],
      mockUI: {
        type: "chat",
        title: "SafetyWatch AI Copilot",
        subtitle: "Online • Ready to assist",
        elements: [
          { label: "Query", detail: "'What should I do if I suspect someone is following me?'" },
          { label: "AI Response", detail: "1. Head toward a well-lit, populated area.\n2. Do not go straight home.\n3. Call emergency services or activate SafetyWatch SOS.", highlight: true }
        ]
      },
      tips: [
        "Ask the AI copilot for immediate local emergency hotline numbers if you are traveling in another city."
      ]
    },
    {
      id: "gamification-leaderboard",
      category: "ai_gamification",
      title: "Achievements, Badges & Community Leaderboard",
      badge: "Community Rewards",
      badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/30",
      path: "Profile > Achievements (/achievements) & Leaderboard (/leaderboard)",
      icon: Trophy,
      overview:
        "SafetyWatch rewards active community guardians! Earn Safety Points by submitting accurate reports, verifying posts, and completing Guardian check-ins. Level up your profile and climb the civic leaderboard.",
      steps: [
        {
          number: 1,
          title: "Earn Safety Points",
          description: "Perform positive community safety actions to earn points automatically."
        },
        {
          number: 2,
          title: "Unlock Achievement Badges",
          description: "Visit Profile > Achievements to claim badges like 'First Responder', 'Shield Master', and 'Sentinel Watch'."
        },
        {
          number: 3,
          title: "View Community Leaderboard",
          description: "Go to Leaderboard to see top protective citizens in your area code and city."
        }
      ],
      mockUI: {
        type: "achievement",
        title: "Citizen Guardian Profile",
        subtitle: "Level 5 Guardian • 1,420 Safety Points",
        elements: [
          { label: "Active Badges", detail: "Community Shield 🛡️ • First Responder ⚡ • Eagle Eye 👁️" },
          { label: "Leaderboard Rank", detail: "#3 in Neighborhood Block 4", highlight: true }
        ]
      },
      tips: [
        "Higher badge levels increase the visibility of your submitted safety reports to community moderators."
      ]
    },
    {
      id: "community-polls",
      category: "community",
      title: "Community Safety Polls",
      badge: "Civic Voting",
      badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
      path: "Home Page > Community Polls Widget",
      icon: Vote,
      overview:
        "Vote on local neighborhood security decisions, such as requesting extra streetlights, organizing volunteer patrols, or suggesting camera placements.",
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
          title: "View Real-Time Results",
          description: "Check percentage breakdowns and total vote counts submitted by verified area residents."
        }
      ],
      mockUI: {
        type: "poll",
        title: "Active Neighborhood Poll",
        subtitle: "Proposal: Install Night Streetlight on Elm St",
        elements: [
          { label: "Option A", detail: "Yes, Urgent Priority (78% Votes)", highlight: true },
          { label: "Option B", detail: "No, Not Required (22% Votes)" },
          { label: "Total Votes", detail: "142 Local Residents Voted" }
        ]
      },
      tips: [
        "Poll results are forwarded to local neighborhood committees to advocate for safety improvements."
      ]
    },
    {
      id: "notifications-inbox",
      category: "account",
      title: "Notification Center & Inbox Messages",
      badge: "Real-Time Alerts",
      badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/30",
      path: "Navbar > Bell Icon / Inbox (/inbox)",
      icon: Bell,
      overview:
        "Stay informed with real-time push alerts, emergency notifications, circle invitations, and direct messaging.",
      steps: [
        {
          number: 1,
          title: "Notification Bell Tray",
          description: "Click the bell icon on the top header to view unread emergency notifications and incident alerts."
        },
        {
          number: 2,
          title: "Messages Inbox",
          description: "Go to Inbox (/inbox) to read official broadcast advisories and chat with Circle members."
        }
      ],
      mockUI: {
        type: "inbox",
        title: "SafetyWatch Notification Center",
        subtitle: "2 Unread Urgent Alerts",
        elements: [
          { label: "Emergency Alert", detail: "SOS Triggered by John Doe (0.4 miles away)", highlight: true },
          { label: "System Advisory", detail: "Scheduled Patrol Notice for Tonight" }
        ]
      },
      tips: [
        "Enable mobile push notifications in device settings to receive critical emergency alerts even when the app is closed."
      ]
    },
    {
      id: "profile-area-settings",
      category: "account",
      title: "Profile, Emergency Contacts & Area Selector",
      badge: "Account Control",
      badgeColor: "bg-slate-500/10 text-slate-500 border-slate-500/30",
      path: "Navbar / Top Bar > Profile (/profile) & Area Selector",
      icon: User,
      overview:
        "Manage your personal profile settings, emergency contact phone numbers, primary monitoring area code, and theme customization.",
      steps: [
        {
          number: 1,
          title: "Set Primary Area Code",
          description: "Use the Area Selector dropdown at the top header to select your home neighborhood postal zone."
        },
        {
          number: 2,
          title: "Update Emergency Contacts",
          description: "Navigate to Profile (/profile) to enter trusted family phone numbers for SMS/push alerts."
        },
        {
          number: 3,
          title: "Custom Theme Settings",
          description: "Toggle between Dark Mode, Light Mode, or System theme using the moon/sun icon in the navbar."
        }
      ],
      mockUI: {
        type: "profile",
        title: "User Profile & Security Settings",
        subtitle: "Monitoring Area: Downtown (Code 90012)",
        elements: [
          { label: "Emergency Contact 1", detail: "+1 (555) 019-2834 (Verified)" },
          { label: "Primary Zone", detail: "Downtown Sector 4", highlight: true },
          { label: "App Theme", detail: "Dark Mode (Glassmorphic Interface)" }
        ]
      },
      tips: [
        "Keep your primary area code updated whenever you move or travel long-term to receive localized alerts."
      ]
    },
    {
      id: "support-help",
      category: "account",
      title: "Customer Support & Feedback",
      badge: "Direct Assistance",
      badgeColor: "bg-green-500/10 text-green-500 border-green-500/30",
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
          description: "Select Bug Report, Feature Suggestion, or Account Assistance."
        },
        {
          number: 3,
          title: "Submit Ticket",
          description: "Fill in details and tap 'Send Ticket'. Our team responds via inbox or email."
        }
      ],
      mockUI: {
        type: "support",
        title: "SafetyWatch Help Desk",
        subtitle: "Response time: < 2 hours",
        elements: [
          { label: "Ticket Category", detail: "Feature Request / UI Feedback" },
          { label: "Status", detail: "Ticket Submitted #SW-84920", highlight: true }
        ]
      },
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
                className="w-full pl-12 pr-10 py-6 text-sm md:text-base rounded-2xl border-border/80 bg-card/80 backdrop-blur-md shadow-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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

                    {/* MOCK UI SCREENSHOT PREVIEW CARD */}
                    <div className="pt-4">
                      <div className="bg-slate-950 text-slate-100 rounded-2xl p-5 md:p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 px-3 py-1 bg-primary/20 border-b border-l border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest rounded-bl-xl">
                          Visual UI Preview
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
                              {guide.mockUI.title}
                            </span>
                          </div>
                          {guide.mockUI.subtitle && (
                            <p className="text-xs text-slate-400 italic">{guide.mockUI.subtitle}</p>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                            {guide.mockUI.elements.map((el, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-xl border text-xs ${
                                  el.highlight
                                    ? "bg-primary/20 border-primary/40 text-primary-foreground"
                                    : "bg-slate-900/80 border-slate-800 text-slate-300"
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-0.5">
                                  <span>{el.label}</span>
                                  {el.badge && (
                                    <span className="px-1.5 py-0.2 bg-red-500 text-white rounded text-[9px] font-bold">
                                      {el.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="font-bold text-slate-100">{el.detail}</div>
                              </div>
                            ))}
                          </div>
                        </div>
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
