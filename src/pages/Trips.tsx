import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TripTimeline } from "@/components/TripTimeline";
import { QuickAddWearDialog } from "@/components/QuickAddWearDialog";
import { useTripData } from "@/hooks/useTripData";
import { useWatchData } from "@/hooks/useWatchData";
import { useStatsCalculations } from "@/hooks/useStatsCalculations";
import { useWaterUsageData } from "@/hooks/useWaterUsageData";

const Trips = () => {
  const { trips, loading: tripLoading, refetch } = useTripData();
  const { watches, wearEntries, loading: watchLoading } = useWatchData();
  const { waterUsages } = useWaterUsageData();

  const stats = useStatsCalculations(watches, wearEntries, trips, waterUsages);

  if (tripLoading || watchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-textMuted">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-textMain">
            Travel History
          </h1>
          <p className="text-sm text-textMuted mt-1">
            Track where your collection has traveled
          </p>
        </div>
        <QuickAddWearDialog 
          watches={watches} 
          onSuccess={refetch}
        />
      </div>

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
        onUpdate={refetch}
      />
    </div>
  );
};

export default Trips;
