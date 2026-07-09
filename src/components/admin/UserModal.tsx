import React, { useState, useEffect } from "react";
import { X, Shield, Mail, Calendar, Phone, Trash2, Award, UserCheck, AlertTriangle, Ban, RefreshCw, Clock, ShieldAlert, MapPin, MessageSquare, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { User, Incident } from "@/types";
import { BASE_URL, API_BASE, getAuthHeaders } from "@/lib/api";

export interface UserModalProps {
  user: User | null;
  incidents: Incident[];
  onClose: () => void;
  onPromote: (id: string) => void;
  onDemote: (id: string) => void;
  onDelete: (id: string) => void;
  onSuspend?: (id: string, reason: string, days: number) => void;
  onUnsuspend?: (id: string) => void;
  onUpdateAreaCode?: (id: string, code: string) => void;
  onMessageUser?: (id: string, title: string, message: string) => void;
}

export default function UserModal({
  user,
  incidents,
  onClose,
  onPromote,
  onDemote,
  onDelete,
  onSuspend,
  onUnsuspend,
  onUpdateAreaCode,
  onMessageUser
}: UserModalProps) {
  const [isMessaging, setIsMessaging] = useState(false);
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");

  const [isEditingAreaCode, setIsEditingAreaCode] = useState(false);
  const [newAreaCode, setNewAreaCode] = useState(user?.areaCode || "DEFAULT");
  const [areaCodes, setAreaCodes] = useState<any[]>([]);

  useEffect(() => {
    if (areaCodes.length === 0) {
      const fetchAreaCodes = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE}/area-codes`, { headers: getAuthHeaders(token) });
          if (res.ok) {
            setAreaCodes(await res.json());
          }
        } catch { /* silent */ }
      };
      fetchAreaCodes();
    }
  }, []);

  const displayAreaName = areaCodes.find(ac => ac.code === (user?.areaCode || "DEFAULT"))?.name || "";

  if (!user) return null;

  let isSuperAdmin = false;
  let loggedInUserId: string | null = null;

  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      isSuperAdmin = payload?.roles?.includes("superadmin");
      loggedInUserId = payload?.id;
    }
  } catch {
    isSuperAdmin = false;
    loggedInUserId = null;
  }

  const isSelf = loggedInUserId === user._id;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card border border-border rounded-3xl p-0 max-w-2xl w-full max-h-[90vh] overflow-hidden relative shadow-2xl flex flex-col"
      >
        {/* Banner */}
        <div className="h-32 shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
          <button
            className="absolute right-6 top-6 h-10 w-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center transition-colors text-white"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 sm:px-10 pb-8 sm:pb-10 -mt-14 relative z-10 flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header with Icon and Roles */}
          <div className="flex justify-between items-end mb-8 gap-4 shrink-0">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-[2rem] bg-card border-[6px] border-card shadow-2xl flex items-center justify-center overflow-hidden transition-transform hover:scale-105 duration-300">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture.startsWith('http') ? user.profilePicture : `${BASE_URL}${user.profilePicture}`} 
                  alt={user.name} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
                  }}
                />
              ) : (
                <div className="h-full w-full rounded-[1.5rem] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-inner">
                  <Shield className="h-12 w-12 text-white" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {user.roles.map((r: string) => (
                <Badge key={r} className="capitalize bg-blue-500/10 text-blue-500 border border-blue-500/20 px-4 py-1 font-black tracking-widest text-[10px] rounded-full">
                  {r}
                </Badge>
              ))}
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar pb-2">
            {/* User Info */}
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">{user.name || "Verified Citizen"}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <span className="text-muted-foreground text-sm flex items-center gap-1.5"><Mail className="h-4 w-4" /> {user.email}</span>
                {user.phone && <span className="text-muted-foreground text-sm flex items-center gap-1.5"><Phone className="h-4 w-4" /> {user.phone}</span>}
                <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {isEditingAreaCode ? (
                    <div className="flex items-center gap-2">
                      <select 
                        value={newAreaCode}
                        onChange={(e) => setNewAreaCode(e.target.value.toUpperCase())}
                        className="h-7 px-2 text-xs rounded bg-background border border-border outline-none min-w-24 text-foreground font-bold cursor-pointer appearance-none"
                      >
                        <option value="DEFAULT">DEFAULT</option>
                        {areaCodes.map(ac => (
                          <option key={ac._id} value={ac.code}>{ac.code}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => {
                          if (onUpdateAreaCode) onUpdateAreaCode(user._id, newAreaCode);
                          setIsEditingAreaCode(false);
                        }}
                        className="h-7 w-7 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => { setIsEditingAreaCode(false); setNewAreaCode(user.areaCode || "DEFAULT"); }}
                        className="h-7 w-7 flex items-center justify-center bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {user.areaCode || "DEFAULT"} {displayAreaName ? `(${displayAreaName})` : ""}
                      {isSuperAdmin && onUpdateAreaCode && (
                        <button 
                          onClick={() => setIsEditingAreaCode(true)}
                          className="ml-2 text-xs text-blue-500 hover:underline font-medium"
                        >
                          [Edit]
                        </button>
                      )}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Joined SafetyWatch</p>
                <p className="font-bold text-foreground">{(() => { try { return format(new Date(user.createdAt), "MMMM dd, yyyy"); } catch { return "N/A"; } })()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Contributions</p>
                <p className="font-bold text-foreground">{incidents.length} Incident Reports</p>
              </div>
            </div>

            {/* Suspension Info */}
            {user.isSuspended && (
              <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Ban className="h-12 w-12 text-rose-500" />
                </div>
                <div className="flex items-center gap-2 text-rose-500">
                  <ShieldAlert className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Active Restriction</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Duration Policy
                  </p>
                  <p className="font-bold text-foreground">
                    Suspended until {user.suspensionExpiresAt ? format(new Date(user.suspensionExpiresAt), "PPP p") : "Indefinite"}
                  </p>
                </div>
                {user.warnings && user.warnings.length > 0 && (
                  <div className="border-t border-rose-500/10 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 mb-1">Last Violation Note</p>
                    <p className="text-xs font-medium italic opacity-80 leading-relaxed text-muted-foreground">
                      "{user.warnings[user.warnings.length - 1].reason}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Privilege Management */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Privilege Management</h4>
              
              {isMessaging ? (
                <div className="bg-muted/30 border border-border p-4 rounded-2xl space-y-3">
                  <h5 className="text-sm font-bold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Send Direct Message to {user.name}</h5>
                  <input
                    value={msgTitle}
                    onChange={(e) => setMsgTitle(e.target.value)}
                    placeholder="Message Title"
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
                  />
                  <textarea
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full h-24 p-3 bg-background border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors resize-none custom-scrollbar"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" className="rounded-xl" onClick={() => { setIsMessaging(false); setMsgTitle(""); setMsgBody(""); }}>Cancel</Button>
                    <Button className="rounded-xl" onClick={() => {
                      if (!msgTitle.trim() || !msgBody.trim()) return;
                      if (onMessageUser) onMessageUser(user._id, msgTitle, msgBody);
                      setIsMessaging(false);
                      setMsgTitle("");
                      setMsgBody("");
                    }}>
                      <Send className="h-4 w-4 mr-2" /> Send Message
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 flex-wrap">
                  {onMessageUser && !isSelf && (
                    <Button 
                      variant="outline" 
                      className="border-primary/20 text-primary hover:bg-primary/10 rounded-xl"
                      onClick={() => setIsMessaging(true)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" /> Direct Message
                    </Button>
                  )}

                  {!user.roles.includes("admin") && (
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20" onClick={() => onPromote(user._id)}>
                      <Award className="mr-2 h-4 w-4" /> Promote to Admin
                    </Button>
                  )}

                {user.roles.includes("admin") && isSuperAdmin && !isSelf && (
                  <Button variant="outline" className="border-amber-500/20 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10 rounded-xl" onClick={() => onDemote(user._id)}>
                    <UserCheck className="mr-2 h-4 w-4" /> Demote to User
                  </Button>
                )}

                {isSuperAdmin && !isSelf && (
                  <Button variant="destructive" className="rounded-xl shadow-lg shadow-destructive/20" onClick={() => { if (window.confirm("Permanently delete user profile?")) onDelete(user._id); }}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove Profile
                  </Button>
                )}

                {!user.isSuspended && isSuperAdmin && !isSelf && onSuspend && (
                  <Button
                    variant="outline"
                    className="border-rose-500/20 text-rose-600 dark:text-rose-500 hover:bg-rose-500/10 rounded-xl"
                    onClick={() => {
                      const reason = prompt("Reason for suspension?");
                      const days = prompt("Duration in days? (Leave empty for indefinite)");
                      if (reason !== null) {
                        onSuspend(user._id, reason, days ? parseInt(days) : 0);
                      }
                    }}
                  >
                    <Ban className="mr-2 h-4 w-4" /> Suspend Citizen
                  </Button>
                )}

                {user.isSuspended && onUnsuspend && (
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl"
                    onClick={() => onUnsuspend(user._id)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Lift Suspension
                  </Button>
                )}

                {isSelf && (
                  <div className="w-full p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <p className="text-xs text-amber-600 dark:text-amber-200/80 font-medium">Self-Protection Active: You cannot modify your own administrative privileges.</p>
                  </div>
                )}
              </div>
              )}
            </div>

            {/* Submission History */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Submission History</h4>
              {incidents.length === 0 ? (
                <div className="text-center py-8 rounded-2xl border-2 border-dashed border-border bg-muted/5">
                  <p className="text-muted-foreground text-sm font-medium">No recent incidents recorded.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incidents.map((i: Incident) => (
                    <div key={i._id} className="p-4 bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border flex justify-between items-center group transition-all duration-300">
                      <div>
                        <p className="font-bold text-foreground">{i.title}</p>
                        <p className="text-[10px] text-muted-foreground italic font-medium">{(() => { try { return format(new Date(i.createdAt), "Pp"); } catch { return "N/A"; } })()}</p>
                      </div>
                      <Badge className={`capitalize py-0.5 px-3 text-[10px] font-black border-none shadow-sm ${i.status === 'approved'
                        ? 'bg-emerald-500 text-white'
                        : i.status === 'pending'
                          ? 'bg-amber-500 text-white'
                          : i.status === 'rejected'
                            ? 'bg-red-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                        {i.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
