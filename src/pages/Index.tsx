import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WatchCard } from "@/components/WatchCard";
import { StatsCard } from "@/components/StatsCard";
import { TripTimeline } from "@/components/TripTimeline";
import { UsageChart } from "@/components/UsageChart";
import { AddWatchDialog } from "@/components/AddWatchDialog";
import { AddTripDialog } from "@/components/AddTripDialog";
import { AddEventDialog } from "@/components/AddEventDialog";
import { AddWaterUsageDialog } from "@/components/AddWaterUsageDialog";
import { WaterUsageList } from "@/components/WaterUsageList";
import { AddWishlistDialog } from "@/components/AddWishlistDialog";
import { WishlistTable } from "@/components/WishlistTable";
import { TastePreferences } from "@/components/TastePreferences";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Watch, TrendingUp, Calendar, Search, Lock, Unlock } from "lucide-react";
import { Trip, Event } from "@/types/watch";
import { Button } from "@/components/ui/button";
import { usePasscode } from "@/contexts/PasscodeContext";
import { useToast } from "@/hooks/use-toast";
import { BetaBadge } from "@/components/BetaBadge";

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

interface WaterUsage {
  id: string;
  watch_id: string;
  activity_date: string;
  activity_type: string;
  duration_minutes?: number;
  depth_meters?: number;
  notes?: string;
}

interface WishlistItem {
  id: string;
  brand: string;
  model: string;
  dial_colors: string;
  rank: number;
  notes?: string;
  is_ai_suggested: boolean;
}

