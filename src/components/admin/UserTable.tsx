import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, Shield, ExternalLink, Users, UserCog, Ban } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { User as UserType } from "@/types";

export interface UserTableProps {
  users: UserType[];
  onView: (user: UserType) => void;
}

export default function UserTable({ users, onView }: UserTableProps) {
  const { isSuperAdmin } = useAuth();
  const [roleFilter, setRoleFilter] = useState<"all" | "citizens" | "admins" | "suspended">("all");
  const [areaCodeFilter, setAreaCodeFilter] = useState("");

  // Get unique area codes for filter dropdown
  const uniqueAreaCodes = Array.from(new Set(users.map(u => u.areaCode).filter(Boolean)));

  // Filter users based on role and area code
  const filteredUsers = users.filter((u) => {
    // Role Filter
    if (roleFilter === "citizens" && (u.roles?.includes("admin") || u.roles?.includes("superadmin"))) return false;
    if (roleFilter === "admins" && !u.roles?.includes("admin") && !u.roles?.includes("superadmin")) return false;
    if (roleFilter === "suspended" && !u.isSuspended) return false;

    // Area Code Filter
    if (areaCodeFilter && u.areaCode !== areaCodeFilter) return false;

    return true;
  });

  const citizenCount = users.filter(u => !u.roles?.includes("admin") && !u.roles?.includes("superadmin")).length;
  const adminCount = users.filter(u => u.roles?.includes("admin") || u.roles?.includes("superadmin")).length;

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
        {/* Role Filter Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setRoleFilter("all")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all whitespace-nowrap min-w-[80px] ${roleFilter === "all"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent shadow-sm"
              }`}
          >
            <Users className="h-4 w-4" />
            All ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter("citizens")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all whitespace-nowrap min-w-[100px] ${roleFilter === "citizens"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent shadow-sm"
              }`}
          >
            <User className="h-4 w-4" />
            Citizens ({citizenCount})
          </button>
          <button
            onClick={() => setRoleFilter("admins")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all whitespace-nowrap min-w-[90px] ${roleFilter === "admins"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent shadow-sm"
              }`}
          >
            <UserCog className="h-4 w-4" />
            Admins ({adminCount})
          </button>
          <button
            onClick={() => setRoleFilter("suspended")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all whitespace-nowrap min-w-[110px] ${roleFilter === "suspended"
              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
              : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent shadow-sm"
              }`}
          >
            <Ban className="h-4 w-4" />
            Suspended ({users.filter(u => u.isSuspended).length})
          </button>
        </div>

        {/* Area Code Filter */}
        <div className="w-full md:w-auto">
          <select
            className="h-10 w-full md:w-48 bg-background border border-border rounded-lg px-3 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20 shadow-sm appearance-none cursor-pointer hover:border-primary/50 transition-colors"
            value={areaCodeFilter}
            onChange={(e) => setAreaCodeFilter(e.target.value)}
          >
            <option value="" className="bg-background text-foreground font-bold italic">All Areas</option>
            {uniqueAreaCodes.map(code => (
              <option key={code} value={code as string} className="bg-background text-foreground font-bold">{code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">Identifier</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">Area Code</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">Access Roles</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">Member Since</th>
                {isSuperAdmin && <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">App Version</th>}
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredUsers.map((u: UserType) => (
                <tr key={u._id} className="transition-colors hover:bg-white/5 group">
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform overflow-hidden relative">
                        {u.profilePicture ? (
                          <img src={u.profilePicture} alt={u.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-sm md:text-base flex items-center gap-2">
                          {u.name || "Anonymous User"}
                          {u.isSuspended && (
                            <Badge className="bg-rose-500/10 text-rose-500 border-none h-4 md:h-5 px-1.5 md:px-2 text-[8px] md:text-[10px] font-black uppercase tracking-tighter shadow-sm whitespace-nowrap">
                              Suspended
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1.5 break-all font-medium opacity-80">
                          <Mail className="h-3 w-3 flex-shrink-0" /> {u.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 md:px-6 py-4">
                    {u.areaCode ? (
                      <Badge variant="outline" className="border-border/50 text-muted-foreground bg-muted/20">
                        {u.areaCode}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground opacity-40 text-xs italic">N/A</span>
                    )}
                  </td>

                  <td className="px-4 md:px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {u.roles?.map((role: string) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className={`capitalize border-none py-0 px-2 text-[10px] font-black ${role === 'admin' || role === 'superadmin'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                            }`}
                        >
                          <Shield className="h-2.5 w-2.5 mr-1" /> {role}
                        </Badge>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 md:px-6 py-4">
                    <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-2 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
                      {(() => { try { return format(new Date(u.createdAt), "MMM dd, yyyy"); } catch { return "N/A"; } })()}
                    </div>
                  </td>

                  {isSuperAdmin && (
                    <td className="px-4 md:px-6 py-4">
                      {u.appVersion && u.appVersion !== "Unknown" ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground bg-muted/30 w-fit px-2 py-1 rounded-md border border-border/50 shadow-sm">
                          <Smartphone className="h-3.5 w-3.5 text-muted-foreground/70" />
                          v{u.appVersion}
                        </div>
                      ) : (
                        <span className="text-muted-foreground opacity-40 text-xs italic">Unknown</span>
                      )}
                    </td>
                  )}

                  <td className="px-4 md:px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(u)}
                      className="text-primary hover:bg-primary/10 h-8 md:h-9 rounded-lg px-2 md:px-4 text-xs md:text-sm"
                    >
                      Manage <ExternalLink className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((u: UserType) => (
          <div key={u._id} className="bg-card border border-border rounded-xl p-4 shadow-md relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden relative">
                  {u.profilePicture ? (
                    <img src={u.profilePicture} alt={u.name} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">{u.name || "Anonymous User"}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium opacity-80">
                    <Mail className="h-3 w-3" /> {u.email}
                  </div>
                  {u.areaCode && (
                    <Badge variant="outline" className="mt-1 border-border/50 text-muted-foreground bg-muted/40 text-[10px] py-0 px-1.5 w-fit font-bold">
                      {u.areaCode}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 mb-4 space-y-2 border border-border/40">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-bold opacity-70">Joined On</span>
                <span className="text-foreground font-black flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary/50" />
                  {(() => { try { return format(new Date(u.createdAt), "MMM dd, yyyy"); } catch { return "N/A"; } })()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                <span className="text-muted-foreground font-bold opacity-70">Roles</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {u.roles?.map((role: string) => (
                    <Badge
                      key={role}
                      variant="outline"
                      className={`capitalize border-none py-0 px-1.5 text-[10px] font-black ${role === 'admin' || role === 'superadmin'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              {isSuperAdmin && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                  <span className="text-muted-foreground font-bold opacity-70">App Version</span>
                  <span className="text-foreground font-black flex items-center gap-1">
                    <Smartphone className="h-3.5 w-3.5 text-muted-foreground/70" />
                    {u.appVersion && u.appVersion !== "Unknown" ? `v${u.appVersion}` : <span className="italic opacity-50">Unknown</span>}
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(u)}
              className="w-full bg-muted/50 hover:bg-muted text-foreground h-9 rounded-lg font-bold text-xs border-border/50"
            >
              Manage Profile <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
