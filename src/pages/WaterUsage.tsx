import { useState } from "react";
import { Plus, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WaterUsageList } from "@/components/WaterUsageList";
import { QuickAddWearDialog } from "@/components/QuickAddWearDialog";
import { useWaterUsageData } from "@/hooks/useWaterUsageData";
import { useWatchData } from "@/hooks/useWatchData";
import { useTripData } from "@/hooks/useTripData";
import { useStatsCalculations } from "@/hooks/useStatsCalculations";
import { useCollection } from "@/contexts/CollectionContext";
import { isWatchCollection, getCollectionConfig } from "@/types/collection";
import { useNavigate } from "react-router-dom";

const WaterUsage = () => {
  const { waterUsages, loading: waterLoading, refetch } = useWaterUsageData();
  const { watches, wearEntries, loading: watchLoading } = useWatchData();
  const { trips } = useTripData();
  const { currentCollection } = useCollection();
  const navigate = useNavigate();

  const stats = useStatsCalculations(watches, wearEntries, trips, waterUsages);
  
  const isWatches = currentCollection ? isWatchCollection(currentCollection.collection_type) : true;
  const collectionConfig = currentCollection ? getCollectionConfig(currentCollection.collection_type) : null;

  // Water usage only applies to watches
  if (!isWatches && collectionConfig) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Droplets className="h-16 w-16 text-textMuted mb-4" />
        <h2 className="text-2xl font-semibold text-textMain mb-2">
          Water Usage Not Available
        </h2>
        <p className="text-textMuted max-w-md mb-6">
          Water usage tracking is only available for watch collections. 
          {collectionConfig.pluralLabel} don't have water resistance ratings to track.
        </p>
        <Button onClick={() => navigate("/collection")} variant="outline">
          Back to Collection
        </Button>
      </div>
    );
  }

  if (waterLoading || watchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-textMuted">Loading water usage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-textMain">
            Water Usage
          </h1>
          <p className="text-sm text-textMuted mt-1">
            Track water resistance testing and usage
          </p>
        </div>
        <QuickAddWearDialog 
          watches={watches} 
          onSuccess={refetch}
        />
      </div>

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

      <WaterUsageList usages={waterUsages} watches={watches} onUpdate={refetch} />
    </div>
  );
};

export default WaterUsage;
