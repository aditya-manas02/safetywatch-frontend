import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, getAuthHeaders, VERSION_HEADERS } from "@/lib/api";
import IncidentCarousel from "@/components/IncidentCarousel";
import IncidentCard, { Incident } from "@/components/IncidentCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Activity, PlusCircle, Calendar, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mapIncident = (inc: any): Incident => ({
  id: inc._id,
  type: inc.type,
  title: inc.title,
  description: inc.description,
  location: inc.location || "Unknown Location",
  latitude: inc.locationCoordinates?.coordinates?.[1] || 0,
  longitude: inc.locationCoordinates?.coordinates?.[0] || 0,
  timestamp: new Date(inc.createdAt).toLocaleString(),
  status: inc.status || "active",
  imageUrl: inc.imageUrl || "",
  upvotes: inc.upvotes || 0,
  userUpvoted: inc.userUpvoted || false,
  reporter: inc.reporter ? { name: inc.reporter.name } : undefined,
  adminComments: inc.adminComments || [],
  updates: inc.updates || [],
});

export default function FeedPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.hash === "#tracking" ? "tracking" : "popular");
  
  const [popularIncidents, setPopularIncidents] = useState<Incident[]>([]);
  const [nearbyIncidents, setNearbyIncidents] = useState<Incident[]>([]);
  const [myReports, setMyReports] = useState<Incident[]>([]);
  
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [loadingMyReports, setLoadingMyReports] = useState(false);
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchPopular = useCallback(async () => {
    setLoadingPopular(true);
    try {
      const resp = await fetch(`${API_BASE}/stats/bundle`, {
        headers: VERSION_HEADERS
      });
      if (resp.ok) {
        const data = await resp.json();
        const filteredPopular = (Array.isArray(data.popular) ? data.popular : []).filter(
          (i: any) => (i.status === 'approved' || i.isImportant) && i.status !== 'problem solved'
        );
        setPopularIncidents(filteredPopular.map(mapIncident));
      }
    } catch (err) {
      console.error("Failed to fetch popular incidents", err);
    } finally {
      setLoadingPopular(false);
    }
  }, []);

  const fetchNearby = useCallback(async (lat: number, lng: number) => {
    setLoadingNearby(true);
    try {
      const resp = await fetch(`${API_BASE}/incidents/near-me?lat=${lat}&lng=${lng}&radius=10`, {
        headers: VERSION_HEADERS
      });
      if (resp.ok) {
        const data = await resp.json();
        const filtered = (Array.isArray(data) ? data : []).filter(
          (i: any) => (i.status === 'approved' || i.isImportant) && i.status !== 'problem solved'
        );
        setNearbyIncidents(filtered.map(mapIncident));
      }
    } catch (err) {
      console.error("Failed to fetch nearby incidents", err);
    } finally {
      setLoadingNearby(false);
    }
  }, []);

  const fetchMyReports = useCallback(async () => {
    if (!user) return;
    setLoadingMyReports(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const resp = await fetch(`${API_BASE}/incidents/my-reports`, {
        headers: getAuthHeaders(token)
      });
      if (resp.ok) {
        const data = await resp.json();
        setMyReports(data.map(mapIncident));
      }
    } catch (err) {
      console.error("Failed to fetch user reports", err);
    } finally {
      setLoadingMyReports(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPopular();
    fetchMyReports();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          fetchNearby(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn("Geolocation denied or failed", err);
        }
      );
    }
    
    const handleReportSubmitted = () => {
      fetchMyReports();
      fetchPopular();
    };
    window.addEventListener("report_submitted", handleReportSubmitted);
    
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener("switch_tab", handleSwitchTab);

    return () => {
      window.removeEventListener("report_submitted", handleReportSubmitted);
      window.removeEventListener("switch_tab", handleSwitchTab);
    };
  }, [fetchPopular, fetchMyReports, fetchNearby]);

  useEffect(() => {
    if (location.hash === "#tracking") setActiveTab("tracking");
    else if (location.hash === "#nearby") setActiveTab("nearby");
    else if (location.hash === "#popular") setActiveTab("popular");
  }, [location.hash]);

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col pt-4">
      {/* Header */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
          <Activity className="h-3.5 w-3.5" />
          Live Network
        </div>
        <h1 className="text-3xl font-black">Incidents Feed</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time alerts and community reports</p>
      </div>

      {/* Segmented Control / Tabs */}
      <div className="flex-1 px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6 bg-muted/50 rounded-2xl h-14 p-1 shadow-inner">
            <TabsTrigger value="popular" className="rounded-xl font-bold text-xs sm:text-sm data-[state=active]:shadow-sm">Popular</TabsTrigger>
            <TabsTrigger value="nearby" className="rounded-xl font-bold text-xs sm:text-sm data-[state=active]:shadow-sm">Near Me</TabsTrigger>
            <TabsTrigger value="tracking" className="rounded-xl font-bold text-xs sm:text-sm data-[state=active]:shadow-sm">My Reports</TabsTrigger>
          </TabsList>

          {/* POPULAR TAB */}
          <TabsContent value="popular" className="space-y-4 outline-none animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 fill-orange-500 text-orange-500" />
              <h2 className="text-xl font-black">Featured Alerts</h2>
            </div>
            {loadingPopular ? (
              <div className="grid gap-4 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-card border rounded-2xl"></div>)}
              </div>
            ) : popularIncidents.length === 0 ? (
              <div className="text-center py-12 bg-muted/10 rounded-2xl border">
                <p className="text-muted-foreground text-sm">No popular incidents currently featured.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {popularIncidents.map(inc => (
                  <IncidentCard key={inc.id} incident={inc} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* NEAR ME TAB */}
          <TabsContent value="nearby" className="space-y-4 outline-none animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-black">10km Radius</h2>
            </div>
            {!userLocation ? (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 sm:p-10 text-center mt-4">
                <MapPin className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm font-medium mb-6">Location services are required to see nearby incidents.</p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Enable Location</Button>
              </div>
            ) : loadingNearby ? (
              <div className="grid gap-4 animate-pulse">
                {[1, 2].map(i => <div key={i} className="h-48 bg-card border rounded-2xl"></div>)}
              </div>
            ) : nearbyIncidents.length === 0 ? (
              <div className="text-center py-12 bg-muted/10 rounded-2xl border">
                <p className="text-muted-foreground text-sm">No incidents reported near you. Stay safe!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {nearbyIncidents.map(inc => (
                  <IncidentCard key={inc.id} incident={inc} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* MY REPORTS TAB — Full detailed view (relocated from Profile's Mission Logs) */}
          <TabsContent value="tracking" className="space-y-4 outline-none animate-in fade-in slide-in-from-bottom-2">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <Activity className="h-5 w-5 text-green-500" />
                 <h2 className="text-xl font-black">Tracking</h2>
               </div>
               {user && myReports.length > 0 && (
                 <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black px-3 py-1 uppercase tracking-tighter text-[10px] rounded-xl shadow-sm">
                   {myReports.length} Signals Captured
                 </Badge>
               )}
             </div>
            {!user ? (
               <div className="text-center py-12 bg-muted/20 border border-dashed rounded-xl">
                 <p className="text-muted-foreground text-sm font-medium mb-4">Sign in to track your reports</p>
               </div>
            ) : loadingMyReports ? (
               <div className="grid gap-4 animate-pulse">
                 {[1, 2].map(i => <div key={i} className="h-48 bg-card border rounded-2xl"></div>)}
               </div>
            ) : myReports.length === 0 ? (
               <div className="text-center py-12 bg-muted/20 border border-dashed rounded-xl flex flex-col items-center">
                 <p className="text-muted-foreground text-sm font-medium mb-4">You haven't reported any incidents yet.</p>
                 <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent("open-report-form"))}>
                   <PlusCircle className="mr-2 h-4 w-4" /> File First Report
                 </Button>
               </div>
            ) : (
               <div className="grid gap-6">
                 {myReports.map((report) => (
                   <Card key={report.id} className="overflow-hidden border-none glass-card-luxury group hover:shadow-2xl transition-all duration-500 rounded-3xl">
                     <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/20">
                       <div className="p-6 sm:p-8 md:w-3/4 space-y-4 sm:space-y-6">
                         <div className="flex items-start justify-between gap-4">
                           <div className="space-y-2">
                             <div className="flex items-center gap-3 flex-wrap">
                               <h3 className="font-black text-xl sm:text-2xl tracking-tighter text-foreground group-hover:text-primary transition-colors">{report.title}</h3>
                               {report.status === 'active' && (
                                 <Badge className="bg-orange-500 text-white text-[10px] font-black h-6 px-3 leading-none uppercase animate-pulse border-none shadow-lg shadow-orange-500/20 rounded-lg">priority</Badge>
                               )}
                             </div>
                             <div className="flex items-center gap-3">
                               <p className="text-xs text-muted-foreground/70 flex items-center gap-2 font-black uppercase tracking-widest">
                                 <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/40" />
                                 {report.timestamp}
                               </p>
                             </div>
                           </div>
                           <Badge className={`
                             ${report.status === 'problem solved' ? 'bg-purple-600/10 text-purple-600 border-purple-600/20' : ''}
                             ${report.status === 'approved' ? 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20' : ''}
                             ${report.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : ''}
                             ${report.status === 'under process' ? 'bg-blue-600/10 text-blue-600 border-blue-600/20' : ''}
                             ${report.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' : ''}
                             ${report.status === 'active' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : ''}
                             ${report.status === 'resolved' ? 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20' : ''}
                             ${report.status === 'investigating' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : ''}
                             text-[11px] font-black uppercase tracking-[0.15em] px-3 sm:px-4 py-1.5 border shadow-sm rounded-xl backdrop-blur-md shrink-0
                           `}>
                             {report.status}
                           </Badge>
                         </div>
                         {report.description && (
                           <p className="text-sm sm:text-base text-foreground/70 leading-relaxed italic border-l-4 border-primary/30 pl-4 sm:pl-6 py-1 font-medium bg-primary/5 rounded-r-2xl">{report.description}</p>
                         )}
                         <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-2">
                           <div className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/80">
                             <div className="p-1.5 bg-muted rounded-lg shadow-sm border border-border/40">
                               <MapPin className="h-3.5 w-3.5 text-primary" />
                             </div>
                             {report.location}
                           </div>
                           <div className="flex items-center gap-2.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/80">
                             <div className="p-1.5 bg-muted rounded-lg shadow-sm border border-border/40">
                               <Shield className="h-3.5 w-3.5 text-primary" />
                             </div>
                             {report.type}
                           </div>
                         </div>
                       </div>
                       {report.imageUrl && (
                         <div className="md:w-1/4 h-48 sm:h-56 md:h-auto overflow-hidden relative">
                           <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                           <img
                             src={report.imageUrl}
                             alt={report.title}
                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                           />
                         </div>
                       )}
                     </div>
                   </Card>
                 ))}
               </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
