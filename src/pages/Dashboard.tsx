import { Watch, Calendar, TrendingUp, Target, Palette, Shirt, Flame, Plane, Droplets, TrendingDown, DollarSign } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { UsageChart } from "@/components/UsageChart";
import { QuickAddWearDialog } from "@/components/QuickAddWearDialog";
import { DepreciationCard } from "@/components/DepreciationCard";
import { DepreciationChart } from "@/components/DepreciationChart";
import { CollectionInsights } from "@/components/CollectionInsights";
import { MonthlyUsageTable } from "@/components/MonthlyUsageTable";
import { useWatchData } from "@/hooks/useWatchData";
import { useTripData } from "@/hooks/useTripData";
import { useWaterUsageData } from "@/hooks/useWaterUsageData";
import { useStatsCalculations } from "@/hooks/useStatsCalculations";
import { useCollection } from "@/contexts/CollectionContext";

const Dashboard = () => {
  const { selectedCollectionId, currentCollection } = useCollection();
  const { watches, wearEntries, loading: watchLoading, refetch } = useWatchData(selectedCollectionId);
  const { trips, loading: tripLoading } = useTripData();
  const { waterUsages, loading: waterLoading } = useWaterUsageData();

  const stats = useStatsCalculations(watches, wearEntries, trips, waterUsages);

  if (watchLoading || tripLoading || waterLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-textMuted">Loading your collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-semibold text-textMain">
              Dashboard
            </h1>
            {currentCollection && (
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {currentCollection.name}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-textMuted">
            {currentCollection 
              ? `Overview of ${currentCollection.name} statistics`
              : 'Overview of your watch collection statistics'}
          </p>
        </div>
        <QuickAddWearDialog watches={watches} onSuccess={refetch} />
      </div>

      <CollectionInsights watchCount={stats.totalWatches} watches={watches} />

      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatsCard
            title="Total Watches"
            value={stats.totalWatches}
            icon={Watch}
            variant="compact"
          />
          <StatsCard
            title="Total Days Worn"
            value={stats.totalDaysWorn}
            icon={Calendar}
            variant="compact"
          />
          <StatsCard
            title="Most Worn Watch"
            value={stats.mostWornWatch ? `${stats.mostWornWatch.brand} ${stats.mostWornWatch.model}` : "N/A"}
            icon={TrendingUp}
            variant="compact"
            watchId={stats.mostWornWatch?.id}
          />
          <StatsCard
            title="Avg Days/Watch"
            value={stats.avgDaysPerWatch}
            icon={Target}
            variant="compact"
          />
          <StatsCard
            title="Most Worn Dial Color"
            value={stats.mostWornDialColor || "N/A"}
            icon={Palette}
            variant="compact"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatsCard
            title="Most Worn Style"
            value={stats.mostWornStyle || "N/A"}
            icon={Shirt}
            variant="compact"
          />
          <StatsCard
            title="Trending (30 Days)"
            value={stats.trendingWatch ? `${stats.trendingWatch.brand} ${stats.trendingWatch.model}` : "N/A"}
            icon={Flame}
            variant="compact"
            watchId={stats.trendingWatch?.id}
          />
          <StatsCard
            title="Trending Down (90d)"
            value={stats.trendingDownWatch ? `${stats.trendingDownWatch.brand} ${stats.trendingDownWatch.model}` : "N/A"}
            subtitle={stats.trendingDownCount ? `${stats.trendingDownCount} watches ↓` : undefined}
            icon={TrendingDown}
            variant="compact"
            watchId={stats.trendingDownWatch?.id}
          />
          <StatsCard
            title="#1 Trip Watch"
            value={stats.topTripWatch ? `${stats.topTripWatch.brand} ${stats.topTripWatch.model}` : "N/A"}
            icon={Plane}
            variant="compact"
            watchId={stats.topTripWatch?.id}
          />
          <StatsCard
            title="#1 Water Usage"
            value={stats.topWaterWatch ? `${stats.topWaterWatch.brand} ${stats.topWaterWatch.model}` : "N/A"}
            icon={Droplets}
            variant="compact"
            watchId={stats.topWaterWatch?.id}
          />
        </div>
      </div>

      <UsageChart watches={watches} wearEntries={wearEntries} />

      <MonthlyUsageTable watches={watches} wearEntries={wearEntries} />

      {stats.watchesWithResaleDataCount > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-textMain">Collection Value & Depreciation</h2>
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
                watchId={stats.mostDepreciatedWatch?.watch.id}
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
                watchId={stats.bestValueRetention?.watch.id}
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
    </div>
  );
};

export default Dashboard;
