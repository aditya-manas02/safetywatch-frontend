import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { toast } from "sonner";
import { Target, Calendar, Award, Shield, Flame, Activity, Zap, Users, Trash2, Power, PowerOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreateChallenge() {
    const { token, user, isSuperAdmin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [areas, setAreas] = useState<any[]>([]);
    const [fetchingAreas, setFetchingAreas] = useState(false);
    const [challenges, setChallenges] = useState<any[]>([]);
    const [loadingChallenges, setLoadingChallenges] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "report_count",
        targetValue: 5,
        endDate: "",
        icon: "Target",
        points: 100,
        areaCode: user?.areaCode || ""
    });

    useEffect(() => {
        if (isSuperAdmin) {
            const fetchAreas = async () => {
                setFetchingAreas(true);
                try {
                    const res = await fetch(`${API_BASE}/area-codes`, {
                        headers: getAuthHeaders(token)
                    });
                    if (res.ok) setAreas(await res.json());
                } catch (err) {
                    console.error("Failed to fetch areas", err);
                } finally {
                    setFetchingAreas(false);
                }
            };
            fetchAreas();
        }
        fetchChallenges();
    }, [isSuperAdmin, token]);

    const fetchChallenges = async () => {
        setLoadingChallenges(true);
        try {
            const res = await fetch(`${API_BASE}/challenges`, {
                headers: getAuthHeaders(token)
            });
            if (res.ok) {
                const data = await res.json();
                setChallenges(data);
            }
        } catch (err) {
            console.error("Failed to fetch challenges", err);
        } finally {
            setLoadingChallenges(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                areaCode: formData.areaCode === "GLOBAL" ? "" : formData.areaCode
            };

            const res = await fetch(`${API_BASE}/challenges`, {
                method: "POST",
                headers: getAuthHeaders(token),
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create challenge");

            toast.success("Community Challenge Launched!");
            fetchChallenges();
            setFormData({
                title: "",
                description: "",
                type: "report_count",
                targetValue: 5,
                endDate: "",
                icon: "Target",
                points: 100,
                areaCode: user?.areaCode || ""
            });
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/challenges/${id}/toggle`, {
                method: "PATCH",
                headers: getAuthHeaders(token)
            });
            if (res.ok) {
                toast.success("Challenge Status Updated");
                fetchChallenges();
            }
        } catch (err) {
            toast.error("Failed to toggle status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this campaign? All progress data will be lost.")) return;
        
        try {
            const res = await fetch(`${API_BASE}/challenges/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(token)
            });
            if (res.ok) {
                toast.success("Campaign Terminated");
                fetchChallenges();
            }
        } catch (err) {
            toast.error("Failed to delete campaign");
        }
    };

    const icons = ["Target", "Shield", "Flame", "Activity", "Zap", "Users", "Award"];

    return (
        <Card className="bg-card/50 backdrop-blur-3xl border-white/10 overflow-hidden rounded-3xl">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                    <Target className="h-6 w-6 text-primary" />
                    LAUNCH NEW CAMPAIGN
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Challenge Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Neighborhood Vigilance Week"
                                className="bg-white/5 border-white/10 rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Campaign Type</Label>
                            <Select onValueChange={(v) => setFormData({ ...formData, type: v })} defaultValue={formData.type}>
                                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="report_count">Report Submission Count</SelectItem>
                                    <SelectItem value="vote_count">Community Verification (Votes)</SelectItem>
                                    <SelectItem value="area_safety_score">Area Safety Score</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Goal Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What should the community achieve?"
                                className="bg-white/5 border-white/10 rounded-xl min-h-[100px]"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Threshold</Label>
                            <Input
                                type="number"
                                value={formData.targetValue}
                                onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) })}
                                className="bg-white/5 border-white/10 rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">End Date</Label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="bg-white/5 border-white/10 rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reward Points</Label>
                            <Input
                                type="number"
                                value={formData.points}
                                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                                className="bg-white/5 border-white/10 rounded-xl"
                            />
                        </div>

                        {isSuperAdmin && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Area</Label>
                                <Select onValueChange={(v) => setFormData({ ...formData, areaCode: v })} value={formData.areaCode}>
                                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                                        <SelectValue placeholder="Select Area" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GLOBAL">GLOBAL (ALL AREAS)</SelectItem>
                                        {areas.map(area => (
                                            <SelectItem key={area.code} value={area.code}>
                                                {area.name} ({area.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Icon</Label>
                            <div className="flex flex-wrap gap-2">
                                {icons.map(icon => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, icon })}
                                        className={cn(
                                            "p-3 rounded-xl border transition-all",
                                            formData.icon === icon
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                        )}
                                    >
                                        {icon === "Shield" && <Shield className="h-4 w-4" />}
                                        {icon === "Flame" && <Flame className="h-4 w-4" />}
                                        {icon === "Activity" && <Activity className="h-4 w-4" />}
                                        {icon === "Zap" && <Zap className="h-4 w-4" />}
                                        {icon === "Users" && <Users className="h-4 w-4" />}
                                        {icon === "Target" && <Target className="h-4 w-4" />}
                                        {icon === "Award" && <Award className="h-4 w-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl"
                    >
                        {loading ? "COMMENCING OPERATIONS..." : "DEPLOY COMMUNITY CHALLENGE"}
                    </Button>
                </form>

                {/* MANAGEMENT SECTION */}
                <div className="mt-16 space-y-6">
                    <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-black uppercase tracking-tight">Ongoing Campaigns</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loadingChallenges ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : challenges.length === 0 ? (
                            <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10 text-muted-foreground text-sm font-bold">
                                No active campaigns in deployment.
                            </div>
                        ) : (
                            challenges.map(challenge => (
                                <div key={challenge._id} className="group relative bg-white/5 border border-white/10 rounded-3xl p-6 transition-all hover:bg-white/10">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                {challenge.icon === "Shield" && <Shield className="h-6 w-6" />}
                                                {challenge.icon === "Flame" && <Flame className="h-6 w-6" />}
                                                {challenge.icon === "Activity" && <Activity className="h-6 w-6" />}
                                                {challenge.icon === "Zap" && <Zap className="h-6 w-6" />}
                                                {challenge.icon === "Users" && <Users className="h-6 w-6" />}
                                                {challenge.icon === "Target" && <Target className="h-6 w-6" />}
                                                {challenge.icon === "Award" && <Award className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-lg tracking-tight">{challenge.title}</h4>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" /> Ends: {new Date(challenge.endDate).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                                                        <Award className="h-3 w-3" /> {challenge.points} Points
                                                    </span>
                                                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Shield className="h-3 w-3" /> {challenge.areaCode || "GLOBAL"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleToggle(challenge._id)}
                                                className={cn(
                                                    "flex-1 md:flex-none h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest",
                                                    challenge.isActive ? "text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10" : "text-amber-500 border-amber-500/20 hover:bg-amber-500/10"
                                                )}
                                            >
                                                {challenge.isActive ? (
                                                    <><Power className="h-3 w-3 mr-2" /> Active</>
                                                ) : (
                                                    <><PowerOff className="h-3 w-3 mr-2" /> Paused</>
                                                )}
                                            </Button>

                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleDelete(challenge._id)}
                                                className="h-10 w-10 rounded-xl shadow-lg shadow-red-500/20"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
