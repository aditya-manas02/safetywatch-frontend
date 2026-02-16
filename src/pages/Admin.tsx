import DashboardStats from "@/components/admin/DashboardStats";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Zap, Search, RefreshCw, LayoutDashboard, ListFilter, Users, LifeBuoy, Activity, Menu, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, VERSION_HEADERS, getAuthHeaders } from "@/lib/api";

// components
import ThemeToggle from "@/components/ThemeToggle";
import CyberSidebar from "@/components/admin/CyberSidebar";
import CyberIncidentTable from "@/components/admin/CyberIncidentTable";
import CyberIncidentModal from "@/components/admin/CyberIncidentModal";
import UserTable from "@/components/admin/UserTable";
import UserModal from "@/components/admin/UserModal";
import SupportManager from "@/components/admin/SupportManager";
import AuditLogViewer from "@/components/admin/AuditLogViewer";
import { DashboardSkeleton, TableSkeleton } from "@/components/admin/Skeletons";
import { User as UserType, Incident } from "@/types";
import AreaCodeManager from "@/components/admin/AreaCodeManager";
import PollManager from "@/components/admin/PollManager";
import CreateChallenge from "@/components/admin/CreateChallenge";
import CreateAnnouncement from "@/components/admin/CreateAnnouncement";
import ReportManager from "@/components/admin/ReportManager";
import AdManager from "@/components/admin/AdManager";
import { Megaphone, Flag, MapPin, Target, Vote, Image as ImageIcon } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin, isLoading, token } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [importanceFilter, setImportanceFilter] = useState("all");

  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [userIncidents, setUserIncidents] = useState<Incident[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  /* ---------------- FETCH INCIDENTS ---------------- */
  const fetchIncidents = useCallback(async () => {
    setLoadingIncidents(true);
    try {
      const res = await fetch(`${API_BASE}/incidents`, {
        headers: getAuthHeaders(token),
      });

      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setIncidents(data);
    } catch {
      toast({ title: "Error loading incidents", variant: "destructive" });
    } finally {
      setLoadingIncidents(false);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: getAuthHeaders(token),
      });
      setUsers(await res.json());
    } catch {
      toast({ title: "Error loading users", variant: "destructive" });
    } finally {
      setLoadingUsers(false);
    }
  }, [token]);

  /* ---------------- AUTH CHECK FAILSAFE ---------------- */
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      window.location.href = "/auth";
      return;
    }
  }, [user, isAdmin, isLoading, navigate]);

  /* ---------------- FETCH ON TAB SWITCH ---------------- */
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "incidents") fetchIncidents();
    if (activeTab === "users") fetchUsers();
  }, [activeTab, isAdmin, fetchIncidents, fetchUsers]);

  /* ---------------- FILTER INCIDENTS ---------------- */
  useEffect(() => {
    let f = [...incidents];

    if (query.trim()) {
      const q = query.toLowerCase();
      f = f.filter(
        (i) =>
          (i.title || "").toLowerCase().includes(q) ||
          (i.location || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") f = f.filter((i) => i.status === statusFilter);
    if (typeFilter !== "all") f = f.filter((i) => i.type === typeFilter);

    if (importanceFilter === "important") f = f.filter((i) => i.isImportant === true);
    if (importanceFilter === "regular") f = f.filter((i) => i.isImportant !== true);

    setFilteredIncidents(f);
  }, [incidents, query, statusFilter, typeFilter, importanceFilter]);

  /* ---------------- BULK UPDATE ---------------- */
  const handleBulkUpdate = async (ids: string[], status: string, isImportant?: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/incidents/bulk-status`, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ ids, status, isImportant }),
      });

      if (!res.ok) throw new Error("Bulk update failed");

      toast({ title: "Bulk Action Success", description: `Updated ${ids.length} reports.` });
      fetchIncidents();
    } catch (err) {
      toast({ title: "Bulk Action Failed", variant: "destructive" });
    }
  };

  /* ---------------- DELETE INCIDENT ---------------- */
  async function deleteIncident(id: string) {
    try {
      const res = await fetch(`${API_BASE}/incidents/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });

      if (res.ok) {
        toast({ title: "Incident removed" });
        fetchIncidents();
        setSelectedIncident(null);
      }
    } catch (err) {
      toast({ title: "Error deleting incident", variant: "destructive" });
    }
  }

  /* ---------------- UPDATE STATUS ---------------- */
  async function updateIncidentStatus(id: string, status: Incident['status']) {
    try {
      const res = await fetch(`${API_BASE}/incidents/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast({ title: `Incident status updated to ${status}` });
        fetchIncidents();
        setSelectedIncident(null);
      }
    } catch {
      toast({ title: "Error updating incident", variant: "destructive" });
    }
  }

  /* ---------------- TOGGLE IMPORTANT ---------------- */
  async function toggleIncidentImportance(id: string, isImportant: boolean) {
    try {
      const res = await fetch(`${API_BASE}/incidents/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ isImportant }),
      });

      if (res.ok) {
        toast({ title: isImportant ? "Marked as Important" : "Removed from Important" });
        fetchIncidents();
        if (selectedIncident && selectedIncident._id === id) {
          setSelectedIncident({ ...selectedIncident, isImportant });
        }
      }
    } catch {
      toast({ title: "Error toggling importance", variant: "destructive" });
    }
  }

  /* ---------------- USER MANAGEMENT ---------------- */

  async function fetchUserIncidents(id: string) {
    try {
      const res = await fetch(`${API_BASE}/users/${id}/incidents`, {
        headers: getAuthHeaders(token),
      });
      setUserIncidents(await res.json());
    } catch { /* silent */ }
  }

  /* ---------------- UI HELPERS ---------------- */
  const getTabInfo = () => {
    switch (activeTab) {
      case 'dashboard': return { title: 'Strategic Analytics', desc: 'Real-time community insights and growth trends.', icon: <LayoutDashboard /> };
      case 'incidents': return { title: 'Incident Moderation', desc: 'High-speed report verification and auditing.', icon: <ListFilter /> };
      case 'users': return { title: 'Citizen Control', desc: 'Access privilege and identity management.', icon: <Users /> };
      case 'areacodes': return { title: 'Area Code Management', desc: 'Create and manage community area codes.', icon: <MapPin /> };
      case 'polls': return { title: 'Community Engagement', desc: 'Create and track neighborhood sentiment polls.', icon: <Target className="rotate-45" /> };
      case 'challenges': return { title: 'Community Challenges', desc: 'Launch and track community safety missions.', icon: <Target /> };
      case 'ads': return { title: 'Broadcast Campaigns', desc: 'Manage promotional banners and advertisements.', icon: <ImageIcon /> };
      case 'support': return { title: 'Community Support', desc: 'Feedback resolutions and citizen helpdesk.', icon: <LifeBuoy /> };
      case 'reports': return { title: 'Citizen Reports', desc: 'Manage user violations and disciplinary actions.', icon: <Flag /> };
      case 'announcements': return { title: 'Broadcast Center', desc: 'Send community-wide alerts and news.', icon: <Megaphone /> };
      case 'activity': return { title: 'System Activity', desc: 'Administrative audit logs and security history.', icon: <Activity /> };
      default: return { title: 'Admin Console', desc: 'Enterprise management interface.', icon: <Zap /> };
    }
  };

  if (isLoading || !isAdmin) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-12 w-12 text-primary animate-spin" /></div>;

  const info = getTabInfo();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <CyberSidebar
        active={activeTab}
        onSelect={setActiveTab}
        onFilter={setStatusFilter}
        onLogout={() => { localStorage.clear(); navigate("/"); }}
        isSuperAdmin={isSuperAdmin}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-300">
        <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-xl border-b border-border/50 px-4 md:px-10 py-4 md:py-6 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 hover:bg-accent/10 rounded-xl transition-colors"
            >
              <Menu className="h-6 w-6 text-foreground" />
            </button>
            <div className="hidden md:block h-12 w-12 rounded-xl bg-gradient-to-tr from-primary to-accent p-0.5 shadow-lg shadow-primary/10">
              <div className="h-full w-full rounded-[10px] bg-background flex items-center justify-center p-2 overflow-hidden">
                <img
                  src="/assets/splash.png"
                  alt="Nexus AI"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">{info.title}</h1>
              <p className="text-xs text-muted-foreground font-semibold">{info.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => { if (activeTab === 'incidents') fetchIncidents(); if (activeTab === 'users') fetchUsers(); }}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/50 border border-border/50 hover:bg-muted transition-colors shadow-sm"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={() => navigate("/")} className="px-6 h-10 bg-primary text-primary-foreground font-black text-xs rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 uppercase tracking-widest">
              EXIT TERMINAL
            </button>
          </div>
        </header>

        <main className="p-3 md:p-10 max-w-[1400px] mx-auto w-full flex-1 overflow-x-hidden">
          {activeTab === "dashboard" && <DashboardStats />}

          {activeTab === "incidents" && (
            <div className="space-y-6">
              {/* Quick Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-muted/30 p-4 rounded-2xl border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
                  <p className="text-2xl font-black">{incidents.length}</p>
                </div>
                <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Pending</p>
                  <p className="text-2xl font-black text-amber-600">{incidents.filter(i => i.status === 'pending').length}</p>
                </div>
                <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/20">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Processing</p>
                  <p className="text-2xl font-black text-blue-600">{incidents.filter(i => i.status === 'under process').length}</p>
                </div>
                <div className="bg-purple-500/5 p-4 rounded-2xl border border-purple-500/20">
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Resolved</p>
                  <p className="text-2xl font-black text-purple-600">{incidents.filter(i => i.status === 'problem solved' || i.status === 'approved').length}</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative w-full md:max-w-sm">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search incidents..."
                    className="w-full pl-11 h-11 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none shadow-sm font-bold placeholder:font-normal"
                  />
                  <Search className="absolute left-4 top-3.5 text-muted-foreground/60 h-4 w-4" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
                  <select
                    value={importanceFilter}
                    onChange={(e) => setImportanceFilter(e.target.value)}
                    className="h-11 w-full bg-background border border-border px-4 rounded-xl text-xs font-bold outline-none text-primary shadow-sm hover:border-primary transition-colors cursor-pointer appearance-none"
                  >
                    <option value="all" className="bg-background text-foreground font-bold">All Priority</option>
                    <option value="important" className="bg-background text-foreground font-bold">⭐ Important</option>
                    <option value="regular" className="bg-background text-foreground font-bold">Regular</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-11 w-full bg-background border border-border px-4 rounded-xl text-xs font-bold outline-none shadow-sm hover:border-primary transition-colors cursor-pointer appearance-none text-foreground"
                  >
                    <option value="all" className="bg-background text-foreground font-bold">All Status</option>
                    <option value="pending" className="bg-background text-foreground font-bold">Pending</option>
                    <option value="under process" className="bg-background text-foreground font-bold">Processing</option>
                    <option value="approved" className="bg-background text-foreground font-bold">Approved</option>
                    <option value="rejected" className="bg-background text-foreground font-bold">Rejected</option>
                    <option value="problem solved" className="bg-background text-foreground font-bold">Solved</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-11 w-full bg-background border border-border px-4 rounded-xl text-xs font-bold outline-none shadow-sm hover:border-primary transition-colors cursor-pointer appearance-none text-foreground"
                  >
                    <option value="all" className="bg-background text-foreground font-bold">All Types</option>
                    <option value="theft" className="bg-background text-foreground font-bold">Theft</option>
                    <option value="vandalism" className="bg-background text-foreground font-bold">Vandalism</option>
                    <option value="suspicious" className="bg-background text-foreground font-bold">Suspicious</option>
                    <option value="assault" className="bg-background text-foreground font-bold">Assault</option>
                    <option value="fire" className="bg-background text-foreground font-bold">Fire</option>
                    <option value="medical" className="bg-background text-foreground font-bold">Medical</option>
                    <option value="hazard" className="bg-background text-foreground font-bold">Hazard</option>
                    <option value="traffic" className="bg-background text-foreground font-bold">Traffic</option>
                    <option value="infrastructure" className="bg-background text-foreground font-bold">Infrastructure</option>
                    <option value="nuisance" className="bg-background text-foreground font-bold">Nuisance</option>
                    <option value="missing" className="bg-background text-foreground font-bold">Missing</option>
                    <option value="harassment" className="bg-background text-foreground font-bold">Harassment</option>
                    <option value="other" className="bg-background text-foreground font-bold">Other</option>
                  </select>
                </div>
              </div>

              {loadingIncidents ? (
                <TableSkeleton />
              ) : (
                <CyberIncidentTable
                  incidents={filteredIncidents}
                  onView={setSelectedIncident}
                  onDelete={deleteIncident}
                  onBulkUpdate={handleBulkUpdate}
                />
              )}
            </div>
          )}

          {activeTab === "users" && (
            loadingUsers ? (
              <TableSkeleton />
            ) : (
              <UserTable users={users} onView={(u: UserType) => { setSelectedUser(u); fetchUserIncidents(u._id); }} />
            )
          )}


          {activeTab === "areacodes" && isSuperAdmin && <AreaCodeManager />}

          {activeTab === "areacodes" && !isSuperAdmin && (
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
              <Shield className="h-16 w-16 text-destructive opacity-50" />
              <h2 className="text-xl font-bold">Access Restricted</h2>
              <p className="text-muted-foreground text-center">Only SuperAdmins can manage area codes.</p>
              <button
                onClick={() => setActiveTab("dashboard")}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {activeTab === "support" && <SupportManager />}

          {activeTab === "reports" && <ReportManager />}

          {activeTab === "announcements" && <CreateAnnouncement />}

          {activeTab === "polls" && <PollManager />}

          {activeTab === "challenges" && <CreateChallenge />}

          {activeTab === "ads" && <AdManager />}

          {activeTab === "activity" && <AuditLogViewer />}
        </main>
      </div >

      {/* MODALS */}
      {
        selectedIncident && (
          <CyberIncidentModal
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
            onUpdateStatus={(id, status) => updateIncidentStatus(id, status)}
            onToggleImportant={(id, important) => toggleIncidentImportance(id, important)}
            onDelete={deleteIncident}
          />
        )
      }

      {
        selectedUser && (
          <UserModal
            user={selectedUser}
            incidents={userIncidents}
            onClose={() => setSelectedUser(null)}
            onPromote={async (id: string) => {
              const res = await fetch(`${API_BASE}/users/${id}/promote`, { method: "PATCH", headers: getAuthHeaders(token) });
              if (res.ok) { toast({ title: "User Promoted" }); fetchUsers(); setSelectedUser(null); }
            }}
            onDemote={async (id: string) => {
              const res = await fetch(`${API_BASE}/users/${id}/demote`, { method: "PATCH", headers: getAuthHeaders(token) });
              if (res.ok) { toast({ title: "Admin Role Removed" }); fetchUsers(); setSelectedUser(null); }
            }}
            onDelete={async (id: string) => {
              const res = await fetch(`${API_BASE}/users/${id}`, { method: "DELETE", headers: getAuthHeaders(token) });
              if (res.ok) { toast({ title: "User Deleted" }); fetchUsers(); setSelectedUser(null); }
            }}
            onUnsuspend={async (id: string) => {
              const res = await fetch(`${API_BASE}/users/${id}/unsuspend`, { method: "PATCH", headers: getAuthHeaders(token) });
              if (res.ok) {
                toast({ title: "Suspension Lifted" });
                fetchUsers();
                setSelectedUser(null);
              } else {
                toast({ title: "Failed to unsuspend", variant: "destructive" });
              }
            }}
          />
        )
      }
    </div >
  );
}
