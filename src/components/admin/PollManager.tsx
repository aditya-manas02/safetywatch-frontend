import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Vote, Clock, MapPin, Loader2 } from "lucide-react";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function PollManager() {
    const { token, user } = useAuth();
    const [polls, setPolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const [formData, setFormData] = useState({
        question: "",
        options: ["", ""],
        areaCode: user?.areaCode || "",
        expiresAt: ""
    });

    const fetchPolls = async () => {
        try {
            const res = await fetch(`${API_BASE}/polls`, {
                headers: getAuthHeaders(token)
            });
            if (res.ok) setPolls(await res.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolls();
    }, [token]);

    const handleCreatePoll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.options.some(opt => !opt.trim())) {
            toast({ title: "Options cannot be empty", variant: "destructive" });
            return;
        }
        setCreating(true);
        try {
            const res = await fetch(`${API_BASE}/polls`, {
                method: "POST",
                headers: getAuthHeaders(token),
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast({ title: "Poll created successfully" });
                setFormData({ question: "", options: ["", ""], areaCode: user?.areaCode || "", expiresAt: "" });
                fetchPolls();
            }
        } catch (err) {
            toast({ title: "Failed to create poll", variant: "destructive" });
        } finally {
            setCreating(false);
        }
    };

    const addOption = () => {
        setFormData(prev => ({ ...prev, options: [...prev.options, ""] }));
    };

    const removeOption = (index: number) => {
        if (formData.options.length <= 2) return;
        const newOptions = [...formData.options];
        newOptions.splice(index, 1);
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    return (
        <div className="space-y-10">
            {/* Create Poll Card */}
            <Card className="border border-border/50 shadow-xl overflow-hidden bg-white/5 backdrop-blur-3xl rounded-[2rem]">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-black flex items-center gap-3">
                        <Plus className="h-6 w-6 text-primary" />
                        Create New Poll
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                    <form onSubmit={handleCreatePoll} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest opacity-60">Question</Label>
                            <Input
                                placeholder="What would you like to ask the community?"
                                value={formData.question}
                                onChange={e => setFormData(prev => ({ ...prev, question: e.target.value }))}
                                required
                                className="h-12 bg-background/50 border-border/50 font-bold"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-widest opacity-60">Options</Label>
                            {formData.options.map((opt, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        placeholder={`Option ${idx + 1}`}
                                        value={opt}
                                        onChange={e => handleOptionChange(idx, e.target.value)}
                                        required
                                        className="h-11 bg-background/50 border-border/50 font-medium"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeOption(idx)}
                                        className="shrink-0 hover:bg-rose-500/10 hover:text-rose-500"
                                        disabled={formData.options.length <= 2}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addOption}
                                className="w-full border-dashed border-border hover:border-primary/50 text-[10px] font-black uppercase tracking-widest"
                            >
                                <Plus className="h-3 w-3 mr-2" /> Add Option
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest opacity-60">Area Code</Label>
                                <Input
                                    value={formData.areaCode}
                                    onChange={e => setFormData(prev => ({ ...prev, areaCode: e.target.value.toUpperCase() }))}
                                    required
                                    placeholder="e.g. DEF-123"
                                    className="h-11 bg-background/50 border-border/50 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest opacity-60">Expiration (Optional)</Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.expiresAt}
                                    onChange={e => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                                    className="h-11 bg-background/50 border-border/50 font-bold"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={creating}
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-sm tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20"
                        >
                            {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : "DEPLOY COMMUNITY POLL"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Existing Polls List */}
            <div className="space-y-6">
                <h3 className="text-xl font-black px-2 flex items-center gap-2">
                    <Vote className="h-5 w-5 text-primary" />
                    Live Community Polls
                </h3>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    </div>
                ) : polls.length === 0 ? (
                    <div className="text-center py-20 bg-muted/10 rounded-[2rem] border border-dashed border-border/50">
                        <p className="text-muted-foreground font-bold">No active polls found for your administration.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {polls.map((poll: any) => (
                            <Card key={poll._id} className="border border-border/50 bg-white/5 backdrop-blur-3xl rounded-[2rem] overflow-hidden group">
                                <CardHeader className="p-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <CardTitle className="text-lg font-black leading-tight">
                                            {poll.question}
                                        </CardTitle>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                                                <MapPin className="h-3 w-3" /> {poll.areaCode}
                                            </div>
                                            {poll.isActive ? (
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                    Active
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-full">
                                                    Inactive
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 pt-0 space-y-4">
                                    <div className="space-y-2">
                                        {poll.options.map((opt: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-xs font-bold text-muted-foreground bg-black/20 p-3 rounded-xl border border-white/5">
                                                <span>{opt.text}</span>
                                                <span className="text-primary">{opt.votes.length} votes</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 pt-2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                                        <Clock className="h-3 w-3" /> Launched {new Date(poll.createdAt).toLocaleDateString()}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
