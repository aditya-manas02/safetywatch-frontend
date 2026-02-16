import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Plus,
    UserPlus,
    ChevronRight,
    Shield,
    Users2,
    Home,
    ArrowLeft,
    Loader2,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import AnimatedBackground from "@/components/AnimatedBackground";

interface Circle {
    _id: string;
    name: string;
    type: 'Family' | 'Friends' | 'Hostel';
    inviteCode: string;
    members: any[];
    creator: string;
    createdAt: string;
}

export default function Circles() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [circles, setCircles] = useState<Circle[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);

    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<string>("Family");
    const [inviteCode, setInviteCode] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate("/auth");
            return;
        }
        fetchCircles();
    }, [user]);

    const fetchCircles = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/circles`, {
                headers: getAuthHeaders(token)
            });
            const data = await res.json();
            if (res.ok) {
                setCircles(data);
            }
        } catch (err) {
            console.error("Failed to fetch circles:", err);
            toast.error("Failed to load circles");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCircle = async () => {
        if (!newName) {
            toast.error("Please enter a circle name");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/circles`, {
                method: "POST",
                headers: getAuthHeaders(token),
                body: JSON.stringify({ name: newName, type: newType })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success("Circle created successfully!");
                setCircles([...circles, data]);
                setIsCreateOpen(false);
                setNewName("");
                navigate(`/circles/${data._id}`);
            } else {
                toast.error(data.message || "Failed to create circle");
            }
        } catch (err) {
            toast.error("Connection error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoinCircle = async () => {
        if (!inviteCode) {
            toast.error("Please enter an invite code");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/circles/join`, {
                method: "POST",
                headers: getAuthHeaders(token),
                body: JSON.stringify({ inviteCode })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success("Joined circle successfully!");
                setCircles([...circles, data.circle]);
                setIsJoinOpen(false);
                setInviteCode("");
                navigate(`/circles/${data.circle._id}`);
            } else {
                toast.error(data.message || "Failed to join circle");
            }
        } catch (err) {
            toast.error("Connection error");
        } finally {
            setSubmitting(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Family': return <Home className="h-4 w-4" />;
            case 'Friends': return <Users2 className="h-4 w-4" />;
            case 'Hostel': return <Shield className="h-4 w-4" />;
            default: return <Users className="h-4 w-4" />;
        }
    };

    return (
        <div className="min-h-screen pb-20 pt-4">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/")}
                            className="rounded-full bg-white/5 hover:bg-white/10"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Invite Circles</h1>
                            <p className="text-muted-foreground text-sm">Stay connected with your inner circle</p>
                        </div>
                    </div>
                    <Users className="h-10 w-10 text-primary opacity-20 hidden sm:block" />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-24 rounded-3xl flex flex-col gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95">
                                <Plus className="h-6 w-6" />
                                <span className="font-bold">Create Circle</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl border-white/10 bg-[#020817]/95 backdrop-blur-xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Create a New Circle</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Circle Name</label>
                                    <Input
                                        placeholder="e.g. My Family"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="h-12 rounded-xl bg-white/5 border-white/10 focus:border-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Circle Type</label>
                                    <Select value={newType} onValueChange={setNewType}>
                                        <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Family">Family</SelectItem>
                                            <SelectItem value="Friends">Friends</SelectItem>
                                            <SelectItem value="Hostel">Hostel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleCreateCircle}
                                    disabled={submitting}
                                    className="w-full h-12 rounded-xl font-bold"
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Establish Circle
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="h-24 rounded-3xl flex flex-col gap-2 border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95">
                                <UserPlus className="h-6 w-6" />
                                <span className="font-bold">Join Circle</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl border-white/10 bg-[#020817]/95 backdrop-blur-xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Join a Circle</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Invite Code</label>
                                    <Input
                                        placeholder="ENTER CODE"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                        className="h-14 text-center text-2xl font-black tracking-[0.3em] rounded-xl bg-white/5 border-white/10 focus:border-primary placeholder:tracking-normal placeholder:font-medium placeholder:text-base"
                                    />
                                </div>
                                <p className="text-center text-xs text-muted-foreground">Ask the circle admin for a 8-character invite code.</p>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleJoinCircle}
                                    disabled={submitting}
                                    className="w-full h-12 rounded-xl font-bold"
                                >
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Join Verification
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Circles List */}
                <div className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Your Circles</h2>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p className="font-bold tracking-widest uppercase text-xs">Synchronizing Groups...</p>
                        </div>
                    ) : circles.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 border border-dashed border-white/10 rounded-[2rem] p-12 text-center"
                        >
                            <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-black mb-2">No active circles</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8">
                                Create a family or friend group to monitor each other's safety status in real-time.
                            </p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {circles.map((circle, index) => (
                                <motion.div
                                    key={circle._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card
                                        className="overflow-hidden border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer rounded-[2rem] group"
                                        onClick={() => navigate(`/circles/${circle._id}`)}
                                    >
                                        <div className="p-6 flex items-center gap-4">
                                            <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                                                <div className="text-primary">
                                                    {getTypeIcon(circle.type)}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-black">{circle.name}</h3>
                                                    <Badge variant="outline" className="text-[9px] uppercase tracking-widest px-2 py-0 h-4 border-white/10 bg-white/5">
                                                        {circle.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    {circle.members.length} member{circle.members.length !== 1 ? 's' : ''} • Code: <span className="text-primary font-black">{circle.inviteCode}</span>
                                                </p>
                                            </div>
                                            <div className="h-10 w-10 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                                <ChevronRight className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Security Tip */}
                <div className="mt-12 bg-primary/5 border border-primary/10 rounded-3xl p-6 flex gap-4 items-start">
                    <div className="bg-primary/10 p-2 rounded-xl text-primary">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1 uppercase tracking-wider">Privacy Notice</h4>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                            Circles are private end-to-end silos. Only people with the unique invite code can join. You can share your live safety status and receive critical alerts from circle members.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
