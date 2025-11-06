import { useState } from "react";
import { watches, trips, events } from "@/data/watchData";
import { WatchCard } from "@/components/WatchCard";
import { StatsCard } from "@/components/StatsCard";
import { TripTimeline } from "@/components/TripTimeline";
import { UsageChart } from "@/components/UsageChart";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Watch, TrendingUp, Calendar, Search } from "lucide-react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWatches = watches.filter(
    (watch) =>
      watch.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      watch.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      watch.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalWatches = watches.length;
  const totalDaysWorn = watches.reduce((sum, watch) => sum + watch.total, 0);
  const mostWornWatch = watches.reduce((prev, current) =>
    prev.total > current.total ? prev : current
  );
  const avgDaysPerWatch = (totalDaysWorn / totalWatches).toFixed(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Watch className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Watch Collection</h1>
              <p className="text-sm text-muted-foreground">Track and manage your timepieces</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Watches"
            value={totalWatches}
            icon={Watch}
            subtitle="in collection"
          />
          <StatsCard
            title="Days Worn"
            value={totalDaysWorn}
            icon={Calendar}
            subtitle="total this year"
          />
          <StatsCard
            title="Most Worn"
            value={mostWornWatch.total}
            icon={TrendingUp}
            subtitle={mostWornWatch.brand}
          />
          <StatsCard
            title="Average"
            value={avgDaysPerWatch}
            icon={TrendingUp}
            subtitle="days per watch"
          />
        </div>

        {/* Usage Chart */}
        <div className="mb-8">
          <UsageChart watches={watches} />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="collection" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="space-y-6">
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
              {filteredWatches.map((watch, index) => (
                <WatchCard key={index} watch={watch} />
              ))}
            </div>

            {filteredWatches.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No watches found matching your search.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trips" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Travel History</h2>
              <TripTimeline trips={trips} />
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Special Events</h2>
              <TripTimeline trips={events} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
