import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Target, Users, Shield, Flame, Activity, Zap } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
    challenge: {
        _id: string;
        title: string;
        description: string;
        type: string;
        targetValue: number;
        progress: number;
        isCompleted: boolean;
        icon: string;
        points: number;
        endDate: string;
    };
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
    const percentage = Math.min(Math.round((challenge.progress / challenge.targetValue) * 100), 100);

    // Dynamically get icon
    const IconComponent = (LucideIcons as any)[challenge.icon] || Target;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "relative overflow-hidden group rounded-2xl border transition-all duration-300",
                challenge.isCompleted
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-white/5 border-white/10 hover:border-primary/30 hover:bg-white/10"
            )}
        >
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />

            <div className="relative p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2.5 rounded-xl border",
                            challenge.isCompleted
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-primary/10 border-primary/20 text-primary"
                        )}>
                            <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight leading-tight">
                                {challenge.title}
                            </h4>
                            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                                {challenge.description}
                            </p>
                        </div>
                    </div>

                    {challenge.isCompleted ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-2 py-0.5">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> DONE
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-white/10">
                            {challenge.points} PTS
                        </Badge>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                            Progress: {percentage}%
                        </span>
                        <span className="text-[11px] font-bold text-white">
                            {challenge.progress} / {challenge.targetValue}
                        </span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn(
                                "h-full rounded-full bg-gradient-to-r",
                                challenge.isCompleted ? "from-emerald-500 to-teal-400" : "from-primary to-blue-400"
                            )}
                        />
                    </div>
                </div>

                {!challenge.isCompleted && (
                    <div className="mt-4 flex items-center justify-between opacity-50">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                            <Activity className="h-3 w-3" />
                            Ends: {new Date(challenge.endDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                            <Zap className="h-3 w-3 animate-pulse" /> Boost Score
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
