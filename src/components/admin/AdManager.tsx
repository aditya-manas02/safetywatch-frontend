import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE, getAuthHeaders } from "@/lib/api";
import { toast } from "sonner";
import { ImagePlus, Trash2, ExternalLink, Globe, MapPin, Loader2, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdManager() {
    const { token, isSuperAdmin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [ads, setAds] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        link: "",
        imageUrl: "",
        areaCode: "GLOBAL",
        expiresAt: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [adsRes, areasRes] = await Promise.all([
                fetch(`${API_BASE}/ads`, { headers: getAuthHeaders(token) }),
                fetch(`${API_BASE}/area-codes`, { headers: getAuthHeaders(token) })
            ]);

            if (adsRes.ok) setAds(await adsRes.json());
            if (areasRes.ok) setAreas(await areasRes.json());
        } catch (err) {
            console.error("Failed to fetch data", err);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "safetywatch_unsigned");

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/dmod7m7v2/image/upload`, {
                method: "POST",
                body: data
            });
            const result = await res.json();
            setFormData({ ...formData, imageUrl: result.secure_url });
            setImagePreview(result.secure_url);
            toast.success("Image uploaded successfully");
        } catch (err) {
            toast.error("Image upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.imageUrl) return toast.error("Please upload an image");

        setLoading(true);
        try {
            const payload = {
                ...formData,
                areaCode: formData.areaCode === "GLOBAL" ? "" : formData.areaCode
            };

            const res = await fetch(`${API_BASE}/ads`, {
                method: "POST",
                headers: getAuthHeaders(token),
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create advertisement");

            toast.success("Advertisement Deployed!");
            setFormData({ title: "", link: "", imageUrl: "", areaCode: "GLOBAL", expiresAt: "" });
            setImagePreview(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteAd = async (id: string) => {
        if (!confirm("Are you sure you want to delete this ad?")) return;

        try {
            const res = await fetch(`${API_BASE}/ads/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(token)
            });
            if (res.ok) {
                toast.success("Ad removed");
                fetchData();
            }
        } catch (err) {
            toast.error("Failed to delete ad");
        }
    };

    if (!isSuperAdmin) return <div className="p-8 text-center text-muted-foreground">SuperAdmin access required for Ad Management.</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="bg-card/50 backdrop-blur-3xl border-white/10 overflow-hidden rounded-3xl">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-xl font-black flex items-center gap-3">
                        <Megaphone className="h-6 w-6 text-primary" />
                        DEPLOY NEW CAMPAIGN BANNER
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Form Fields */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Campaign Title</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Summer Safety Drive"
                                        className="bg-white/5 border-white/10 rounded-xl"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target URL</Label>
                                    <Input
                                        value={formData.link}
                                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                        placeholder="https://example.com"
                                        className="bg-white/5 border-white/10 rounded-xl"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Area</Label>
                                        <Select onValueChange={(v) => setFormData({ ...formData, areaCode: v })} value={formData.areaCode}>
                                            <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                                                <SelectValue placeholder="Select Area" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GLOBAL">Global (All Areas)</SelectItem>
                                                {areas.map(area => (
                                                    <SelectItem key={area.code} value={area.code}>
                                                        {area.name} ({area.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expiry Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.expiresAt}
                                            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                            className="bg-white/5 border-white/10 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Image Upload */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center block">Banner Image (1200x400 Recommended)</Label>
                                <div className="relative group aspect-[3/1] rounded-2xl overflow-hidden border-2 border-dashed border-white/10 hover:border-primary/50 transition-all bg-white/5 cursor-pointer">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button type="button" variant="outline" size="sm" onClick={() => setImagePreview(null)}>Change Image</Button>
                                            </div>
                                        </>
                                    ) : (
                                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                                            {uploading ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />}
                                            <span className="text-xs text-muted-foreground font-bold tracking-tighter">UPLOAD BANNER</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || uploading}
                            className="w-full h-14 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl"
                        >
                            {loading ? "INITIALIZING CAMPAIGN..." : "DEPLOY ADVERTISEMENT"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ads.map(ad => (
                    <Card key={ad._id} className="bg-card/50 backdrop-blur-3xl border-white/10 overflow-hidden rounded-2xl group">
                        <div className="aspect-[3/1] relative overflow-hidden">
                            <img src={ad.imageUrl} className="w-full h-full object-cover" alt={ad.title} />
                            <div className="absolute top-4 right-4 flex gap-2">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => deleteAd(ad._id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="font-black text-white text-sm tracking-tight uppercase">{ad.title}</h3>
                            </div>
                        </div>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                                    <Globe className="h-3 w-3" />
                                    {ad.areaCode || "GLOBAL"}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                                    <ExternalLink className="h-3 w-3" />
                                    LINKED
                                </div>
                            </div>
                            <div className="text-xs font-black text-primary">
                                {ad.clicks} CLICKS
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
