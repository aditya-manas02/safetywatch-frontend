import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { toast } from "sonner";
import { Vote, Users, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PollOption {
    text: string;
    votes: string[];
}

interface Poll {
    _id: string;
    question: string;
    options: PollOption[];
    areaCode: string;
    expiresAt?: string;
}

export default function PollsWidget() {
    const { user, token } = useAuth();
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);
    const [votingId, setVotingId] = useState<string | null>(null);

    const fetchPolls = async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_BASE}/polls?areaCode=${user.areaCode}`, {
                headers: getAuthHeaders(token)
            });
            if (res.ok) {
                const data = await res.json();
                setPolls(data);
            }
        } catch (err) {
            console.error("Failed to fetch polls:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolls();
    }, [user]);

    const handleVote = async (pollId: string, optionIndex: number) => {
        if (!user) {
            toast.error("Please sign in to vote");
            return;
        }
        setVotingId(pollId);
        try {
            const res = await fetch(`${API_BASE}/polls/${pollId}/vote`, {
                method: "PATCH",
                headers: getAuthHeaders(token),
                body: JSON.stringify({ optionIndex })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Vote recorded!");
                fetchPolls(); // Refresh to see results
            } else {
                toast.error(data.message || "Failed to vote");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setVotingId(null);
        }
    };

    if (!user) return null;
    if (loading) return (
        <Card className="border-none bg-card/50 backdrop-blur-3xl rounded-[2rem] overflow-hidden shadow-xl animate-pulse">
            <div className="h-40 bg-muted/20" />
        </Card>
    );

    if (polls.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest mb-1">
                        <Vote className="h-3.5 w-3.5" /> Community Pulse
                    </div>
                    <h3 className="text-xl font-black">Active Polls</h3>
                </div>
            </div>

            <AnimatePresence>
                {polls.map((poll) => {
                    const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);
                    const hasVoted = poll.options.some(opt => opt.votes.includes(user.id));

                    return (
                        <motion.div
                            key={poll._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="relative border border-border/50 shadow-xl overflow-hidden bg-card/50 backdrop-blur-3xl rounded-[2rem] group">
                                <CardHeader className="p-6 pb-2">
                                    <div className="flex justify-between items-start gap-4">
                                        <CardTitle className="text-lg font-black tracking-tight leading-tight">
                                            {poll.question}
                                        </CardTitle>
                                        {poll.expiresAt && (
                                            <Badge variant="outline" className="text-[9px] uppercase tracking-tighter shrink-0 border-white/10">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {new Date(poll.expiresAt).toLocaleDateString()}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 pt-4 space-y-4">
                                    <div className="grid gap-3">
                                        {poll.options.map((option, idx) => {
                                            const percentage = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
                                            const isSelected = option.votes.includes(user.id);

                                            return (
                                                <div key={idx} className="space-y-2">
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full justify-start h-12 rounded-xl text-sm font-bold transition-all relative overflow-hidden group/opt",
                                                            isSelected ? "border-primary bg-primary/5" : "hover:border-primary/50",
                                                            hasVoted && "cursor-default"
                                                        )}
                                                        onClick={() => !hasVoted && handleVote(poll._id, idx)}
                                                        disabled={votingId === poll._id}
                                                    >
                                                        <span className="relative z-10 flex items-center justify-between w-full">
                                                            <span className="flex items-center gap-2">
                                                                {option.text}
                                                                {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                                            </span>
                                                            {hasVoted && (
                                                                <span className="text-xs opacity-60">{Math.round(percentage)}%</span>
                                                            )}
                                                        </span>
                                                    </Button>
                                                    {hasVoted && (
                                                        <Progress value={percentage} className="h-1 bg-primary/10" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                            <Users className="h-3.5 w-3.5" />
                                            {totalVotes} Participants
                                        </div>
                                        {hasVoted && (
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                                                Vote Registered
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
