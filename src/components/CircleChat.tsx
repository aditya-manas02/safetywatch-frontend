import { useState, useEffect, useRef } from "react";
import { Send, Loader2, User, AlertTriangle, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  _id: string;
  circle: string;
  sender: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  content: string;
  messageType: "text" | "image" | "alert" | "system";
  metadata?: {
    incidentId?: string;
  };
  createdAt: string;
}

interface Props {
  circleId: string;
  token: string | null;
}

export default function CircleChat({ circleId, token }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/circles/${circleId}/messages`, {
        headers: getAuthHeaders(token)
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [circleId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/circles/${circleId}/messages`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ content: newMessage })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([...messages, data]);
        setNewMessage("");
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (err) {
      toast.error("Connection error");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 opacity-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-[10px] font-black tracking-widest uppercase">Opening Secure Channel...</p>
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-[500px] bg-white/5 border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Secure Group Chat</h3>
        </div>
        <div className="flex items-center gap-1.5 grayscale opacity-50">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-bold tracking-widest uppercase">Encrypted</span>
        </div>
      </div>

      {/* MESSAGES */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-8">
              <User className="h-12 w-12 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">No Transmissions</p>
              <p className="text-xs mt-2">Start the conversation with your circle.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender._id === user?.id;
              const isAlert = msg.messageType === "alert";

              if (isAlert) {
                return (
                  <motion.div 
                    key={msg._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center my-4"
                  >
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 px-6 flex items-center gap-3 max-w-[80%] shadow-lg shadow-amber-500/5">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-[11px] font-bold text-amber-200/80 leading-tight">
                        <span className="text-amber-500">{msg.sender.name}</span> {msg.content}
                      </p>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"} group`}
                >
                  <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    {!isMe && (
                      <Avatar className="h-6 w-6 rounded-lg opacity-50 group-hover:opacity-100 transition-opacity">
                        <AvatarImage src={msg.sender.profilePicture} />
                        <AvatarFallback className="text-[8px] font-bold">{msg.sender.name.substring(0, 1)}</AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className="flex flex-col">
                      {!isMe && <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 ml-1">{msg.sender.name}</span>}
                      <div className={`px-4 py-2.5 rounded-2xl text-xs font-medium backdrop-blur-md shadow-sm border ${
                        isMe 
                          ? "bg-primary text-primary-foreground border-primary/20 rounded-br-none" 
                          : "bg-white/10 text-foreground border-white/10 rounded-bl-none"
                      }`}>
                        {msg.content}
                        <div className={`text-[8px] mt-1 opacity-40 font-bold ${isMe ? "text-right" : "text-left"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* INPUT */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/5">
        <div className="flex gap-2 p-1.5 bg-black/20 rounded-2xl border border-white/5 focus-within:border-primary/30 transition-all">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Secure transmission..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-xs px-3 font-medium placeholder:text-muted-foreground/40"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || sending}
            className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </Card>
  );
}
