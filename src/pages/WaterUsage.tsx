import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WaterUsageList } from "@/components/WaterUsageList";
import { AddWaterUsageDialog } from "@/components/AddWaterUsageDialog";
import { useWaterUsageData } from "@/hooks/useWaterUsageData";
import { useWatchData } from "@/hooks/useWatchData";
import { useTripData } from "@/hooks/useTripData";
import { useStatsCalculations } from "@/hooks/useStatsCalculations";

const WaterUsage = () => {
  const { waterUsages, loading: waterLoading, refetch } = useWaterUsageData();
  const { watches, wearEntries, loading: watchLoading } = useWatchData();
  const { trips } = useTripData();
  const [showAddWaterUsage, setShowAddWaterUsage] = useState(false);

  const stats = useStatsCalculations(watches, wearEntries, trips, waterUsages);

  if (waterLoading || watchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading water usage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Water Usage
          </h1>
          <p className="text-muted-foreground">
            Track water resistance testing and usage
          </p>
        </div>
        <Button onClick={() => setShowAddWaterUsage(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Water Usage
        </Button>
      </div>

      {stats.topWaterWatch && (
        <Card className="border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            #1 Water Usage Watch
          </h3>
          <p className="text-2xl font-bold text-primary">
            {stats.topWaterWatch.brand} {stats.topWaterWatch.model}
          </p>
        </Card>
      )}

      <WaterUsageList usages={waterUsages} watches={watches} />

      <AddWaterUsageDialog 
        watches={watches} 
        onSuccess={refetch}
        open={showAddWaterUsage}
        onOpenChange={setShowAddWaterUsage}
      />
    </div>
  );
};

export default WaterUsage;
