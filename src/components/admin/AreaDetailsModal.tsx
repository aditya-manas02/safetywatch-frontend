import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trash2, Power, ShieldAlert, UserPlus, Info } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
    isSuspended: boolean;
    areaCode: string;
}

interface Incident {
    _id: string;
    title: string;
    status: string;
    type: string;
    createdAt: string;
}

interface AreaDetails {
    areaCode: {
        _id: string;
        code: string;
        name: string;
    };
    users: User[];
    incidents: Incident[];
}

interface AreaDetailsModalProps {
    areaId: string | null;
    onClose: () => void;
    token: string | null;
}

export function AreaDetailsModal({ areaId, onClose, token }: AreaDetailsModalProps) {
    const [data, setData] = useState<AreaDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (areaId) {
            fetchAreaDetails();
        } else {
            setData(null);
        }
    }, [areaId]);

    const fetchAreaDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/area-codes/${areaId}/details`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to fetch area details");

            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error("Error fetching area details:", error);
            toast({
                title: "Error",
                description: "Failed to load area details",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async (userId: string) => {
        setActionLoading(userId);
        try {
            const response = await fetch(`${API_BASE}/users/${userId}/promote`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to promote user");

            toast({
                title: "Success",
                description: "User promoted to Admin",
            });
            fetchAreaDetails();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to promote user",
                variant: "destructive",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleSuspend = async (userId: string, currentStatus: boolean) => {
        const action = currentStatus ? "unsuspend" : "suspend";
        const confirmMsg = currentStatus
            ? "Are you sure you want to unsuspend this user?"
            : "Are you sure you want to suspend this user? They will not be able to log in.";

        if (!confirm(confirmMsg)) return;

        setActionLoading(userId);
        try {
            const response = await fetch(`${API_BASE}/users/${userId}/suspend`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    isSuspended: !currentStatus,
                    reason: !currentStatus ? "Suspended by Super Admin from Area Management" : ""
                }),
            });

            if (!response.ok) throw new Error(`Failed to ${action} user`);

            toast({
                title: "Success",
                description: `User ${action}ed successfully`,
            });
            fetchAreaDetails();
        } catch (error) {
            toast({
                title: "Error",
                description: `Failed to ${action} user`,
                variant: "destructive",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId: string, name: string) => {
        if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) {
            return;
        }

        setActionLoading(userId);
        try {
            const response = await fetch(`${API_BASE}/users/${userId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to delete user");

            toast({
                title: "Success",
                description: "User deleted successfully",
            });
            fetchAreaDetails();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete user",
                variant: "destructive",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteIncident = async (incidentId: string) => {
        if (!confirm("Are you sure you want to delete this incident report?")) {
            return;
        }

        setActionLoading(incidentId);
        try {
            const response = await fetch(`${API_BASE}/incidents/${incidentId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to delete incident");

            toast({
                title: "Success",
                description: "Incident deleted successfully",
            });
            fetchAreaDetails();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete incident",
                variant: "destructive",
            });
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <Dialog open={!!areaId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Area: {data?.areaCode.code} - {data?.areaCode.name}
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Manage users and incidents for this community area.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : data ? (
                    <Tabs defaultValue="users" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="users">
                                Users ({data.users.length})
                            </TabsTrigger>
                            <TabsTrigger value="incidents">
                                Incidents ({data.incidents.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="users" className="space-y-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Roles</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.users.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                    No users found in this area.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.users.map((user) => (
                                                <TableRow key={user._id}>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.roles.map((role) => (
                                                                <Badge key={role} variant={role === "superadmin" ? "destructive" : role === "admin" ? "default" : "secondary"}>
                                                                    {role}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.isSuspended ? (
                                                            <Badge variant="destructive">Suspended</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-green-500 border-green-500">Active</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-1">
                                                        {!user.roles.includes("admin") && !user.roles.includes("superadmin") && (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                title="Promote to Admin"
                                                                onClick={() => handlePromote(user._id)}
                                                                disabled={!!actionLoading}
                                                            >
                                                                <UserPlus className="h-4 w-4 text-green-500" />
                                                            </Button>
                                                        )}
                                                        {!user.roles.includes("superadmin") && (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title={user.isSuspended ? "Unsuspend" : "Suspend"}
                                                                    onClick={() => handleSuspend(user._id, user.isSuspended)}
                                                                    disabled={!!actionLoading}
                                                                >
                                                                    {user.isSuspended ? (
                                                                        <Power className="h-4 w-4 text-green-500" />
                                                                    ) : (
                                                                        <ShieldAlert className="h-4 w-4 text-orange-500" />
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    title="Delete User"
                                                                    onClick={() => handleDeleteUser(user._id, user.name)}
                                                                    disabled={!!actionLoading}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="incidents" className="space-y-4">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Incident</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.incidents.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                    No incidents reported in this area.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.incidents.map((incident) => (
                                                <TableRow key={incident._id}>
                                                    <TableCell className="font-medium">{incident.title}</TableCell>
                                                    <TableCell>{incident.type}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={incident.status === "approved" ? "default" : incident.status === "pending" ? "outline" : "secondary"}>
                                                            {incident.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {new Date(incident.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            title="Delete Incident"
                                                            onClick={() => handleDeleteIncident(incident._id)}
                                                            disabled={!!actionLoading}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">No data found for this area.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
