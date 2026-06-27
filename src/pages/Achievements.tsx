import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
    ArrowLeft, Trophy, Shield, ShieldCheck, Eye, Zap, Crown, CheckCircle2 
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const badgeDefinitions = [
    { name: "Community Vigilante", cost: 100, tier: "Common", description: "A local hero starting their journey. Earned for consistent reporting.", icon: "Shield", style: "border-bronze shadow-bronze/20 text-bronze bg-bronze/5" },
    { name: "Safety Guardian", cost: 500, tier: "Rare", description: "A trusted protector of the community. Silver metallic finish.", icon: "ShieldCheck", style: "border-slate-400 shadow-slate-400/20 text-slate-400 bg-slate-400/5" },
    { name: "Area Sentinel", cost: 1500, tier: "Epic", description: "The eyes and ears of the sector. Gold radiating aura.", icon: "Eye", style: "border-yellow-500 shadow-yellow-500/20 text-yellow-500 bg-yellow-500/5" },
    { name: "Elite Protector", cost: 5000, tier: "Legendary", description: "Master of regional security. Purple crystal energy.", icon: "Zap", style: "border-purple-500 shadow-purple-500/20 text-purple-500 bg-purple-500/5" },
    { name: "Safety Legend", cost: 15000, tier: "Mythic", description: "A beacon of hope for all citizens. Prismatic rainbow glow.", icon: "Crown", style: "border-pink-500 shadow-pink-500/20 text-pink-500 bg-pink-500/5 animate-pulse" }
];

export default function Achievements() {
    const navigate = useNavigate();
    const { user, isSuperAdmin } = useAuth();
    const [badges, setBadges] = useState<any[]>([]);
    const [rewardPoints, setRewardPoints] = useState(0);
    const [activeBadge, setActiveBadge] = useState<string | null>(null);

    useEffect(() => {
        // Load initial data from local storage
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setRewardPoints(savedUser.rewardPoints || 0);
        setBadges(savedUser.badges || []);
        setActiveBadge(savedUser.activeBadge || null);
    }, []);

    const handlePurchaseBadge = async (badgeName: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/users/badges/purchase`, {
                method: "POST",
                headers: getAuthHeaders(token),
                body: JSON.stringify({ badgeName })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Purchase failed");

            setRewardPoints(data.rewardPoints);
            setBadges(data.badges);
            toast.success(`You have acquired the ${badgeName} badge!`);

            // Update local storage
            const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...currentUser, rewardPoints: data.rewardPoints, badges: data.badges }));
        } catch (err: any) {
            toast.error(err.message || "Failed to purchase badge");
        }
    };

    const handleActiveBadgeChange = async (badgeName: string) => {
        try {
            const resp = await fetch(`${API_BASE}/users/active-badge`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ badgeName: badgeName === activeBadge ? null : badgeName })
            });

            const data = await resp.json();
            if (resp.ok) {
                setActiveBadge(data.activeBadge);
                // Update local storage user
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    const parsed = JSON.parse(savedUser);
                    parsed.activeBadge = data.activeBadge;
                    localStorage.setItem('user', JSON.stringify(parsed));
                }
                toast.success(data.activeBadge ? `Selected ${data.activeBadge} as active badge` : "Cleared active badge");
            } else {
                toast.error(data.message || "Failed to update active badge");
            }
        } catch (error) {
            toast.error("Error updating active badge");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen bg-background p-4 md:p-8 lg:p-12 pb-24"
        >
            <div className="max-w-4xl mx-auto space-y-8">
                <Button variant="ghost" onClick={() => navigate("/profile")} className="hover:bg-primary/10 -ml-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
                </Button>

                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight">Achievements</h1>
                    <p className="text-muted-foreground font-medium text-lg">Track your earned honors and acquire premium network badges.</p>
                </div>

                {/* EARNED HONORS */}
                {badges.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                                <Trophy className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Earned Honors</h2>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {badges.map((b: any, i: number) => {
                                const def = badgeDefinitions.find(d => d.name === b.name);
                                const isActive = activeBadge === b.name;
                                const IconComp = (LucideIcons as any)[def?.icon || ''] || Shield;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        onClick={() => handleActiveBadgeChange(b.name)}
                                        className={cn(
                                            "px-4 py-2 rounded-2xl border font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105",
                                            def?.style || "border-border text-muted-foreground",
                                            isActive && "ring-2 ring-primary ring-offset-4 ring-offset-background scale-110"
                                        )}
                                    >
                                        <IconComp className="h-3.5 w-3.5" />
                                        {b.name}
                                        {isActive && <CheckCircle2 className="h-3.5 w-3.5 ml-1" />}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* HONOR EMPORIUM */}
                <div className="space-y-6 pt-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between px-2 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner border border-indigo-500/20">
                                <Zap className="h-6 w-6" />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="text-2xl font-black tracking-tighter uppercase text-foreground">Honor Emporium</h2>
                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Acquire Premium Network Badges</p>
                            </div>
                        </div>
                        <div className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter text-indigo-500 shadow-sm shadow-indigo-500/5 backdrop-blur-md h-10">
                            Points Available: {isSuperAdmin ? "Unlimited" : rewardPoints}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {badgeDefinitions.map((badge, idx) => {
                            const isOwned = badges.some(b => b.name === badge.name);
                            const canAfford = isSuperAdmin || rewardPoints >= badge.cost;
                            const IconComp = (LucideIcons as any)[badge.icon] || Shield;

                            return (
                                <Card key={idx} className={cn(
                                    "overflow-hidden border-none glass-card-luxury group hover:shadow-2xl transition-all duration-500 rounded-3xl relative",
                                    isOwned && "opacity-80"
                                )}>
                                    {isOwned && (
                                        <div className="absolute top-4 right-4 z-20">
                                            <div className="bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-lg border-none shadow-lg shadow-emerald-500/20">OWNED</div>
                                        </div>
                                    )}
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-3 rounded-2xl border shadow-xl transition-transform group-hover:scale-110 duration-500",
                                                badge.style
                                            )}>
                                                <IconComp className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg tracking-tight uppercase leading-tight">{badge.name}</h3>
                                                <div className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase mt-1", badge.style)}>{badge.tier}</div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">{badge.description}</p>
                                        <div className="pt-2 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Trophy className="h-4 w-4 text-primary" />
                                                <span className="font-black text-base tracking-tight">{badge.cost.toLocaleString()} <span className="text-[10px] text-muted-foreground uppercase tracking-wider">PTS</span></span>
                                            </div>
                                            <Button
                                                size="sm"
                                                disabled={isOwned || !canAfford}
                                                onClick={() => handlePurchaseBadge(badge.name)}
                                                className={cn(
                                                    "rounded-xl font-black text-[10px] uppercase tracking-widest px-4 h-9",
                                                    isOwned ? "bg-muted text-muted-foreground cursor-not-allowed" :
                                                        !canAfford ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed" :
                                                            "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                                )}
                                            >
                                                {isOwned ? "ACQUIRED" : canAfford ? "PURCHASE" : "INSUFFICIENT"}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
