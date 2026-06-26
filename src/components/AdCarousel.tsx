import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdCarousel() {
    const { user } = useAuth();
    const [ads, setAds] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAds = async () => {
            try {
                const areaCode = user?.areaCode || "";
                const res = await fetch(`${API_BASE}/ads/active?areaCode=${areaCode}`);
                if (res.ok) {
                    const data = await res.json();
                    setAds(data);
                }
            } catch (err) {
                console.error("Ads fetch failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, [user?.areaCode]);

    useEffect(() => {
        if (ads.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % ads.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [ads]);

    const handleAdClick = async (ad: any) => {
        try {
            await fetch(`${API_BASE}/ads/${ad._id}/click`, { method: "POST" });
            window.open(ad.link, "_blank");
        } catch (err) {
            console.error("Counter failed");
        }
    };

    if (loading || ads.length === 0) return null;

    return (
        <div className="relative w-full aspect-[4/1] md:aspect-[5/1] overflow-hidden rounded-3xl group mb-8 shadow-2xl">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.7, ease: "circOut" }}
                    className="absolute inset-0 cursor-pointer"
                    onClick={() => handleAdClick(ads[currentIndex])}
                >
                    <img
                        src={ads[currentIndex].imageUrl}
                        alt={ads[currentIndex].title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent flex items-center p-8 md:p-12">
                        <div className="max-w-md space-y-2">
                            <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-md border border-primary/30 px-3 py-1 rounded-full text-[10px] font-black tracking-tighter text-primary uppercase">
                                Promoted
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tighter leading-none uppercase">
                                {ads[currentIndex].title}
                            </h2>
                            <Button size="sm" className="h-8 rounded-full mt-4 bg-foreground text-background hover:bg-foreground/90">
                                LEARN MORE <ExternalLink className="h-3 w-3 ml-2" />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {ads.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-foreground/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity text-foreground hover:bg-foreground/40"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % ads.length); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-foreground/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity text-foreground hover:bg-foreground/40"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {ads.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1 transition-all duration-300 rounded-full",
                                    i === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-foreground/30"
                                )}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
