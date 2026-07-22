import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Minus, Maximize2, Sparkles, Zap, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { API_BASE, VERSION_HEADERS } from "@/lib/api";

interface Message {
    role: "user" | "bot";
    content: string;
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "bot", content: "👋 SafetyWatch Buddy initialized. I'm your intelligent safety companion, ready to assist with neighborhood insights, incident analysis, and security guidance. How can I help protect your community today?" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE}/chat`, {
                method: "POST",
                headers: {
                    ...VERSION_HEADERS,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.slice(1)
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "SafetyWatch Buddy server unreachable.");
            }
            const data = await res.json();
            setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
        } catch (err: any) {
            const errorMessage = err.message.includes("Failed to fetch")
                ? "Network anomaly detected. Retrying connection..."
                : `SafetyWatch Buddy Error: ${err.message || "Algorithms interrupted."}`;
            setMessages((prev) => [...prev, { role: "bot", content: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-24 md:bottom-4 right-4 z-[9999] flex flex-col items-end font-sans pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: "bottom right" }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            height: isMinimized ? "auto" : "500px", // Fixed height for Desktop Optimization
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        // DESKTOP UI FIX: Fixed width (380px) and nicer shadow/border
                        className="w-[90vw] sm:w-[380px] bg-background/95 backdrop-blur-xl border border-primary/30 rounded-3xl shadow-2xl shadow-primary/40 overflow-hidden flex flex-col mb-4 ring-1 ring-border/50 pointer-events-auto"
                    >
                        {/* SafetyWatch Buddy Header */}
                        <div
                            className="relative px-5 py-4 bg-gradient-to-r from-[#2e1065] via-[#1e1b4b] to-[#0f172a] border-b border-purple-500/20 flex items-center justify-between cursor-pointer group"
                            onClick={() => setIsMinimized(!isMinimized)}
                        >
                            {/* Animated digital noise */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

                            <div className="flex items-center gap-3 relative z-10">
                                <div className="relative">
                                    <img
                                        src="/assets/splash.png"
                                        alt="SafetyWatch Buddy Logo"
                                        className="h-9 w-9 relative z-10 object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                                    />
                                    {/* Online indicator dot */}
                                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-cyan-400 border-2 border-[#1e1b4b] rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                                </div>
                                <div>
                                    <h3 className="font-orbitron font-bold text-base tracking-wider text-white flex items-center gap-2">
                                        SAFETYWATCH <span className="text-purple-400 text-[10px] font-normal tracking-widest">BUDDY</span>
                                    </h3>
                                    <p className="text-[9px] text-purple-200/60 font-mono tracking-widest uppercase flex items-center gap-1">
                                        <Zap className="h-2 w-2 text-yellow-400" /> ONLINE
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 relative z-10">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-purple-200/50 hover:text-purple-300 hover:bg-purple-900/50 rounded-full transition-colors" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
                                    {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-critical/50 hover:text-critical hover:bg-critical/30 rounded-full transition-colors" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Chat Body */}
                        {!isMinimized && (
                            <>
                                <ScrollArea className="flex-1 p-4 bg-background relative">
                                    {/* Subtle grid background */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf610_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf610_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                                    <div className="space-y-6 relative z-10">
                                        {messages.map((m, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: m.role === "user" ? 20 : -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`flex items-start gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                            >
                                                {m.role === "bot" && (
                                                    <div className="h-7 w-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                                                        <BrainCircuit className="h-4 w-4 text-primary" />
                                                    </div>
                                                )}

                                                <div className={`max-w-[85%] px-4 py-3 text-sm font-medium leading-relaxed shadow-lg backdrop-blur-sm ${m.role === "user"
                                                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm shadow-primary/20"
                                                    : "bg-muted border border-border text-foreground rounded-2xl rounded-tl-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                                                    }`}>
                                                    {m.content}
                                                </div>
                                            </motion.div>
                                        ))}

                                        {isLoading && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex items-center gap-2.5"
                                            >
                                                <div className="h-7 w-7 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center justify-center shrink-0">
                                                    <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-spin-slow" />
                                                </div>
                                                <div className="flex gap-1 bg-card px-3 py-2.5 rounded-2xl border border-border">
                                                    <motion.span
                                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                                        transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                                                        className="h-1.5 w-1.5 bg-purple-500 rounded-full"
                                                    />
                                                    <motion.span
                                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                                                        className="h-1.5 w-1.5 bg-purple-500 rounded-full"
                                                    />
                                                    <motion.span
                                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                                                        className="h-1.5 w-1.5 bg-purple-500 rounded-full"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                        <div ref={scrollRef} />
                                    </div>
                                </ScrollArea>

                                {/* Input Area */}
                                <div className="p-3 bg-background border-t border-primary/20">
                                    <form onSubmit={handleSend} className="relative flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Ask SafetyWatch Buddy..."
                                            className="flex-1 bg-muted text-foreground placeholder:text-muted-foreground border border-border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary/70 focus:border-primary/70 transition-all outline-none"
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={!input.trim() || isLoading}
                                            className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </form>
                                    <div className="flex justify-center mt-2 opacity-40">
                                        <p className="text-[8px] uppercase tracking-widest font-semibold flex items-center gap-1">
                                            <span className="h-1 w-1 bg-purple-500 rounded-full"></span>
                                            Quantum Encryption
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Soft Floating Chat Button */}
            <motion.button
                drag
                dragConstraints={{ left: typeof window !== 'undefined' ? -window.innerWidth + 100 : -500, right: 0, top: typeof window !== 'undefined' ? -window.innerHeight + 200 : -500, bottom: 0 }}
                dragElastic={0.1}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto relative"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ opacity: 0, rotate: -90 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 90 }}
                            transition={{ duration: 0.2 }}
                            className="h-12 w-12 rounded-full bg-muted/80 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-lg"
                        >
                            <X className="h-5 w-5 text-muted-foreground" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow duration-300"
                        >
                            <MessageSquare className="h-5 w-5 text-white" />
                            {/* Soft pulse ring */}
                            <span className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
