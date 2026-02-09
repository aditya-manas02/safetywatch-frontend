import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, MapPin, Loader2 } from "lucide-react";
import { API_BASE, VERSION_HEADERS } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface AreaCode {
    _id: string;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
}

interface AreaCodeSelectorProps {
    userEmail: string;
    onAreaCodeAssigned: () => void;
}

export function AreaCodeSelector({ userEmail, onAreaCodeAssigned }: AreaCodeSelectorProps) {
    const [areaCodes, setAreaCodes] = useState<AreaCode[]>([]);
    const [selectedAreaCode, setSelectedAreaCode] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAreaCodes();
    }, []);

    const fetchAreaCodes = async () => {
        try {
            const response = await fetch(`${API_BASE}/area-codes`, {
                headers: VERSION_HEADERS,
            });

            if (!response.ok) throw new Error("Failed to fetch area codes");

            const data = await response.json();
            setAreaCodes(data.filter((ac: AreaCode) => ac.isActive));
        } catch (error) {
            console.error("Error fetching area codes:", error);
            toast({
                title: "Error",
                description: "Failed to load area codes. Please refresh the page.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedAreaCode) {
            toast({
                title: "Area Code Required",
                description: "Please select your area code to continue.",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/auth/assign-area-code`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...VERSION_HEADERS,
                },
                body: JSON.stringify({
                    email: userEmail,
                    areaCode: selectedAreaCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to assign area code");
            }

            toast({
                title: "Area Code Assigned",
                description: `You have been assigned to ${data.areaInfo.name}`,
            });

            onAreaCodeAssigned();
        } catch (error: any) {
            console.error("Error assigning area code:", error);
            toast({
                title: "Assignment Failed",
                description: error.message || "Failed to assign area code. Please try again.",
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
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-6 w-6 text-primary" />
                        <DialogTitle>Select Your Area Code</DialogTitle>
                    </div>
                    <DialogDescription>
                        To access SafetyWatch, please select your area code. This helps us provide you with relevant local safety information.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="areaCode" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Area Code
                                </Label>
                                <Select value={selectedAreaCode} onValueChange={setSelectedAreaCode}>
                                    <SelectTrigger id="areaCode">
                                        <SelectValue placeholder="Select your area code" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {areaCodes.map((areaCode) => (
                                            <SelectItem key={areaCode._id} value={areaCode.code}>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{areaCode.code}</span>
                                                    <span className="text-sm text-muted-foreground">{areaCode.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={!selectedAreaCode || submitting}
                                className="w-full"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    "Continue"
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
