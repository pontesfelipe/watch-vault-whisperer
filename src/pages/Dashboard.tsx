import { Watch, Calendar, TrendingUp, Target, Palette, Shirt, Flame, Plane, Droplets, TrendingDown, DollarSign } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { UsageChart } from "@/components/UsageChart";
import { QuickAddWearDialog } from "@/components/QuickAddWearDialog";
import { DepreciationCard } from "@/components/DepreciationCard";
import { DepreciationChart } from "@/components/DepreciationChart";
import { CollectionInsights } from "@/components/CollectionInsights";
import { useWatchData } from "@/hooks/useWatchData";
import { useTripData } from "@/hooks/useTripData";
import { useWaterUsageData } from "@/hooks/useWaterUsageData";
import { useStatsCalculations } from "@/hooks/useStatsCalculations";
import { useCollection } from "@/contexts/CollectionContext";

const Dashboard = () => {
  const { selectedCollectionId } = useCollection();
  const { watches, wearEntries, loading: watchLoading, refetch } = useWatchData(selectedCollectionId);
  const { trips, loading: tripLoading } = useTripData();
  const { waterUsages, loading: waterLoading } = useWaterUsageData();

  const stats = useStatsCalculations(watches, wearEntries, trips, waterUsages);

  if (watchLoading || tripLoading || waterLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of your watch collection statistics
          </p>
        </div>
        <QuickAddWearDialog watches={watches} onSuccess={refetch} />
      </div>

      <CollectionInsights watchCount={stats.totalWatches} watches={watches} />

      {stats.watchesWithResaleDataCount > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Collection Value & Depreciation</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <DepreciationCard
                totalMSRP={stats.totalMSRP}
                pricePaid={stats.totalCollectionValue}
                marketValue={stats.currentMarketValue}
                depreciation={stats.totalDepreciation}
                depreciationPercent={stats.depreciationPercentage}
              />
              <StatsCard
                title="Most Depreciated"
                value={
                  stats.mostDepreciatedWatch
                    ? `${stats.mostDepreciatedWatch.watch.brand} ${stats.mostDepreciatedWatch.watch.model}`
                    : "N/A"
                }
                subtitle={
                  stats.mostDepreciatedWatch
                    ? `-$${Math.abs(stats.mostDepreciatedWatch.depreciation).toFixed(0)} (${Math.abs(stats.mostDepreciatedWatch.depreciationPercent).toFixed(1)}%)`
                    : undefined
                }
                icon={TrendingDown}
                variant="default"
              />
              <StatsCard
                title="Best Value Retention"
                value={
                  stats.bestValueRetention
                    ? `${stats.bestValueRetention.watch.brand} ${stats.bestValueRetention.watch.model}`
                    : "N/A"
                }
                subtitle={
                  stats.bestValueRetention
                    ? stats.bestValueRetention.depreciation < 0
                      ? `+$${Math.abs(stats.bestValueRetention.depreciation).toFixed(0)} (${Math.abs(stats.bestValueRetention.depreciationPercent).toFixed(1)}%)`
                      : `-$${Math.abs(stats.bestValueRetention.depreciation).toFixed(0)} (${Math.abs(stats.bestValueRetention.depreciationPercent).toFixed(1)}%)`
                    : undefined
                }
                icon={stats.bestValueRetention?.depreciation < 0 ? TrendingUp : DollarSign}
                variant="default"
              />
            </div>
            {stats.appreciatingWatchesCount > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {stats.appreciatingWatchesCount} watch{stats.appreciatingWatchesCount > 1 ? "es" : ""} currently worth more than purchase price
                </p>
              </div>
            )}
          </div>
          
          <DepreciationChart watches={watches} />
        </div>
      )}

      <div>
        <UsageChart watches={watches} wearEntries={wearEntries} onDataChange={refetch} />
      </div>
    </div>
  );
};

export default Dashboard;
