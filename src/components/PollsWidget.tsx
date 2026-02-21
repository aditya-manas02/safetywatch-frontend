import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { toast } from "sonner";
import { Vote, Users, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { translateText } from "@/hooks/useTranslation";

interface PollOption {
    text: string;
    votes: string[];
    originalText?: string;
}

interface Poll {
    _id: string;
    question: string;
    options: PollOption[];
    areaCode: string;
    expiresAt?: string;
    originalQuestion?: string;
}

export default function PollsWidget() {
    const { user, token } = useAuth();
    const [polls, setPolls] = useState<Poll[]>([]);
    const originalPolls = useRef<Poll[]>([]);
    const [loading, setLoading] = useState(true);
    const [votingId, setVotingId] = useState<string | null>(null);
    const [t, setT] = useState({
        communityPulse: "Community Pulse",
        activePolls: "Active Polls",
        participants: "Participants",
        voteRegistered: "Vote Registered",
        signInToVote: "Please sign in to vote",
        voteRecorded: "Vote recorded!",
        failedToVote: "Failed to vote",
        networkError: "Network error"
    });

    const translateUI = async (lang: string) => {
        const communityPulse = await translateText("Community Pulse", lang);
        const activePolls = await translateText("Active Polls", lang);
        const participants = await translateText("Participants", lang);
        const voteRegistered = await translateText("Vote Registered", lang);
        const signInToVote = await translateText("Please sign in to vote", lang);
        const voteRecorded = await translateText("Vote recorded!", lang);
        const failedToVote = await translateText("Failed to vote", lang);
        const networkError = await translateText("Network error", lang);

        setT({
            communityPulse, activePolls, participants, voteRegistered,
            signInToVote, voteRecorded, failedToVote, networkError
        });
    };

    const translateAll = async (pollsToTranslate: Poll[], targetLang: string) => {
        if (targetLang === "en") return;
        setLoading(true);
        try {
            const translated = await Promise.all(
                pollsToTranslate.map(async (poll) => {
                    const options = await Promise.all(
                        poll.options.map(async (opt) => {
                            return {
                                ...opt,
                                text: await translateText(opt.originalText || opt.text, targetLang)
                            };
                        })
                    );

                    return {
                        ...poll,
                        question: await translateText(poll.originalQuestion || poll.question, targetLang),
                        options
                    };
                })
            );
            setPolls(translated);
        } catch (err) {
            console.error("Poll translation fail:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const lang = localStorage.getItem("app_lang") || "en";
        translateUI(lang);

        const handleLangChange = (e: any) => {
            const targetLang = e.detail.lang;
            translateUI(targetLang);
            if (targetLang === "en") {
                setPolls(originalPolls.current);
            } else {
                translateAll(originalPolls.current, targetLang);
            }
        };
        window.addEventListener("languageChanged", handleLangChange);
        return () => window.removeEventListener("languageChanged", handleLangChange);
    }, []);

    const fetchPolls = async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_BASE}/polls?areaCode=${user.areaCode}`, {
                headers: getAuthHeaders(token)
            });
            if (res.ok) {
                const data = await res.json();
                const fresh = data.map((p: any) => ({
                    ...p,
                    originalQuestion: p.question,
                    options: p.options.map((o: any) => ({ ...o, originalText: o.text }))
                }));
                originalPolls.current = fresh;

                const lang = localStorage.getItem("app_lang") || "en";
                if (lang !== "en") {
                    translateAll(fresh, lang);
                } else {
                    setPolls(fresh);
                }
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
            toast.error(t.signInToVote);
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
                toast.success(t.voteRecorded);
                fetchPolls();
            } else {
                toast.error(data.message || t.failedToVote);
            }
        } catch (err) {
            toast.error(t.networkError);
        } finally {
            setVotingId(null);
        }
    };

    if (!user) return null;
    if (loading && polls.length === 0) return (
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
                        <Vote className="h-3.5 w-3.5" /> {t.communityPulse}
                    </div>
                    <h3 className="text-xl font-black">{t.activePolls}</h3>
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
                                            {totalVotes} {t.participants}
                                        </div>
                                        {hasVoted && (
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                                                {t.voteRegistered}
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
