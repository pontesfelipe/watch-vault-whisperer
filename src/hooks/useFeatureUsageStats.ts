import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CollectionType } from "@/types/collection";

export interface FeatureUsageStat {
  feature_key: string;
  collection_type: CollectionType;
  total_uses: number;
  unique_users: number;
  last_used: string | null;
}

export interface DailyUsage {
  date: string;
  count: number;
}

export const useFeatureUsageStats = (daysBack: number = 30) => {
  const [stats, setStats] = useState<FeatureUsageStat[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch aggregated stats using the database function
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_feature_usage_summary', { _days_back: daysBack });

      if (summaryError) throw summaryError;

      setStats((summaryData as FeatureUsageStat[]) || []);

      // Calculate total events
      const total = (summaryData as FeatureUsageStat[] || []).reduce(
        (sum, stat) => sum + (stat.total_uses || 0),
        0
      );
      setTotalEvents(total);

      // Fetch daily usage for chart
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: dailyData, error: dailyError } = await supabase
        .from('feature_usage_events')
        .select('used_at')
        .gte('used_at', startDate.toISOString())
        .order('used_at', { ascending: true });

      if (dailyError) throw dailyError;

      // Group by day
      const dailyMap: Record<string, number> = {};
      (dailyData || []).forEach((event: { used_at: string }) => {
        const date = event.used_at.split('T')[0];
        dailyMap[date] = (dailyMap[date] || 0) + 1;
      });

      // Fill in missing days with 0
      const daily: DailyUsage[] = [];
      for (let i = 0; i < daysBack; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (daysBack - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        daily.push({
          date: dateStr,
          count: dailyMap[dateStr] || 0,
        });
      }

      setDailyUsage(daily);
    } catch (error) {
      console.error("Error fetching feature usage stats:", error);
      toast.error("Failed to load feature usage stats");
    } finally {
      setLoading(false);
    }
  }, [daysBack]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Get top features across all collection types
  const getTopFeatures = (limit: number = 10): FeatureUsageStat[] => {
    return [...stats]
      .sort((a, b) => b.total_uses - a.total_uses)
      .slice(0, limit);
  };

  // Get stats for a specific collection type
  const getStatsByCollectionType = (collectionType: CollectionType): FeatureUsageStat[] => {
    return stats.filter(s => s.collection_type === collectionType);
  };

  // Get unique users count
  const getUniqueUsersCount = (): number => {
    // This is an approximation - users may use multiple features
    const maxUniqueUsers = Math.max(...stats.map(s => s.unique_users || 0), 0);
    return maxUniqueUsers;
  };

  return {
    stats,
    dailyUsage,
    loading,
    totalEvents,
    refetch: fetchStats,
    getTopFeatures,
    getStatsByCollectionType,
    getUniqueUsersCount,
  };
};
