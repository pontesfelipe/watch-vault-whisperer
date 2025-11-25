import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WaterUsageList } from "@/components/WaterUsageList";
import { QuickAddWearDialog } from "@/components/QuickAddWearDialog";
import { useWaterUsageData } from "@/hooks/useWaterUsageData";
import { useWatchData } from "@/hooks/useWatchData";
import { useTripData } from "@/hooks/useTripData";
import { useStatsCalculations } from "@/hooks/useStatsCalculations";

const WaterUsage = () => {
  const { waterUsages, loading: waterLoading, refetch } = useWaterUsageData();
  const { watches, wearEntries, loading: watchLoading } = useWatchData();
  const { trips } = useTripData();

  const stats = useStatsCalculations(watches, wearEntries, trips, waterUsages);

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
