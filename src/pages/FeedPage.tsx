import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE, getAuthHeaders, VERSION_HEADERS } from "@/lib/api";
import IncidentCarousel from "@/components/IncidentCarousel";
import IncidentCard, { Incident } from "@/components/IncidentCard";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Activity, PlusCircle } from "lucide-react";
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
      const resp = await fetch(`${API_BASE}/incidents?sort=upvotes&limit=10`, {
        headers: VERSION_HEADERS
      });
      if (resp.ok) {
        const data = await resp.json();
        setPopularIncidents(data.incidents.map(mapIncident));
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
      const resp = await fetch(`${API_BASE}/incidents/nearby?lat=${lat}&lng=${lng}&radius=10`, {
        headers: VERSION_HEADERS
      });
      if (resp.ok) {
        const data = await resp.json();
        setNearbyIncidents(data.map(mapIncident));
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
    return () => window.removeEventListener("report_submitted", handleReportSubmitted);
  }, [fetchPopular, fetchMyReports, fetchNearby]);

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
        <Tabs defaultValue="popular" className="w-full">
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

          {/* MY REPORTS TAB */}
          <TabsContent value="tracking" className="space-y-4 outline-none animate-in fade-in slide-in-from-bottom-2">
             <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-black">Tracking</h2>
            </div>
            {!user ? (
               <div className="text-center py-12 bg-muted/20 border border-dashed rounded-xl">
                 <p className="text-muted-foreground text-sm font-medium mb-4">Sign in to track your reports</p>
               </div>
            ) : loadingMyReports ? (
               <div className="grid gap-4 animate-pulse">
                 {[1, 2].map(i => <div key={i} className="h-32 bg-card border rounded-2xl"></div>)}
               </div>
            ) : myReports.length === 0 ? (
               <div className="text-center py-12 bg-muted/20 border border-dashed rounded-xl flex flex-col items-center">
                 <p className="text-muted-foreground text-sm font-medium mb-4">You haven't reported any incidents yet.</p>
                 <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent("open-report-form"))}>
                   <PlusCircle className="mr-2 h-4 w-4" /> File First Report
                 </Button>
               </div>
            ) : (
               <div className="grid gap-4">
                 {myReports.map((report) => (
                   <div key={report.id} className="bg-card border rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                     {/* Status indicator line */}
                     <div className={`absolute top-0 left-0 w-1 h-full ${
                       report.status === 'resolved' ? 'bg-green-500' :
                       report.status === 'investigating' ? 'bg-yellow-500' :
                       'bg-red-500'
                     }`}></div>
                     
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div>
                         <div className="flex items-center gap-2 mb-2">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                             report.status === 'resolved' ? 'bg-green-500/10 text-green-500' :
                             report.status === 'investigating' ? 'bg-yellow-500/10 text-yellow-500' :
                             'bg-red-500/10 text-red-500'
                           }`}>
                             {report.status}
                           </span>
                           <span className="text-xs text-muted-foreground flex items-center">
                             <MapPin className="h-3 w-3 mr-1" /> {report.location}
                           </span>
                         </div>
                         <h4 className="font-bold text-base sm:text-lg">{report.title}</h4>
                         <p className="text-xs text-muted-foreground mt-1">Reported on {report.timestamp}</p>
                       </div>
                       
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="w-full sm:w-auto"
                         onClick={() => {
                           window.dispatchEvent(new CustomEvent("open-incident", { detail: report.id }));
                         }}
                       >
                         View Details
                       </Button>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
