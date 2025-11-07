import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WatchCard } from "@/components/WatchCard";
import { StatsCard } from "@/components/StatsCard";
import { TripTimeline } from "@/components/TripTimeline";
import { UsageChart } from "@/components/UsageChart";
import { AddWatchDialog } from "@/components/AddWatchDialog";
import { AddTripDialog } from "@/components/AddTripDialog";
import { AddEventDialog } from "@/components/AddEventDialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Watch, TrendingUp, Calendar, Search } from "lucide-react";
import { Trip, Event } from "@/types/watch";

interface Watch {
  id: string;
  brand: string;
  model: string;
  dial_color: string;
  type: string;
  cost: number;
}

interface WearEntry {
  watch_id: string;
  wear_date: string;
  days: number;
}

const Index = () => {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [wearEntries, setWearEntries] = useState<WearEntry[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [watchesResult, wearResult, tripsResult, eventsResult] = await Promise.all([
      supabase.from("watches").select("*"),
      supabase.from("wear_entries").select("watch_id, wear_date, days"),
      supabase.from("trips").select("*").order("start_date"),
      supabase.from("events").select("*").order("start_date"),
    ]);

    if (watchesResult.data) setWatches(watchesResult.data);
    if (wearResult.data) setWearEntries(wearResult.data);
    if (tripsResult.data) {
      setTrips(
        tripsResult.data.map((trip) => ({
          startDate: new Date(trip.start_date).toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "2-digit"
          }),
          location: trip.location,
          watch: trip.watch_model,
          days: Number(trip.days),
          purpose: trip.purpose,
        }))
      );
    }
    if (eventsResult.data) {
      setEvents(
        eventsResult.data.map((event) => ({
          startDate: new Date(event.start_date).toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "2-digit"
          }),
          location: event.location,
          watch: event.watch_model,
          days: Number(event.days),
          purpose: event.purpose,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredWatches = watches.filter(
    (watch) =>
      watch.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      watch.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      watch.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const watchTotals = new Map<string, number>();
  wearEntries.forEach(entry => {
    watchTotals.set(entry.watch_id, (watchTotals.get(entry.watch_id) || 0) + entry.days);
  });

  const totalWatches = watches.length;
  const totalDaysWorn = Array.from(watchTotals.values()).reduce((sum, days) => sum + days, 0);
  
  const mostWornWatchId = Array.from(watchTotals.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostWornWatch = watches.find(w => w.id === mostWornWatchId);
  const mostWornDays = mostWornWatchId ? watchTotals.get(mostWornWatchId) || 0 : 0;
  
  const avgDaysPerWatch = totalWatches > 0 ? (totalDaysWorn / totalWatches).toFixed(1) : "0";

  // Calculate most worn color
  const colorTotals = new Map<string, number>();
  wearEntries.forEach(entry => {
    const watch = watches.find(w => w.id === entry.watch_id);
    if (watch) {
      colorTotals.set(watch.dial_color, (colorTotals.get(watch.dial_color) || 0) + entry.days);
    }
  });
  const mostWornColor = Array.from(colorTotals.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Calculate most worn style
  const styleTotals = new Map<string, number>();
  wearEntries.forEach(entry => {
    const watch = watches.find(w => w.id === entry.watch_id);
    if (watch) {
      styleTotals.set(watch.type, (styleTotals.get(watch.type) || 0) + entry.days);
    }
  });
  const mostWornStyle = Array.from(styleTotals.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Calculate trending watch (last 3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const recentWearTotals = new Map<string, number>();
  wearEntries.forEach(entry => {
    const wearDate = new Date(entry.wear_date);
    if (wearDate >= threeMonthsAgo) {
      recentWearTotals.set(entry.watch_id, (recentWearTotals.get(entry.watch_id) || 0) + entry.days);
    }
  });
  
  const trendingWatchId = Array.from(recentWearTotals.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const trendingWatch = watches.find(w => w.id === trendingWatchId);
  const trendingDays = trendingWatchId ? recentWearTotals.get(trendingWatchId) || 0 : 0;

  // Calculate most used watch in trips
  const tripWatchCounts = new Map<string, number>();
  trips.forEach(trip => {
    if (trip.watch) {
      tripWatchCounts.set(trip.watch, (tripWatchCounts.get(trip.watch) || 0) + 1);
    }
  });
  const mostTripWatch = Array.from(tripWatchCounts.entries())
    .sort((a, b) => b[1] - a[1])[0];
  const tripWatchName = mostTripWatch?.[0] || "N/A";
  const tripWatchCount = mostTripWatch?.[1] || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading your collection...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Watch className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Watch Collection</h1>
                <p className="text-sm text-muted-foreground">Track and manage your timepieces</p>
              </div>
            </div>
            <AddWatchDialog onSuccess={fetchData} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
          <StatsCard
            title="Total Watches"
            value={totalWatches}
            icon={Watch}
            subtitle="in collection"
          />
          <StatsCard
            title="Days Worn"
            value={totalDaysWorn.toFixed(1)}
            icon={Calendar}
            subtitle="total tracked"
          />
          <StatsCard
            title="Most Worn"
            value={mostWornDays.toFixed(1)}
            icon={TrendingUp}
            subtitle={mostWornWatch ? mostWornWatch.brand : "N/A"}
          />
          <StatsCard
            title="Average"
            value={avgDaysPerWatch}
            icon={TrendingUp}
            subtitle="days per watch"
          />
          <StatsCard
            title="#1 Color"
            value={mostWornColor}
            icon={Watch}
            subtitle="most worn"
          />
          <StatsCard
            title="#1 Style"
            value={mostWornStyle}
            icon={Watch}
            subtitle="most worn"
          />
          <StatsCard
            title="Trending"
            value={trendingDays.toFixed(1)}
            icon={TrendingUp}
            subtitle={trendingWatch ? `${trendingWatch.model}` : "N/A"}
          />
          <StatsCard
            title="Trip Watch"
            value={tripWatchCount}
            icon={Calendar}
            subtitle={tripWatchName}
          />
        </div>

        {/* Usage Chart */}
        {watches.length > 0 && (
          <div className="mb-8">
            <UsageChart watches={watches} wearEntries={wearEntries} />
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="collection" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="space-y-6">
            {watches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No watches in your collection yet.</p>
                <p className="text-sm text-muted-foreground">Click "Add Watch" to get started!</p>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by brand, model, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card border-border"
                  />
                </div>

                {/* Watch Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWatches.map((watch) => (
                    <WatchCard
                      key={watch.id}
                      watch={watch}
                      totalDays={watchTotals.get(watch.id) || 0}
                      onDelete={fetchData}
                    />
                  ))}
                </div>

                {filteredWatches.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No watches found matching your search.</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="trips" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Travel History</h2>
              <AddTripDialog watches={watches} onSuccess={fetchData} />
            </div>
            <TripTimeline trips={trips} />
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Special Events</h2>
              <AddEventDialog watches={watches} onSuccess={fetchData} />
            </div>
            <TripTimeline trips={events} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
