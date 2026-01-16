import { Card } from "@/components/ui/card";
import { Dumbbell, Clock, Flame, TrendingUp, Calendar } from "lucide-react";
import { useSportData } from "@/hooks/useSportData";
import { Link } from "react-router-dom";
import { useMemo } from "react";

interface SportStats {
  totalActivities: number;
  totalDuration: number;
  uniqueSportTypes: number;
  topSport: { name: string; count: number } | null;
  thisMonthActivities: number;
  lastMonthActivities: number;
  trend: "up" | "down" | "same";
  recentActivities: Array<{
    id: string;
    sport_type: string;
    activity_date: string;
    duration_minutes: number | null;
  }>;
}

export const SportStatsSection = () => {
  const { sports, loading } = useSportData();

  const stats = useMemo((): SportStats => {
    if (!sports.length) {
      return {
        totalActivities: 0,
        totalDuration: 0,
        uniqueSportTypes: 0,
        topSport: null,
        thisMonthActivities: 0,
        lastMonthActivities: 0,
        trend: "same",
        recentActivities: [],
      };
    }

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    // Count activities by sport type
    const sportCounts: Record<string, number> = {};
    let thisMonthCount = 0;
    let lastMonthCount = 0;
    let totalDuration = 0;

    sports.forEach((sport) => {
      sportCounts[sport.sport_type] = (sportCounts[sport.sport_type] || 0) + 1;
      totalDuration += sport.duration_minutes || 0;

      const date = new Date(sport.activity_date);
      if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
        thisMonthCount++;
      } else if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
        lastMonthCount++;
      }
    });

    // Find top sport
    const sortedSports = Object.entries(sportCounts).sort((a, b) => b[1] - a[1]);
    const topSport = sortedSports.length > 0 
      ? { name: sortedSports[0][0], count: sortedSports[0][1] }
      : null;

    // Determine trend
    let trend: "up" | "down" | "same" = "same";
    if (thisMonthCount > lastMonthCount) trend = "up";
    else if (thisMonthCount < lastMonthCount) trend = "down";

    return {
      totalActivities: sports.length,
      totalDuration,
      uniqueSportTypes: new Set(sports.map(s => s.sport_type)).size,
      topSport,
      thisMonthActivities: thisMonthCount,
      lastMonthActivities: lastMonthCount,
      trend,
      recentActivities: sports.slice(0, 3),
    };
  }, [sports]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <Card className="border-borderSubtle bg-surface p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-textMain">Sport Activities</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  if (stats.totalActivities === 0) {
    return (
      <Card className="border-borderSubtle bg-surface p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-textMain">Sport Activities</h3>
        </div>
        <p className="text-textMuted text-sm">
          No sport activities logged yet. Link sports when adding wear entries to track your workouts.
        </p>
        <Link 
          to="/sports" 
          className="text-sm text-primary hover:underline mt-2 inline-block"
        >
          View Sports →
        </Link>
      </Card>
    );
  }

  return (
    <Card className="border-borderSubtle bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-textMain">Sport Activities</h3>
        </div>
        <Link 
          to="/sports" 
          className="text-sm text-primary hover:underline"
        >
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{stats.totalActivities}</div>
          <div className="text-xs text-textMuted uppercase tracking-wide">Total Activities</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{formatDuration(stats.totalDuration)}</div>
          <div className="text-xs text-textMuted uppercase tracking-wide">Total Duration</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{stats.uniqueSportTypes}</div>
          <div className="text-xs text-textMuted uppercase tracking-wide">Sport Types</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-bold text-primary">{stats.thisMonthActivities}</span>
            {stats.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
            {stats.trend === "down" && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
          </div>
          <div className="text-xs text-textMuted uppercase tracking-wide">This Month</div>
        </div>
      </div>

      {stats.topSport && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg mb-4">
          <Flame className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-medium text-textMain">
              Most Active: {stats.topSport.name}
            </div>
            <div className="text-xs text-textMuted">
              {stats.topSport.count} {stats.topSport.count === 1 ? 'activity' : 'activities'}
            </div>
          </div>
        </div>
      )}

      {stats.recentActivities.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-textMuted mb-2">
            Recent Activities
          </h4>
          <div className="space-y-2">
            {stats.recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-textMain">{activity.sport_type}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-textMuted">
                  {activity.duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(activity.duration_minutes)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(activity.activity_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
