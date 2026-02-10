import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, Shield, ExternalLink, Users, UserCog } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

import { User as UserType } from "@/types";

export interface UserTableProps {
  users: UserType[];
  onView: (user: UserType) => void;
}

export default function UserTable({ users, onView }: UserTableProps) {
  const [roleFilter, setRoleFilter] = useState<"all" | "citizens" | "admins">("all");
  const [areaCodeFilter, setAreaCodeFilter] = useState("");

  // Get unique area codes for filter dropdown
  const uniqueAreaCodes = Array.from(new Set(users.map(u => u.areaCode).filter(Boolean)));

  // Filter users based on role and area code
  const filteredUsers = users.filter((u) => {
    // Role Filter
    if (roleFilter === "citizens" && (u.roles?.includes("admin") || u.roles?.includes("superadmin"))) return false;
    if (roleFilter === "admins" && !u.roles?.includes("admin") && !u.roles?.includes("superadmin")) return false;

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
        <div className="flex gap-2">
          <button
            onClick={() => setRoleFilter("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${roleFilter === "all"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
          >
            <Users className="h-4 w-4" />
            All ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter("citizens")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${roleFilter === "citizens"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
          >
            <User className="h-4 w-4" />
            Citizens ({citizenCount})
          </button>
          <button
            onClick={() => setRoleFilter("admins")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${roleFilter === "admins"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
          >
            <UserCog className="h-4 w-4" />
            Admins ({adminCount})
          </button>
        </div>

        {/* Area Code Filter */}
        <div className="w-full md:w-auto">
          <select
            className="h-10 w-full md:w-48 bg-muted/30 border border-border/50 rounded-lg px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
            value={areaCodeFilter}
            onChange={(e) => setAreaCodeFilter(e.target.value)}
          >
            <option value="">All Areas</option>
            {uniqueAreaCodes.map(code => (
              <option key={code} value={code as string}>{code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-[#071328] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-[#0b1220] border-b border-gray-800">
              <tr>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Identifier</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Area Code</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Access Roles</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Member Since</th>
                <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800">
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
                        <div className="font-bold text-slate-100 text-sm md:text-base">{u.name || "Anonymous User"}</div>
                        <div className="text-[10px] md:text-xs text-slate-500 flex items-center gap-1.5 break-all">
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
                      <span className="text-slate-600 text-xs italic">N/A</span>
                    )}
                  </td>

                  <td className="px-4 md:px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      ...
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
                    <div className="text-xs md:text-sm text-slate-400 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-600" />
                      {(() => { try { return format(new Date(u.createdAt), "MMM dd, yyyy"); } catch { return "N/A"; } })()}
                    </div>
                  </td>

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
          <div key={u._id} className="bg-[#071328] border border-gray-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
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
                  <div className="font-bold text-slate-100 text-sm">{u.name || "Anonymous User"}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {u.email}
                  </div>
                  {u.areaCode && (
                    <Badge variant="outline" className="mt-1 border-border/50 text-muted-foreground bg-muted/20 text-[10px] py-0 px-1.5 w-fit">
                      {u.areaCode}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-3 mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Joined On</span>
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-600" />
                  {(() => { try { return format(new Date(u.createdAt), "MMM dd, yyyy"); } catch { return "N/A"; } })()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800">
                <span className="text-slate-500 font-medium">Badges</span>
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
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onView(u)}
              className="w-full bg-gray-800 hover:bg-gray-700 text-slate-200 h-9 rounded-lg font-bold text-xs"
            >
              Manage Profile <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
