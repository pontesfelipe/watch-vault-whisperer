import { Droplets, Calendar, Dumbbell, Plane } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WaterUsageList } from "@/components/WaterUsageList";
import { TripTimeline } from "@/components/TripTimeline";
import { SportTimeline } from "@/components/SportTimeline";
import { QuickAddWearDialog } from "@/components/QuickAddWearDialog";
import { useWaterUsageData } from "@/hooks/useWaterUsageData";
import { useEventData } from "@/hooks/useEventData";
import { useSportData } from "@/hooks/useSportData";
import { useWatchData } from "@/hooks/useWatchData";
import { useTripData } from "@/hooks/useTripData";
import { useStatsCalculations } from "@/hooks/useStatsCalculations";
import { useCollection } from "@/contexts/CollectionContext";
import { isWatchCollection, getCollectionConfig } from "@/types/collection";
import { useSearchParams } from "react-router-dom";

const UsageDetails = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "trips";
  
  const { waterUsages, loading: waterLoading, refetch: refetchWater } = useWaterUsageData();
  const { events, loading: eventLoading, refetch: refetchEvents } = useEventData();
  const { sports, loading: sportLoading, refetch: refetchSports } = useSportData();
  const { watches, wearEntries, loading: watchLoading } = useWatchData();
  const { trips, loading: tripLoading, refetch: refetchTrips } = useTripData();
  const { currentCollection } = useCollection();

  const stats = useStatsCalculations(watches, wearEntries, trips, waterUsages);
  
  const isWatches = currentCollection ? isWatchCollection(currentCollection.collection_type) : true;
  const collectionConfig = currentCollection ? getCollectionConfig(currentCollection.collection_type) : null;

  // Sport stats
  const totalActivities = sports.length;
  const uniqueSportTypes = new Set(sports.map(s => s.sport_type)).size;
  const totalDuration = sports.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const sportCounts: Record<string, number> = {};
  sports.forEach(s => {
    sportCounts[s.sport_type] = (sportCounts[s.sport_type] || 0) + 1;
  });
  const topSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0];

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const isLoading = waterLoading || eventLoading || sportLoading || watchLoading || tripLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-textMuted">Loading usage details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-textMain">
            Usage Details
          </h1>
          <p className="text-sm text-textMuted mt-1">
            Track trips, events, sports, and water activities with your collection
          </p>
        </div>
        <QuickAddWearDialog 
          watches={watches} 
          onSuccess={() => {
            refetchWater();
            refetchEvents();
            refetchSports();
            refetchTrips();
          }}
        />
      </div>

      <Tabs value={initialTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className={`grid w-full ${isWatches ? 'grid-cols-4' : 'grid-cols-3'} lg:w-auto lg:inline-grid`}>
          <TabsTrigger value="trips" className="gap-2">
            <Plane className="h-4 w-4" />
            <span className="hidden sm:inline">Trips</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger value="sports" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Sports</span>
          </TabsTrigger>
          {isWatches && (
            <TabsTrigger value="water" className="gap-2">
              <Droplets className="h-4 w-4" />
              <span className="hidden sm:inline">Water</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Trips Tab */}
        <TabsContent value="trips" className="space-y-6 mt-6">
          {stats.topTripWatch && (
            <Card className="border-borderSubtle bg-surface p-6 shadow-card">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted mb-2">
                #1 Trip Watch
              </h3>
              <p className="text-2xl font-bold text-primary">
                {stats.topTripWatch.brand} {stats.topTripWatch.model}
              </p>
            </Card>
          )}
          <TripTimeline
            trips={trips.map((trip) => ({
              id: trip.id,
              startDate: trip.start_date,
              location: trip.location,
              linkedWatches: trip.linkedWatches,
              days: trip.days,
              purpose: trip.purpose,
              notes: trip.notes || undefined,
            }))}
            type="trip"
            watches={watches}
            onUpdate={refetchTrips}
          />
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6 mt-6">
          <TripTimeline
            trips={events.map((event) => ({
              id: event.id,
              startDate: event.start_date,
              location: event.location,
              linkedWatches: event.linkedWatches,
              days: event.days,
              purpose: event.purpose,
            }))}
            type="event"
            watches={watches}
            onUpdate={refetchEvents}
          />
        </TabsContent>

        {/* Sports Tab */}
        <TabsContent value="sports" className="space-y-6 mt-6">
          {sports.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-borderSubtle bg-surface p-6 shadow-card">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted mb-2">
                  Total Activities
                </h3>
                <p className="text-2xl font-bold text-primary">
                  {totalActivities}
                </p>
              </Card>
              <Card className="border-borderSubtle bg-surface p-6 shadow-card">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted mb-2">
                  Sport Types
                </h3>
                <p className="text-2xl font-bold text-primary">
                  {uniqueSportTypes}
                </p>
              </Card>
              <Card className="border-borderSubtle bg-surface p-6 shadow-card">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted mb-2">
                  Total Duration
                </h3>
                <p className="text-2xl font-bold text-primary">
                  {formatDuration(totalDuration)}
                </p>
              </Card>
              {topSport && (
                <Card className="border-borderSubtle bg-surface p-6 shadow-card">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted mb-2">
                    #1 Sport
                  </h3>
                  <p className="text-2xl font-bold text-primary">
                    {topSport[0]}
                  </p>
                  <p className="text-sm text-textMuted">{topSport[1]} activities</p>
                </Card>
              )}
            </div>
          )}

          <SportTimeline
            sports={sports}
            onUpdate={refetchSports}
          />
        </TabsContent>

        {/* Water Tab */}
        {isWatches && (
          <TabsContent value="water" className="space-y-6 mt-6">
            {stats.topWaterWatch && (
              <Card className="border-borderSubtle bg-surface p-6 shadow-card">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted mb-2">
                  #1 Water Usage Watch
                </h3>
                <p className="text-2xl font-bold text-primary">
                  {stats.topWaterWatch.brand} {stats.topWaterWatch.model}
                </p>
              </Card>
            )}

            <WaterUsageList usages={waterUsages} watches={watches} onUpdate={refetchWater} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default UsageDetails;
