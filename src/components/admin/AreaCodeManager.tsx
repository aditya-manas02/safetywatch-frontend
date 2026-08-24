import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Edit, Trash2, Power, Loader2, Users, AlertTriangle } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { AreaDetailsModal } from "./AreaDetailsModal";

interface AreaCode {
    _id: string;
    code: string;
    name: string;
    description?: string;
    areaType?: string;
    isActive: boolean;
    totalUsers: number;
    totalIncidents: number;
    createdAt: string;
}

export default function AreaCodeManager() {
    const { token, user, isSuperAdmin } = useAuth();
    const [areaCodes, setAreaCodes] = useState<AreaCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingAreaCode, setEditingAreaCode] = useState<AreaCode | null>(null);
    const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        areaType: "default",
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAreaCodes();
    }, []);

    const fetchAreaCodes = async () => {
        try {
            const response = await fetch(`${API_BASE}/area-codes`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to fetch area codes");

            const data = await response.json();
            setAreaCodes(data);
        } catch (error) {
            console.error("Error fetching area codes:", error);
            toast({
                title: "Error",
                description: "Failed to load area codes",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.code || !formData.name) {
            toast({
                title: "Validation Error",
                description: "Code and name are required",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            const isEditing = !!editingAreaCode;
            const url = isEditing 
                ? `${API_BASE}/area-codes/${editingAreaCode._id}/edit`
                : `${API_BASE}/area-codes/generate`;
            
            const method = isEditing ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} area code`);
            }

            toast({
                title: "Success",
                description: `Area code ${isEditing ? 'updated' : 'created'} successfully`,
            });

            setShowCreateDialog(false);
            setEditingAreaCode(null);
            setFormData({ code: "", name: "", description: "", areaType: "default" });
            fetchAreaCodes();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const openEditDialog = (areaCode: AreaCode) => {
        setEditingAreaCode(areaCode);
        setFormData({
            code: areaCode.code,
            name: areaCode.name,
            description: areaCode.description || "",
            areaType: areaCode.areaType || "default",
        });
        setShowCreateDialog(true);
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`${API_BASE}/area-codes/${id}/toggle-status`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to toggle status");

            toast({
                title: "Success",
                description: `Area code ${currentStatus ? 'deactivated' : 'activated'} successfully`,
            });

            fetchAreaCodes();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to toggle area code status",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`Are you sure you want to delete area code "${code}"? All users will be moved to DEFAULT.`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/area-codes/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to delete area code");

            toast({
                title: "Success",
                description: "Area code deleted and users migrated to DEFAULT",
            });

            fetchAreaCodes();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete area code",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Area Code Management</h2>
                    <p className="text-sm text-muted-foreground">Create and manage area codes for your community</p>
                </div>
                {isSuperAdmin && (
                    <Button onClick={() => {
                        setEditingAreaCode(null);
                        setFormData({ code: "", name: "", description: "", areaType: "default" });
                        setShowCreateDialog(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Area Code
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {areaCodes.map((areaCode) => (
                    <Card
                        key={areaCode._id}
                        className={`transition-all duration-200 cursor-pointer hover:border-primary/50 hover:shadow-md ${!areaCode.isActive ? "opacity-60" : ""}`}
                        onClick={() => setSelectedAreaId(areaCode._id)}
                    >
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        {areaCode.code}
                                    </CardTitle>
                                    <CardDescription>{areaCode.name}</CardDescription>
                                </div>
                                <Badge variant={areaCode.isActive ? "default" : "secondary"}>
                                    {areaCode.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {areaCode.description && (
                                <p className="text-sm text-muted-foreground">{areaCode.description}</p>
                            )}

                            <div className="flex gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{areaCode.totalUsers || 0} users</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                    <span>{areaCode.totalIncidents || 0} incidents</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={areaCode.isActive ? "outline" : "default"}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleStatus(areaCode._id, areaCode.isActive);
                                    }}
                                    className="flex-1"
                                >
                                    <Power className="h-3 w-3 mr-1" />
                                    {areaCode.isActive ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEditDialog(areaCode);
                                    }}
                                >
                                    <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(areaCode._id, areaCode.code);
                                    }}
                                    disabled={areaCode.code === "DEFAULT"}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAreaCode ? "Edit Area Code" : "Create New Area Code"}</DialogTitle>
                        <DialogDescription>
                            {editingAreaCode ? "Update the details for this area code" : "Add a new area code to organize your community"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="code">Area Code *</Label>
                            <Input
                                id="code"
                                placeholder="e.g., NYC-001"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                maxLength={12}
                                disabled={!!editingAreaCode} // Cannot edit code
                            />
                            <p className="text-xs text-muted-foreground mt-1">3-12 characters {editingAreaCode && "(Cannot be changed)"}</p>
                        </div>

                        <div>
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Manhattan District"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="areaType">Area Type *</Label>
                            <select
                                id="areaType"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                                value={formData.areaType}
                                onChange={(e) => setFormData({ ...formData, areaType: e.target.value })}
                            >
                                <option value="default">Default / Mixed</option>
                                <option value="university">University / College Campus</option>
                                <option value="society">Residential Society / Complex</option>
                                <option value="city">City / Municipality</option>
                                <option value="ward">Ward / District</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Brief description of this area"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                editingAreaCode ? "Save Changes" : "Create Area Code"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AreaDetailsModal
                areaId={selectedAreaId}
                token={token}
                onClose={() => {
                    setSelectedAreaId(null);
                    fetchAreaCodes(); // Refresh stats when closing
                }}
            />
        </div >
    );
}
