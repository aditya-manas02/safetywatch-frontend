import { useState, useEffect } from "react";
import { ChallengeCard } from "./ChallengeCard";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ChallengesSection() {
    const [challenges, setChallenges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const res = await fetch(`${API_BASE}/challenges/active`, {
                    headers: getAuthHeaders(token)
                });
                if (res.ok) {
                    const data = await res.json();
                    setChallenges(data);
                }
            } catch (err) {
                console.error("Failed to fetch challenges:", err);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchChallenges();
    }, [token]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                    <Skeleton key={i} className="h-40 w-full rounded-2xl bg-muted/30" />
                ))}
            </div>
        );
    }

    if (!challenges || challenges.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
                        <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-black text-foreground tracking-tight">COMMUNITY CAMPAIGNS</h3>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">Active Challenges • Earn Recognition</p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 bg-muted/30 border border-border px-3 py-1.5 rounded-full shadow-sm">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-[9px] font-black text-muted-foreground tracking-widest uppercase">Safety Score +12%</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {challenges.map((challenge) => (
                    <ChallengeCard key={challenge._id} challenge={challenge} />
                ))}
            </div>

            {/* Decorative motivational line */}
            <div className="flex flex-col items-center gap-3 pt-4 opacity-20">
                <div className="flex items-center gap-4 w-full">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-foreground" />
                    <Sparkles className="h-4 w-4 text-foreground" />
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-foreground" />
                </div>
                <p className="text-[9px] font-black tracking-[0.3em] text-foreground uppercase italic">
                    Your participation directy improves neighborhood safety
                </p>
            </div>
        </div>
    );
}
