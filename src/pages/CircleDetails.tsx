import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    MapPin,
    Shield,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ArrowLeft,
    Share2,
    MoreVertical,
    LogOut,
    Phone,
    Mail,
    Loader2,
    Calendar,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import IncidentCard from "@/components/IncidentCard";
import { useRef } from "react";

interface CircleMember {
    user: {
        _id: string;
        name: string;
        profilePicture?: string;
        email: string;
        phone?: string;
    };
    role: 'admin' | 'member';
    joinedAt: string;
}

interface SafetyStatus {
    _id: string;
    user: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    status: 'Safe' | 'Need Help' | 'In Danger' | 'Unknown';
    note?: string;
    lastCheckIn: string;
}

interface CircleDetails {
    _id: string;
    name: string;
    type: string;
    inviteCode: string;
    members: CircleMember[];
    sharedIncidents: any[];
    createdAt?: string;
}

export default function CircleDetails() {
    const { id } = useParams();
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [circle, setCircle] = useState<CircleDetails | null>(null);
    const [statuses, setStatuses] = useState<SafetyStatus[]>([]);
    const rawIncidents = useRef<any[]>([]);

    const translateIncidents = async (incidents: any[], lang: string) => {
        return [...incidents];
    };

    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const [checkInStatus, setCheckInStatus] = useState<'Safe' | 'Need Help' | 'In Danger'>('Safe');
    const [checkInNote, setCheckInNote] = useState("");
    const [submittingStatus, setSubmittingStatus] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/auth");
            return;
        }
        fetchCircleDetails();

    }, [id, user, circle?.name]);

    const fetchCircleDetails = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/circles/${id}`, {
                headers: getAuthHeaders(token)
            });
            const data = await res.json();

            if (res.ok) {
                rawIncidents.current = data.circle.sharedIncidents || [];
                setCircle({ ...data.circle, sharedIncidents: rawIncidents.current });
                setStatuses(data.statuses);
            } else {
                toast.error(data.message || "Failed to load circle details");
                navigate("/circles");
            }
        } catch (err) {
            console.error("Error:", err);
            toast.error("Connection error");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        setSubmittingStatus(true);
        try {
            // Get location if possible
            let locationData = {};
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                });
                locationData = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                };
            } catch (locErr) {
                console.warn("Location not available for check-in");
            }

            const res = await fetch(`${API_BASE}/circles/${id}/status`, {
                method: "POST",
                headers: getAuthHeaders(token),
                body: JSON.stringify({
                    status: checkInStatus,
                    note: checkInNote,
                    ...locationData
                })
            });

            if (res.ok) {
                toast.success("Status updated!");
                setIsCheckInOpen(false);
                setCheckInNote("");
                fetchCircleDetails(); // Refresh
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to update status");
            }
        } catch (err) {
            toast.error("Connection error");
        } finally {
            setSubmittingStatus(false);
        }
    };

    const handleLeaveCircle = async () => {
        if (!window.confirm("Are you sure you want to leave this circle?")) return;

        try {
            const res = await fetch(`${API_BASE}/circles/${id}/leave`, {
                method: "POST",
                headers: getAuthHeaders(token)
            });

            if (res.ok) {
                toast.success("You left the circle");
                navigate("/circles");
            }
        } catch (err) {
            toast.error("Failed to leave circle");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Safe':
                return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">SAFE</Badge>;
            case 'Need Help':
                return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20">NEED HELP</Badge>;
            case 'In Danger':
                return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20">IN DANGER</Badge>;
            default:
                return <Badge variant="outline" className="opacity-50">UNKNOWN</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center opacity-50">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="font-bold tracking-widest uppercase text-xs">Decrypting Circle Data...</p>
            </div>
        );
    }

    if (!circle) return null;

    return (
        <div className="min-h-screen pb-20 pt-4">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Navigation / Actions */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/circles")}
                            className="rounded-full bg-white/5 hover:bg-white/10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight">{circle.name}</h1>
                                <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-white/10">{circle.type}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase mt-1">
                                SECURE CODE: <span className="text-primary">{circle.inviteCode}</span>
                            </p>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full bg-white/5">
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl bg-[#020817] border-white/10">
                            <DropdownMenuItem
                                className="rounded-xl py-3 focus:bg-white/10 cursor-pointer"
                                onClick={() => {
                                    navigator.clipboard.writeText(circle.inviteCode);
                                    toast.success("Invite code copied!");
                                }}
                            >
                                <Share2 className="h-4 w-4 mr-2" /> Copy Invite Code
                            </DropdownMenuItem>
                            <Separator className="my-1 bg-white/5" />
                            <DropdownMenuItem
                                className="rounded-xl py-3 text-rose-500 focus:bg-rose-500/10 focus:text-rose-500 cursor-pointer"
                                onClick={handleLeaveCircle}
                            >
                                <LogOut className="h-4 w-4 mr-2" /> Leave Circle
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Quick Check-In */}
                <Card className="mb-10 bg-primary/10 border-primary/20 p-6 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Shield className="h-32 w-32 text-primary" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-xl font-black mb-1">Safety Check-In</h2>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Update your status to let everyone in <span className="text-foreground font-bold">{circle.name}</span> know you're safe.
                            </p>
                        </div>

                        <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
                            <DialogTrigger asChild>
                                <Button className="h-14 px-8 rounded-2xl font-black tracking-widest shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">
                                    CHECK-IN NOW
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[2.5rem] border-white/10 bg-[#020817]/95 backdrop-blur-2xl p-8">
                                <DialogHeader className="mb-6">
                                    <DialogTitle className="text-3xl font-black text-center">Status Update</DialogTitle>
                                </DialogHeader>

                                <div className="grid grid-cols-3 gap-3 mb-8">
                                    <button
                                        onClick={() => setCheckInStatus('Safe')}
                                        className={`flex flex-col items-center gap-3 p-5 rounded-3xl transition-all border ${checkInStatus === 'Safe'
                                            ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/10'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <CheckCircle2 className={`h-8 w-8 ${checkInStatus === 'Safe' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                        <span className={`text-[10px] font-black tracking-widest ${checkInStatus === 'Safe' ? 'text-emerald-500' : 'text-muted-foreground'}`}>SAFE</span>
                                    </button>

                                    <button
                                        onClick={() => setCheckInStatus('Need Help')}
                                        className={`flex flex-col items-center gap-3 p-5 rounded-3xl transition-all border ${checkInStatus === 'Need Help'
                                            ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/10'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <AlertTriangle className={`h-8 w-8 ${checkInStatus === 'Need Help' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                                        <span className={`text-[10px] font-black tracking-widest ${checkInStatus === 'Need Help' ? 'text-amber-500' : 'text-muted-foreground'}`}>HELP</span>
                                    </button>

                                    <button
                                        onClick={() => setCheckInStatus('In Danger')}
                                        className={`flex flex-col items-center gap-3 p-5 rounded-3xl transition-all border ${checkInStatus === 'In Danger'
                                            ? 'bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-500/10'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        <Shield className={`h-8 w-8 ${checkInStatus === 'In Danger' ? 'text-rose-500' : 'text-muted-foreground'}`} />
                                        <span className={`text-[10px] font-black tracking-widest ${checkInStatus === 'In Danger' ? 'text-rose-500' : 'text-muted-foreground'}`}>DANGER</span>
                                    </button>
                                </div>

                                <div className="space-y-3 mb-10">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1">Optional Note</label>
                                    <textarea
                                        placeholder="Briefly explain your situation..."
                                        value={checkInNote}
                                        onChange={(e) => setCheckInNote(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary/50 min-h-[100px] resize-none"
                                    />
                                </div>

                                <DialogFooter>
                                    <Button
                                        onClick={handleCheckIn}
                                        disabled={submittingStatus}
                                        className="w-full h-16 rounded-2xl font-black tracking-widest text-base shadow-2xl shadow-primary/30"
                                    >
                                        {submittingStatus && <Loader2 className="h-5 w-5 animate-spin mr-3" />}
                                        SECURE BROADCAST
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Members Status List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Member Status</h2>
                            <span className="text-[10px] font-bold text-muted-foreground/60">{statuses.length} Tracked Nodes</span>
                        </div>

                        <div className="space-y-4">
                            {statuses.map((status) => (
                                <Card key={status._id} className="bg-white/5 border-white/10 rounded-3xl overflow-hidden group hover:bg-white/[0.08] transition-all">
                                    <div className="p-5 flex items-center gap-4">
                                        <Avatar className="h-14 w-14 rounded-2xl border border-white/5 shadow-lg group-hover:scale-105 transition-transform">
                                            <AvatarImage src={status.user.profilePicture} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{status.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-base truncate">{status.user.name}</h3>
                                                {status.user._id === user?.id && (
                                                    <Badge variant="outline" className="text-[8px] h-4 bg-primary/5 text-primary border-primary/20">YOU</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1 font-medium">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(status.lastCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {status.note && (
                                                    <span className="truncate italic opacity-70 border-l border-white/10 pl-3">
                                                        "{status.note}"
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            {getStatusBadge(status.status)}
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-blue-500/20 hover:text-blue-400"
                                                    onClick={() => window.open(`tel:${circle.members.find(m => m.user._id === status.user._id)?.user.phone}`)}
                                                >
                                                    <Phone className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-teal-500/20 hover:text-teal-400"
                                                    onClick={() => window.open(`mailto:${circle.members.find(m => m.user._id === status.user._id)?.user.email}`)}
                                                >
                                                    <Mail className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Shared Alerts Section */}
                        <div className="pt-8 space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Circle Alerts
                                </h2>
                                <Badge className="bg-white/5 text-[9px] border-white/10">{circle.sharedIncidents.length}</Badge>
                            </div>

                            {circle.sharedIncidents.length === 0 ? (
                                <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center opacity-40">
                                    <p className="text-sm font-bold tracking-widest uppercase mb-2">No Passive Alerts</p>
                                    <p className="text-xs max-w-xs mx-auto">Shared incidents from the community feed will appear here for group analysis.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {circle.sharedIncidents.map((incident: any) => (
                                        <IncidentCard
                                            key={incident._id}
                                            incident={{
                                                ...incident,
                                                id: incident._id,
                                                timestamp: new Date(incident.createdAt)
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-8">
                        {/* Member Directory */}
                        <Card className="bg-white/5 border-white/10 rounded-3xl p-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                                <Users className="h-4 w-4" /> Directory
                            </h3>
                            <div className="space-y-4">
                                {circle.members.map((member) => (
                                    <div key={member.user._id} className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-white/10">
                                            <AvatarImage src={member.user.profilePicture} />
                                            <AvatarFallback className="text-[10px] font-bold">{member.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{member.user.name}</p>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-primary opacity-70">
                                                {member.role}
                                            </p>
                                        </div>
                                        {member.user._id !== user?.id && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-40 hover:opacity-100">
                                                <MessageSquare className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Circle Stats */}
                        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/10 rounded-3xl p-6 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/30">
                                    <Calendar className="h-6 w-6" />
                                </div>
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Active Since</h4>
                            <p className="text-sm font-bold">
                                {new Date(circle.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </p>
                        </Card>

                        {/* Secure Information */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-4 text-blue-400">
                                <Shield className="h-5 w-5" />
                                <h4 className="text-sm font-black tracking-widest uppercase">Encryption Status</h4>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                All status updates and shared alerts within this circle are encrypted and stored in private silos. Only members can decrypt this information.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
