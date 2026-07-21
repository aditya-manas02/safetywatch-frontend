import { useLocation, useNavigate } from "react-router-dom";
import { Home, Map, PlusCircle, MessageSquare, User, List } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  action?: () => void;
  isCenter?: boolean;
  requiresAuth?: boolean;
}

interface MobileBottomNavProps {
  onReportClick: () => void;
}

export default function MobileBottomNav({ onReportClick }: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const tabs: Tab[] = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "feed", label: "Feed", icon: List, path: "/feed" },
    { id: "report", label: "Report", icon: PlusCircle, action: onReportClick, isCenter: true, requiresAuth: true },
    { id: "messages", label: "Messages", icon: MessageSquare, path: "/inbox", requiresAuth: true },
    { id: "profile", label: "Profile", icon: User, path: "/profile", requiresAuth: true },
  ];

  const isActive = (tab: Tab) => {
    if (!tab.path) return false;
    if (tab.path === "/") return location.pathname === "/";
    return location.pathname.startsWith(tab.path);
  };

  const handleTabClick = (tab: Tab) => {
    if (tab.requiresAuth && !user) {
      navigate("/auth");
      return;
    }
    if (tab.action) {
      tab.action();
    } else if (tab.path) {
      navigate(tab.path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[55] md:hidden">
      {/* Glass background */}
      <div className="bg-background/90 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div
          className="flex items-end justify-around px-2"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}
        >
          {tabs.map((tab) => {
            const active = isActive(tab);
            const Icon = tab.icon;

            if (tab.isCenter) {
              // Center raised Report button
              return (
                <button
                  key={tab.id}
                  id="tour-report-btn-mobile"
                  onClick={() => handleTabClick(tab)}
                  className="relative -mt-5 flex flex-col items-center group"
                  aria-label={tab.label}
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="h-14 w-14 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center border-4 border-background transition-all duration-300 group-active:shadow-primary/50"
                  >
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </motion.div>
                  <span className="text-[10px] font-bold text-primary mt-1">{tab.label}</span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-[60px] transition-all duration-300 ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={tab.label}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-all duration-300 ${active ? "scale-110" : ""}`} />
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className={`text-[10px] mt-1 transition-all duration-300 ${active ? "font-bold" : "font-medium"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
