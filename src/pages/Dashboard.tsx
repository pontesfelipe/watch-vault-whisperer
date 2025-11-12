import { Watch, Calendar, TrendingUp, Target, Palette, Shirt, Flame, Plane, Droplets } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { UsageChart } from "@/components/UsageChart";
import { QuickAddWearDialog } from "@/components/QuickAddWearDialog";
import { useWatchData } from "@/hooks/useWatchData";
import { useTripData } from "@/hooks/useTripData";
import { useWaterUsageData } from "@/hooks/useWaterUsageData";
import { useStatsCalculations } from "@/hooks/useStatsCalculations";

const Dashboard = () => {
  const { watches, wearEntries, loading: watchLoading, refetch } = useWatchData();
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
    <div className="space-y-8">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Watches"
          value={stats.totalWatches}
          icon={Watch}
        />
        <StatsCard
          title="Total Days Worn"
          value={stats.totalDaysWorn}
          icon={Calendar}
        />
        <StatsCard
          title="Most Worn Watch"
          value={stats.mostWornWatch ? `${stats.mostWornWatch.brand} ${stats.mostWornWatch.model}` : "N/A"}
          icon={TrendingUp}
        />
        <StatsCard
          title="Avg Days/Watch"
          value={stats.avgDaysPerWatch}
          icon={Target}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsageChart watches={watches} wearEntries={wearEntries} />
        
        <div className="space-y-6">
          <StatsCard
            title="Most Worn Dial Color"
            value={stats.mostWornDialColor || "N/A"}
            icon={Palette}
          />
          <StatsCard
            title="Most Worn Style"
            value={stats.mostWornStyle || "N/A"}
            icon={Shirt}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Trending (30 Days)"
          value={stats.trendingWatch ? `${stats.trendingWatch.brand} ${stats.trendingWatch.model}` : "N/A"}
          icon={Flame}
        />
        <StatsCard
          title="#1 Trip Watch"
          value={stats.topTripWatch ? `${stats.topTripWatch.brand} ${stats.topTripWatch.model}` : "N/A"}
          icon={Plane}
        />
        <StatsCard
          title="#1 Water Usage"
          value={stats.topWaterWatch ? `${stats.topWaterWatch.brand} ${stats.topWaterWatch.model}` : "N/A"}
          icon={Droplets}
        />
      </div>
    </div>
  );
};

export default Dashboard;
