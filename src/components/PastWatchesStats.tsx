import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, Calendar, Watch } from "lucide-react";

interface PastWatch {
  id: string;
  brand: string;
  model: string;
  dial_color: string;
  type: string;
  cost: number;
  status: string;
  when_bought?: string;
}

interface WearEntry {
  id: string;
  watch_id: string;
  wear_date: string;
  days: number;
}

interface PastWatchesStatsProps {
  pastWatches: PastWatch[];
  wearEntries: WearEntry[];
}

export const PastWatchesStats = ({ pastWatches, wearEntries }: PastWatchesStatsProps) => {
  const totalPastWatches = pastWatches.length;
  const soldCount = pastWatches.filter(w => w.status === 'sold').length;
  const tradedCount = pastWatches.filter(w => w.status === 'traded').length;
  
  const totalValue = pastWatches.reduce((sum, w) => sum + (w.cost || 0), 0);
  const totalWearDays = wearEntries.length;
  
  const avgDaysPerWatch = totalPastWatches > 0 
    ? Math.round(totalWearDays / totalPastWatches) 
    : 0;

  // Find most worn past watch
  const wearCountByWatch = wearEntries.reduce((acc, entry) => {
    acc[entry.watch_id] = (acc[entry.watch_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostWornId = Object.entries(wearCountByWatch)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  
  const mostWornWatch = pastWatches.find(w => w.id === mostWornId);
  const mostWornDays = mostWornId ? wearCountByWatch[mostWornId] : 0;

  // Calculate average ownership duration
  const watchesWithDates = pastWatches.filter(w => w.when_bought);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <Card className="p-4 bg-surfaceMuted/50 border-borderSubtle">
        <div className="flex items-center gap-2 mb-2">
          <Watch className="w-4 h-4 text-textMuted" />
          <span className="text-xs text-textMuted">Total</span>
        </div>
        <p className="text-2xl font-bold text-textMain">{totalPastWatches}</p>
        <p className="text-xs text-textMuted mt-1">
          {soldCount} sold · {tradedCount} traded
        </p>
      </Card>

      <Card className="p-4 bg-surfaceMuted/50 border-borderSubtle">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-textMuted" />
          <span className="text-xs text-textMuted">Total Value</span>
        </div>
        <p className="text-2xl font-bold text-textMain">{formatCurrency(totalValue)}</p>
        <p className="text-xs text-textMuted mt-1">
          Avg: {formatCurrency(totalPastWatches > 0 ? totalValue / totalPastWatches : 0)}
        </p>
      </Card>

      <Card className="p-4 bg-surfaceMuted/50 border-borderSubtle">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-textMuted" />
          <span className="text-xs text-textMuted">Wear Days</span>
        </div>
        <p className="text-2xl font-bold text-textMain">{totalWearDays}</p>
        <p className="text-xs text-textMuted mt-1">
          Avg: {avgDaysPerWatch} days/watch
        </p>
      </Card>

      <Card className="p-4 bg-surfaceMuted/50 border-borderSubtle">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-textMuted" />
          <span className="text-xs text-textMuted">Most Worn</span>
        </div>
        {mostWornWatch ? (
          <>
            <p className="text-sm font-bold text-textMain truncate">
              {mostWornWatch.brand}
            </p>
            <p className="text-xs text-textMuted mt-1 truncate">
              {mostWornWatch.model} · {mostWornDays} days
            </p>
          </>
        ) : (
          <p className="text-sm text-textMuted">No data</p>
        )}
      </Card>
    </div>
  );
};
