import { useMemo } from "react";

interface Watch {
  id: string;
  brand: string;
  model: string;
  cost: number;
  dial_color: string;
  type: string;
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

    // Top trip watch - extract watch IDs from watch_model JSON
    const tripWatchCounts = trips.reduce(
      (acc, trip) => {
        if (trip.watch_model && typeof trip.watch_model === 'object') {
          Object.keys(trip.watch_model).forEach((watchId) => {
            acc[watchId] = (acc[watchId] || 0) + 1;
          });
        }
        return acc;
      },
      {} as Record<string, number>
    );
    const topTripWatchId = Object.entries(tripWatchCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];
    const topTripWatch = watches.find((w) => w.id === topTripWatchId);

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
    };
  }, [watches, wearEntries, trips, waterUsages]);
};
