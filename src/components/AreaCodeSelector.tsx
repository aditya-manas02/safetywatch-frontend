import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { API_BASE, VERSION_HEADERS } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface AreaCodeSelectorProps {
    userEmail: string;
    onAreaCodeAssigned: () => void;
}

interface AreaInfo {
    code: string;
    name: string;
    description?: string;
}

export function AreaCodeSelector({ userEmail, onAreaCodeAssigned }: AreaCodeSelectorProps) {
    const [inputCode, setInputCode] = useState("");
    const [verifiedArea, setVerifiedArea] = useState<AreaInfo | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async () => {
        if (!inputCode.trim()) {
            setError("Please enter an area code");
            return;
        }

        setVerifying(true);
        setError(null);
        setVerifiedArea(null);

        try {
            const response = await fetch(`${API_BASE}/auth/verify-area-code`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...VERSION_HEADERS,
                },
                body: JSON.stringify({ areaCode: inputCode.trim() }),
            });

            const data = await response.json();

            if (!response.ok || !data.valid) {
                throw new Error(data.message || "Invalid area code");
            }

            setVerifiedArea(data.areaCode);
        } catch (err: any) {
            console.error("Verification error:", err);
            setError(err.message || "Could not verify area code");
            toast({
                title: "Invalid Area Code",
                description: err.message || "Please check the code and try again.",
                variant: "destructive",
            });
        } finally {
            setVerifying(false);
        }
    };

    const handleJoin = async () => {
        if (!verifiedArea) return;

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/auth/assign-area-code`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    ...VERSION_HEADERS,
                },
                body: JSON.stringify({
                    email: userEmail,
                    areaCode: verifiedArea.code,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to assign area code");
            }

            // Update local storage with new user data
            if (data.user) {
                const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
                const updatedUser = { ...currentUser, ...data.user, hasAreaCode: true };
                localStorage.setItem("user", JSON.stringify(updatedUser));
            }

            toast({
                title: "Welcome to " + data.areaInfo.name,
                description: "You have successfully joined this area.",
            });

            onAreaCodeAssigned();
        } catch (error: any) {
            console.error("Error assigning area code:", error);
            toast({
                title: "Assignment Failed",
                description: error.message || "Failed to join area. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-1 bg-background border border-border/50 rounded-lg shadow-sm">
                            <img
                                src="/assets/splash.png"
                                alt="Nexus AI"
                                className="h-5 w-5 object-contain"
                            />
                        </div>
                        <DialogTitle>Enter Access Code</DialogTitle>
                    </div>
                    <DialogDescription>
                        SafetyWatch is access-restricted. Please enter your provided area code to verify your location eligibility.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="areaCode" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                Area Access Code
                            </Label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="areaCode"
                                        placeholder="e.g. NYC01"
                                        value={inputCode}
                                        onChange={(e) => {
                                            setInputCode(e.target.value.toUpperCase());
                                            setError(null);
                                            setVerifiedArea(null);
                                        }}
                                        className="font-mono text-lg tracking-widest uppercase input-premium h-12"
                                        disabled={verifying || submitting}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !verifiedArea) {
                                                handleVerify();
                                            }
                                        }}
                                    />
                                    {verifiedArea && (
                                        <div className="absolute right-3 top-3.5 text-green-500 animate-in fade-in zoom-in duration-300">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                                <Button
                                    onClick={handleVerify}
                                    disabled={!inputCode || verifying || submitting || !!verifiedArea}
                                    className="h-12 px-6 font-bold w-full sm:w-auto"
                                    variant="secondary"
                                >
                                    {verifying ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Verify"
                                    )}
                                </Button>
                            </div>
                            {error && (
                                <p className="text-xs font-bold text-destructive flex items-center gap-1.5 animate-in slide-in-from-top-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {error}
                                </p>
                            )}
                        </div>

                        {verifiedArea && (
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h4 className="font-black text-lg tracking-tight text-foreground">{verifiedArea.name}</h4>
                                        <p className="text-xs font-medium text-muted-foreground">{verifiedArea.description}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-background text-primary border-primary/30 font-mono">
                                        {verifiedArea.code}
                                    </Badge>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        onClick={handleJoin}
                                        disabled={submitting}
                                        className="w-full font-black uppercase tracking-widest text-xs h-10 shadow-lg shadow-primary/20"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Joining Network...
                                            </>
                                        ) : (
                                            "Confirm & Access System"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