const Index = () => {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [wearEntries, setWearEntries] = useState<WearEntry[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [waterUsages, setWaterUsages] = useState<WaterUsage[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddWaterUsage, setShowAddWaterUsage] = useState(false);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showAddWishlist, setShowAddWishlist] = useState(false);
  const { isVerified, requestVerification } = usePasscode();
  const { toast } = useToast();

  const fetchData = async () => {
    const [watchesResult, wearResult, tripsResult, eventsResult, waterResult, wishlistResult] = await Promise.all([
      supabase.from("watches").select("*"),
      supabase.from("wear_entries").select("watch_id, wear_date, days, updated_at"),
      supabase.from("trips").select("*").order("start_date"),
      supabase.from("events").select("*").order("start_date"),
      supabase.from("water_usage").select("*").order("activity_date", { ascending: false }),
      supabase.from("wishlist").select("*").order("rank", { ascending: true }),
    ]);

    if (watchesResult.data) setWatches(watchesResult.data);
    if (wearResult.data) setWearEntries(wearResult.data.map(w => ({ ...w, days: Number(w.days) })));
    if (tripsResult.data) {
      setTrips(
        tripsResult.data.map((trip) => ({
          id: trip.id,
          startDate: new Date(trip.start_date).toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "2-digit"
          }),
          location: trip.location,
          watch: (trip.watch_model as Record<string, number>) || {},
          days: Number(trip.days),
          purpose: trip.purpose,
        }))
      );
    }
    if (eventsResult.data) {
      setEvents(
        eventsResult.data.map((event) => ({
          id: event.id,
          startDate: new Date(event.start_date).toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "2-digit"
          }),
          location: event.location,
          watch: (event.watch_model as Record<string, number>) || {},
          days: Number(event.days),
          purpose: event.purpose,
        }))
      );
    }
    if (waterResult.data) {
      setWaterUsages(waterResult.data);
    }
    if (wishlistResult.data) {
      setWishlist(wishlistResult.data);
    }
    setLoading(false);
  };

  const handleGenerateSuggestions = async (tasteDescription: string) => {
    setGeneratingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-watches", {
        body: { 
          collection: watches.map(w => ({
            brand: w.brand,
            model: w.model,
            dial_color: w.dial_color,
            type: w.type,
          })),
          tasteDescription 
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        // Clear old AI suggestions
        const { error: deleteError } = await supabase
          .from("wishlist")
          .delete()
          .eq("is_ai_suggested", true);

        if (deleteError) throw deleteError;

        // Insert new AI suggestions
        const { error: insertError } = await supabase
          .from("wishlist")
          .insert(
            data.suggestions.map((s: any) => ({
              brand: s.brand,
              model: s.model,
              dial_colors: s.dial_colors,
              rank: s.rank,
              notes: s.notes,
              is_ai_suggested: true,
            }))
          );

        if (insertError) throw insertError;

        await fetchData();
        
        toast({
          title: "AI Suggestions Generated!",
          description: `${data.suggestions.length} watches suggested based on your collection and taste`,
        });
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to generate watch suggestions",
        variant: "destructive",
      });
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get unique brands for filter
  const uniqueBrands = Array.from(new Set(watches.map(w => w.brand))).sort();

  const filteredWatches = watches.filter(
    (watch) => {
      const matchesSearch = watch.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        watch.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        watch.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBrand = selectedBrand === "all" || watch.brand === selectedBrand;
      return matchesSearch && matchesBrand;
    }
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

  // Calculate #1 trip watch (most worn across all trips)
  const tripWatchTotals = new Map<string, number>();
  trips.forEach(trip => {
    Object.entries(trip.watch || {}).forEach(([watchName, days]) => {
      tripWatchTotals.set(watchName, (tripWatchTotals.get(watchName) || 0) + days);
    });
  });
  const topTripWatch = Array.from(tripWatchTotals.entries())
    .sort((a, b) => b[1] - a[1])[0];

  // Calculate #1 water usage watch (most used in water activities)
  const waterWatchCounts = new Map<string, number>();
  waterUsages.forEach(usage => {
    waterWatchCounts.set(usage.watch_id, (waterWatchCounts.get(usage.watch_id) || 0) + 1);
  });
  const topWaterWatchId = Array.from(waterWatchCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const topWaterWatch = watches.find(w => w.id === topWaterWatchId);


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
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-foreground">Watch Collection</h1>
                  <BetaBadge />
                </div>
                <p className="text-sm text-muted-foreground">Track and manage your timepieces</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={isVerified ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (!isVerified) {
                    requestVerification(() => {});
                  }
                }}
                className="gap-2"
              >
                {isVerified ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    Unlocked
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Unlock All
                  </>
                )}
              </Button>
              <AddWatchDialog onSuccess={fetchData} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
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
        </div>

        {/* Usage Chart */}
        {watches.length > 0 && (
          <div className="mb-8">
            <UsageChart watches={watches} wearEntries={wearEntries} onDataChange={fetchData} />
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="collection" className="space-y-6">
          <TabsList className="bg-card border border-border grid grid-cols-5 w-full max-w-2xl mx-auto">
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="water">Water Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="space-y-6">
            {watches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No watches in your collection yet.</p>
                <p className="text-sm text-muted-foreground">Click "Add Watch" to get started!</p>
              </div>
            ) : (
              <>
                {/* Search and Filter */}
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search by brand, model, or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-card border-border"
                    />
                  </div>
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger className="w-[200px] bg-card border-border">
                      <SelectValue placeholder="Filter by brand" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border z-50">
                      <SelectItem value="all">All Brands</SelectItem>
                      {uniqueBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

          <TabsContent value="wishlist" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Your Wishlist</h2>
              <Button onClick={() => setShowAddWishlist(true)}>Add to Wishlist</Button>
            </div>
            
            <TastePreferences 
              onSuggest={handleGenerateSuggestions}
              isGenerating={generatingSuggestions}
            />

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">Your Wishlist</h3>
                <WishlistTable 
                  items={wishlist} 
                  onDelete={fetchData}
                  showAISuggested={false}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">AI Suggestions</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from("wishlist")
                          .delete()
                          .eq("is_ai_suggested", true);

                        if (error) throw error;

                        toast({
                          title: "Cleared",
                          description: "AI suggestions have been cleared",
                        });

                        await fetchData();
                      } catch (error) {
                        console.error("Error clearing AI suggestions:", error);
                        toast({
                          title: "Error",
                          description: "Failed to clear AI suggestions",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Clear AI Suggestions
                  </Button>
                </div>
                <WishlistTable 
                  items={wishlist} 
                  onDelete={fetchData}
                  showAISuggested={true}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trips" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Travel History</h2>
              <Button onClick={() => setShowAddTrip(true)}>Add Trip</Button>
            </div>
            {topTripWatch && (
              <div className="bg-card border border-border rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">#1 Trip Watch</p>
                    <h3 className="text-lg font-semibold text-foreground">{topTripWatch[0]}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{topTripWatch[1]}</p>
                    <p className="text-xs text-muted-foreground">days worn</p>
                  </div>
                </div>
              </div>
            )}
            <TripTimeline trips={trips} type="trip" watches={watches} onUpdate={fetchData} />
            <AddTripDialog 
              watches={watches} 
              onSuccess={fetchData}
              open={showAddTrip}
              onOpenChange={setShowAddTrip}
            />
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Special Events</h2>
              <Button onClick={() => setShowAddEvent(true)}>Add Event</Button>
            </div>
            <TripTimeline trips={events} type="event" watches={watches} onUpdate={fetchData} />
            <AddEventDialog 
              watches={watches} 
              onSuccess={fetchData}
              open={showAddEvent}
              onOpenChange={setShowAddEvent}
            />
          </TabsContent>

          <TabsContent value="water" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Water Usage Tracking</h2>
              <Button onClick={() => setShowAddWaterUsage(true)}>Add Water Usage</Button>
            </div>
            {topWaterWatch && (
              <div className="bg-card border border-border rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">#1 Water Usage Watch</p>
                    <h3 className="text-lg font-semibold text-foreground">{topWaterWatch.brand} {topWaterWatch.model}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{waterWatchCounts.get(topWaterWatch.id)}</p>
                    <p className="text-xs text-muted-foreground">activities</p>
                  </div>
                </div>
              </div>
            )}
            <WaterUsageList usages={waterUsages} watches={watches} onUpdate={fetchData} />
            <AddWaterUsageDialog 
              watches={watches} 
              onSuccess={fetchData}
              open={showAddWaterUsage}
              onOpenChange={setShowAddWaterUsage}
            />
          </TabsContent>
        </Tabs>
        <AddWishlistDialog 
          open={showAddWishlist}
          onOpenChange={setShowAddWishlist}
          onSuccess={fetchData}
        />
      </main>
    </div>
  );
};

export default Index;
