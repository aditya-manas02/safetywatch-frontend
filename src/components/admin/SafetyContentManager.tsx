import { useState, useEffect, useCallback } from "react";
import { Shield, Send, Loader2, Trash2, Plus, Lightbulb, BookOpen, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_BASE, getAuthHeaders, VERSION_HEADERS } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface SafetyContent {
  _id: string;
  title: string;
  body: string;
  category: string;
  author: string;
  icon: string;
}

export default function SafetyContentManager() {
  const { user, token } = useAuth();
  const [contents, setContents] = useState<SafetyContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Tip");
  const [author, setAuthor] = useState(user?.name || "Admin");

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/safety-content`, {
        headers: VERSION_HEADERS
      });
      if (!res.ok) throw new Error("Failed to fetch safety content");
      const data = await res.json();
      setContents(data.content || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load safety directives", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const handleGenerateIdea = async (e: React.MouseEvent) => {
    e.preventDefault();
    setGeneratingAI(true);
    try {
      const res = await fetch(`${API_BASE}/safety-content/generate`, {
        method: "POST",
        headers: getAuthHeaders(token || ""),
        body: JSON.stringify({ category })
      });

      if (!res.ok) throw new Error("Failed to generate AI idea");
      const data = await res.json();
      
      setTitle(data.title || "");
      setBody(data.body || "");
      toast({ title: "Idea generated!", description: "Review and publish." });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to generate idea", variant: "destructive" });
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body || !category || !author) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/safety-content`, {
        method: "POST",
        headers: getAuthHeaders(token || ""),
        body: JSON.stringify({
          title,
          body,
          category,
          author,
          icon: category.toLowerCase().includes("tip") ? "lightbulb" : category.toLowerCase().includes("guide") ? "book" : "alert",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || "Failed to create content");
      }
      
      toast({ title: "Safety Directive created successfully!" });
      setTitle("");
      setBody("");
      fetchContents();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error creating directive", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this directive?")) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/safety-content/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(token || ""),
      });

      if (!res.ok) throw new Error("Failed to delete");
      
      toast({ title: "Directive deleted" });
      fetchContents();
    } catch (err) {
      console.error(err);
      toast({ title: "Error deleting directive", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const getIcon = (cat: string) => {
    const search = cat.toLowerCase();
    if (search.includes("tip")) return <Lightbulb className="h-5 w-5 text-amber-500" />;
    if (search.includes("guide")) return <BookOpen className="h-5 w-5 text-blue-500" />;
    if (search.includes("announce")) return <AlertCircle className="h-5 w-5 text-rose-500" />;
    return <Shield className="h-5 w-5 text-primary" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Safety Directives</h2>
          <p className="text-muted-foreground text-sm">Manage community safety guidelines and alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Form */}
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl h-fit">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              New Directive
            </CardTitle>
            <CardDescription>Publish a new safety rule, tip, or announcement.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-background/50 border-white/10 h-12">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tip">💡 Safety Tip</SelectItem>
                    <SelectItem value="Guideline">📖 Official Guide</SelectItem>
                    <SelectItem value="Announcement">🚨 Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Title</label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs text-primary hover:text-primary hover:bg-primary/10 px-2 font-bold uppercase tracking-wider"
                    onClick={handleGenerateIdea}
                    disabled={generatingAI}
                  >
                    {generatingAI ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    Auto-Generate
                  </Button>
                </div>
                <Input 
                  placeholder="e.g. Neighborhood Patrol Guidelines" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background/50 border-white/10 h-12"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Body Content</label>
                <Textarea 
                  placeholder="Provide detailed instructions or information..." 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="bg-background/50 border-white/10 min-h-[120px] resize-none"
                  maxLength={1000}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Author</label>
                <Input 
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="bg-background/50 border-white/10 h-12"
                  maxLength={50}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 mt-4 text-sm font-bold uppercase tracking-wider" 
                disabled={creating}
              >
                {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Publish Directive</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List Directives */}
        <Card className="bg-card/40 backdrop-blur-xl border-white/5 shadow-2xl flex flex-col h-[calc(100vh-12rem)] min-h-[600px]">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Active Directives
            </CardTitle>
            <CardDescription>Currently published community guidelines.</CardDescription>
          </CardHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : contents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <p>No safety directives published yet.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {contents.map((item) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-background/50 border border-white/5 rounded-2xl p-5 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex gap-4">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5 shrink-0 h-fit">
                          {getIcon(item.category)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.category}</span>
                                <span className="text-[10px] text-muted-foreground/50 tracking-tighter uppercase font-mono">• {item.author}</span>
                              </div>
                              <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 shrink-0 -mr-2 -mt-2"
                              onClick={() => handleDelete(item._id)}
                              disabled={deletingId === item._id}
                            >
                              {deletingId === item._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {item.body}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
