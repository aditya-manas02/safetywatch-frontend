import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lightbulb, BookOpen, AlertCircle, ChevronRight, Globe } from "lucide-react";
import { API_BASE, VERSION_HEADERS } from "@/lib/api";

interface SafetyContent {
    _id: string;
    title: string;
    body: string;
    category: string;
    author: string;
    icon: string;
    originalCategory?: string;
}

export default function SafetyContentPanel() {
    const [contents, setContents] = useState<SafetyContent[]>([]);
    const originalContents = useRef<SafetyContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentLang, setCurrentLang] = useState(localStorage.getItem("app_lang") || "en");
    const DEFAULT_T = {
        safetyDirectives: "SAFETY DIRECTIVES",
        aiTranslated: "AI TRANSLATED",
        noDirectives: "No safety directives available at this time."
    };
    const [t, setT] = useState(DEFAULT_T);

    useEffect(() => {
        loadContent();
    }, []);

    useEffect(() => {
        setT(DEFAULT_T);
        setContents(originalContents.current);
    }, [currentLang]);
    async function loadContent() {
        try {
            const res = await fetch(`${API_BASE}/safety-content`, {
                headers: VERSION_HEADERS
            });
            if (res.ok) {
                const data = await res.json();
                const fresh = data.content.map((c: any) => ({ ...c, originalCategory: c.category }));
                originalContents.current = fresh;

                originalContents.current = fresh;
                setContents(fresh);
            }
        } catch (err) {
            console.error("Failed to load safety content:", err);
        } finally {
            setLoading(false);
        }
    }

    async function translateAll(items: SafetyContent[], targetLang: string) {
        setContents(originalContents.current);
    }

    const getIcon = (category: string) => {
        // Use original category for icon matching if available
        const search = category.toLowerCase();
        if (search.includes("tip")) return <Lightbulb className="h-5 w-5 text-amber-500" />;
        if (search.includes("guide")) return <BookOpen className="h-5 w-5 text-blue-500" />;
        if (search.includes("announce")) return <AlertCircle className="h-5 w-5 text-rose-500" />;
        return <Shield className="h-5 w-5 text-primary" />;
    };

    if (loading && contents.length === 0) {
        return (
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-2xl border border-white/5" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="font-black text-xs tracking-[0.3em] uppercase opacity-60">{t.safetyDirectives}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {contents.map((item, idx) => (
                        <motion.div
                            key={item._id || idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-card/60 transition-all duration-300"
                        >
                            <div className="flex gap-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5 group-hover:scale-110 transition-transform duration-300">
                                    {getIcon(item.originalCategory || item.category)}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.category}</span>
                                        <span className="text-[10px] text-muted-foreground/50 tracking-tighter uppercase font-mono">{item.author}</span>
                                    </div>
                                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-500">
                                        {item.body}
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {contents.length === 0 && !loading && (
                    <div className="p-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <p className="text-sm text-muted-foreground italic">{t.noDirectives}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
