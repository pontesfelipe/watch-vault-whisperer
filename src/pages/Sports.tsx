import { Card } from "@/components/ui/card";
import { SportTimeline } from "@/components/SportTimeline";
import { QuickAddWearDialog } from "@/components/QuickAddWearDialog";
import { useSportData } from "@/hooks/useSportData";
import { useWatchData } from "@/hooks/useWatchData";

const Sports = () => {
  const { sports, loading: sportLoading, refetch } = useSportData();
  const { watches, loading: watchLoading } = useWatchData();

  // Calculate stats
  const totalActivities = sports.length;
  const uniqueSportTypes = new Set(sports.map(s => s.sport_type)).size;
  const totalDuration = sports.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  
  // Find most active sport
  const sportCounts: Record<string, number> = {};
  sports.forEach(s => {
    sportCounts[s.sport_type] = (sportCounts[s.sport_type] || 0) + 1;
  });
  const topSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0];

  if (sportLoading || watchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-textMuted">Loading sport activities...</p>
        </div>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-textMain">
            Sport Activities
          </h1>
          <p className="text-sm text-textMuted mt-1">
            Track your workouts and sport activities with your collection
          </p>
        </div>
        <QuickAddWearDialog 
          watches={watches} 
          onSuccess={refetch}
        />
      </div>

      {sports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-borderSubtle bg-surface p-6 shadow-card">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted mb-2">
              Total Activities
            </h3>
            <p className="text-2xl font-bold text-primary">
              {totalActivities}
            </p>
          </Card>
          <Card className="border-borderSubtle bg-surface p-6 shadow-card">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted mb-2">
              Sport Types
            </h3>
            <p className="text-2xl font-bold text-primary">
              {uniqueSportTypes}
            </p>
          </Card>
          <Card className="border-borderSubtle bg-surface p-6 shadow-card">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted mb-2">
              Total Duration
            </h3>
            <p className="text-2xl font-bold text-primary">
              {formatDuration(totalDuration)}
            </p>
          </Card>
          {topSport && (
            <Card className="border-borderSubtle bg-surface p-6 shadow-card">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-textMuted mb-2">
                #1 Sport
              </h3>
              <p className="text-2xl font-bold text-primary">
                {topSport[0]}
              </p>
              <p className="text-sm text-textMuted">{topSport[1]} activities</p>
            </Card>
          )}
        </div>
      )}

      <SportTimeline
        sports={sports}
        onUpdate={refetch}
      />
    </div>
  );
};

export default Sports;
