import { motion, AnimatePresence } from "framer-motion";
import { Ban, Clock, ShieldAlert, LogOut } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface SuspensionModalProps {
    isOpen: boolean;
    expiresAt?: string | Date;
    onLogout: () => void;
}

export const SuspensionModal = ({ isOpen, expiresAt, onLogout }: SuspensionModalProps) => {
    if (!isOpen) return null;

    const expiryText = expiresAt
        ? format(new Date(expiresAt), "PPP 'at' p")
        : "Indefinite";

    const isExpired = expiresAt && new Date() > new Date(expiresAt);

    if (isExpired) return null; // Should not show if expired

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative bg-card border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />

                <div className="mx-auto h-20 w-20 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <Ban className="h-10 w-10 text-rose-500" />
                </div>

                <div>
                    <h2 className="text-2xl font-black tracking-tight text-foreground mb-2">Account Restricted</h2>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                        Your access to the SafetyWatch network has been suspended by an administrator due to a violation of community guidelines.
                    </p>
                </div>

                <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 text-left space-y-3">
                    <div className="flex items-center gap-3 text-rose-500">
                        <Clock className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Access Restored On</span>
                    </div>
                    <p className="text-foreground font-bold tracking-tight pl-7">{expiryText}</p>

                    <div className="flex items-start gap-3 text-muted-foreground pt-2 border-t border-border/20">
                        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-medium leading-tight">
                            During this interval, your ability to report incidents and interact with the community is disabled.
                        </p>
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        variant="outline"
                        onClick={onLogout}
                        className="w-full h-12 rounded-xl border-border/50 font-black text-xs uppercase tracking-widest hover:bg-muted transition-all"
                    >
                        <LogOut className="mr-2 h-4 w-4 text-rose-500" /> Exit System
                    </Button>
                </div>

                <p className="text-[10px] text-muted-foreground/60 font-semibold italic">
                    If you believe this is an error, please contact support.
                </p>
            </motion.div>
        </div>
    );
};
