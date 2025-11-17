import { useMemo } from "react";

interface Watch {
  id: string;
  brand: string;
  model: string;
  cost: number;
  msrp?: number;
  dial_color: string;
  type: string;
  average_resale_price?: number;
}

interface WearEntry {
  watch_id: string;
  wear_date: string;
  days: number;
}

interface Trip {
  watch_model?: any;
}

interface WaterUsage {
  watch_id: string;
}

export const useStatsCalculations = (
  watches: Watch[],
  wearEntries: WearEntry[],
  trips: Trip[],
  waterUsages: WaterUsage[]
) => {
  return useMemo(() => {
    const totalWatches = watches.length;
    const totalDaysWorn = wearEntries.reduce((sum, entry) => sum + (entry.days || 1), 0);

    // Most worn watch - sum up days worn per watch
    const wearCounts = wearEntries.reduce(
      (acc, entry) => {
        acc[entry.watch_id] = (acc[entry.watch_id] || 0) + (entry.days || 1);
        return acc;
      },
      {} as Record<string, number>
    );

    const mostWornWatchId = Object.entries(wearCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];
    const mostWornWatch = watches.find((w) => w.id === mostWornWatchId);

    // Average days per watch
    const avgDaysPerWatch =
      totalWatches > 0 ? Math.round(totalDaysWorn / totalWatches) : 0;

    // Most worn dial color
    const dialColorCounts = wearEntries.reduce(
      (acc, entry) => {
        const watch = watches.find((w) => w.id === entry.watch_id);
        if (watch?.dial_color) {
          acc[watch.dial_color] = (acc[watch.dial_color] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );
    const mostWornDialColor = Object.entries(dialColorCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];

    // Most worn style
    const styleCounts = wearEntries.reduce(
      (acc, entry) => {
        const watch = watches.find((w) => w.id === entry.watch_id);
        if (watch?.type) {
          acc[watch.type] = (acc[watch.type] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );
    const mostWornStyle = Object.entries(styleCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];

    // Trending watch (most worn in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentWears = wearEntries.filter(
      (entry) => new Date(entry.wear_date) >= thirtyDaysAgo
    );
    const recentWearCounts = recentWears.reduce(
      (acc, entry) => {
        acc[entry.watch_id] = (acc[entry.watch_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const trendingWatchId = Object.entries(recentWearCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];
    const trendingWatch = watches.find((w) => w.id === trendingWatchId);

    // Top trip watch - extract watch model names from watch_model JSON
    const tripWatchCounts = trips.reduce(
      (acc, trip) => {
        if (trip.watch_model && typeof trip.watch_model === 'object') {
          Object.keys(trip.watch_model).forEach((modelName) => {
            acc[modelName] = (acc[modelName] || 0) + 1;
          });
        }
        return acc;
      },
      {} as Record<string, number>
    );
    const topTripModelName = Object.entries(tripWatchCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];
    const topTripWatch = watches.find((w) => w.model === topTripModelName);

    // Top water usage watch
    const waterWatchCounts = waterUsages.reduce(
      (acc, usage) => {
        acc[usage.watch_id] = (acc[usage.watch_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const topWaterWatchId = Object.entries(waterWatchCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];
    const topWaterWatch = watches.find((w) => w.id === topWaterWatchId);

    // Trending down watches (comparing last 90 days vs previous 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const oneEightyDaysAgo = new Date();
    oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);

    const last90DaysWears = wearEntries.filter(
      (entry) => new Date(entry.wear_date) >= ninetyDaysAgo
    );
    const previous90DaysWears = wearEntries.filter(
      (entry) => new Date(entry.wear_date) >= oneEightyDaysAgo && new Date(entry.wear_date) < ninetyDaysAgo
    );

    const last90DaysCounts = last90DaysWears.reduce(
      (acc, entry) => {
        acc[entry.watch_id] = (acc[entry.watch_id] || 0) + (entry.days || 1);
        return acc;
      },
      {} as Record<string, number>
    );

    const previous90DaysCounts = previous90DaysWears.reduce(
      (acc, entry) => {
        acc[entry.watch_id] = (acc[entry.watch_id] || 0) + (entry.days || 1);
        return acc;
      },
      {} as Record<string, number>
    );

    // Find watches trending down (significant decrease in usage)
    const trendingDownWatches = watches
      .map((watch) => {
        const lastCount = last90DaysCounts[watch.id] || 0;
        const prevCount = previous90DaysCounts[watch.id] || 0;
        const change = lastCount - prevCount;
        const percentChange = prevCount > 0 ? ((change / prevCount) * 100) : 0;
        
        return {
          watch,
          lastCount,
          prevCount,
          change,
          percentChange,
          trend: change < 0 ? 'down' : change > 0 ? 'up' : 'stable'
        };
      })
      .filter((item) => item.trend === 'down' && item.prevCount > 0)
      .sort((a, b) => a.percentChange - b.percentChange);

    const topTrendingDownWatch = trendingDownWatches[0]?.watch;

    // Depreciation Analysis
    const totalCollectionValue = watches.reduce((sum, watch) => sum + (watch.cost || 0), 0);
    const totalMSRP = watches.reduce((sum, watch) => sum + (watch.msrp || 0), 0);
    
    const watchesWithResaleData = watches.filter(w => w.average_resale_price != null && w.average_resale_price > 0);
    const currentMarketValue = watchesWithResaleData.reduce((sum, watch) => sum + (watch.average_resale_price || 0), 0);
    
    const totalDepreciation = totalCollectionValue - currentMarketValue;
    const depreciationPercentage = totalCollectionValue > 0 
      ? ((totalDepreciation / totalCollectionValue) * 100) 
      : 0;

    // Calculate depreciation per watch
    const watchDepreciations = watchesWithResaleData.map(watch => {
      const depreciation = (watch.cost || 0) - (watch.average_resale_price || 0);
      const depreciationPercent = watch.cost > 0 ? (depreciation / watch.cost) * 100 : 0;
      return {
        watch,
        depreciation,
        depreciationPercent,
      };
    });

    // Most depreciated watch
    const mostDepreciatedWatch = watchDepreciations.length > 0
      ? watchDepreciations.sort((a, b) => b.depreciation - a.depreciation)[0]
      : null;

    // Best value retention (least depreciation or appreciation)
    const bestValueRetention = watchDepreciations.length > 0
      ? watchDepreciations.sort((a, b) => a.depreciation - b.depreciation)[0]
      : null;

    // Watches with appreciation
    const appreciatingWatches = watchDepreciations.filter(w => w.depreciation < 0);

    return {
      totalWatches,
      totalDaysWorn,
      mostWornWatch,
      avgDaysPerWatch,
      mostWornDialColor,
      mostWornStyle,
      trendingWatch,
      topTripWatch,
      topWaterWatch,
      trendingDownWatch: topTrendingDownWatch,
      trendingDownCount: trendingDownWatches.length,
      // Depreciation stats
      totalMSRP,
      totalCollectionValue,
      currentMarketValue,
      totalDepreciation,
      depreciationPercentage,
      mostDepreciatedWatch,
      bestValueRetention,
      appreciatingWatchesCount: appreciatingWatches.length,
      watchesWithResaleDataCount: watchesWithResaleData.length,
    };
  }, [watches, wearEntries, trips, waterUsages]);
};
