import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TripTimeline } from "@/components/TripTimeline";
import { AddTripDialog } from "@/components/AddTripDialog";
import { useTripData } from "@/hooks/useTripData";
import { useWatchData } from "@/hooks/useWatchData";
import { useStatsCalculations } from "@/hooks/useStatsCalculations";
import { useWaterUsageData } from "@/hooks/useWaterUsageData";

const Trips = () => {
  const { trips, loading: tripLoading, refetch } = useTripData();
  const { watches, wearEntries, loading: watchLoading } = useWatchData();
  const { waterUsages } = useWaterUsageData();
  const [showAddTrip, setShowAddTrip] = useState(false);

  const stats = useStatsCalculations(watches, wearEntries, trips, waterUsages);

  if (tripLoading || watchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Travel History
          </h1>
          <p className="text-muted-foreground">
            Track where your watches have traveled
          </p>
        </div>
        <Button onClick={() => setShowAddTrip(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Trip
        </Button>
      </div>

      {stats.topTripWatch && (
        <Card className="border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
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
          watch: {},
          days: trip.days,
          purpose: trip.purpose,
        }))}
        type="trip"
        watches={watches}
        onUpdate={refetch}
      />

      <AddTripDialog watches={watches} onSuccess={refetch} />
    </div>
  );
};

export default Trips;
