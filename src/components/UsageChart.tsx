import { Watch } from "@/types/watch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { monthNames } from "@/data/watchData";
import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UsageChartProps {
  watches: Watch[];
}

const WATCH_COLORS = [
  "hsl(38, 92%, 50%)",   // Primary gold
  "hsl(200, 80%, 50%)",  // Blue
  "hsl(150, 70%, 45%)",  // Green
  "hsl(280, 70%, 50%)",  // Purple
  "hsl(20, 90%, 55%)",   // Orange
  "hsl(340, 80%, 50%)",  // Pink
  "hsl(180, 70%, 45%)",  // Cyan
  "hsl(60, 80%, 50%)",   // Yellow
  "hsl(120, 60%, 45%)",  // Lime
  "hsl(260, 70%, 55%)",  // Indigo
  "hsl(30, 85%, 55%)",   // Coral
  "hsl(190, 75%, 45%)",  // Teal
  "hsl(350, 75%, 50%)",  // Red
  "hsl(160, 65%, 45%)",  // Turquoise
  "hsl(290, 65%, 50%)",  // Violet
  "hsl(50, 90%, 50%)",   // Gold
  "hsl(210, 70%, 50%)",  // Sky
];

type Season = "Winter" | "Spring" | "Summer" | "Fall";

const getSeasonFromMonth = (monthIndex: number): Season => {
  if (monthIndex === 11 || monthIndex === 0 || monthIndex === 1) return "Winter";
  if (monthIndex >= 2 && monthIndex <= 4) return "Spring";
  if (monthIndex >= 5 && monthIndex <= 7) return "Summer";
  return "Fall";
};

export const UsageChart = ({ watches }: UsageChartProps) => {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Calculate monthly breakdown by watch
  const monthlyBreakdown = Array(12).fill(0).map(() => ({})) as Array<Record<string, number>>;
  
  watches.forEach((watch, watchIndex) => {
    const watchKey = `${watch.brand} ${watch.model}`;
    watch.monthlyWear.forEach((days, monthIndex) => {
      if (days > 0) {
        monthlyBreakdown[monthIndex][watchKey] = days;
      }
    });
  });

  // Calculate seasonal trends
  const seasonalData: Record<Season, { days: number; cost: number }> = {
    Winter: { days: 0, cost: 0 },
    Spring: { days: 0, cost: 0 },
    Summer: { days: 0, cost: 0 },
    Fall: { days: 0, cost: 0 },
  };

  watches.forEach(watch => {
    watch.monthlyWear.forEach((days, monthIndex) => {
      const season = getSeasonFromMonth(monthIndex);
      seasonalData[season].days += days;
      seasonalData[season].cost += (watch.cost / watch.total) * days || 0;
    });
  });

  // Calculate cost per use for each watch
  const watchCostPerUse = watches
    .filter(w => w.total > 0)
    .map(watch => ({
      name: `${watch.brand} ${watch.model}`,
      costPerUse: watch.cost / watch.total,
      total: watch.total,
      cost: watch.cost,
    }))
    .sort((a, b) => a.costPerUse - b.costPerUse);

  const monthlyTotals = Array(12).fill(0);
  watches.forEach(watch => {
    watch.monthlyWear.forEach((days, index) => {
      monthlyTotals[index] += days;
    });
  });

  const maxValue = Math.max(...monthlyTotals);

  // Get unique watches that were worn
  const wornWatches = watches.filter(w => w.total > 0);
  const watchColorMap = new Map<string, string>();
  wornWatches.forEach((watch, index) => {
    watchColorMap.set(`${watch.brand} ${watch.model}`, WATCH_COLORS[index % WATCH_COLORS.length]);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Chart */}
      <Card className="border-border bg-card p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">Monthly Wear Distribution</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-5 h-5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Hover over bars to see breakdown by watch model</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-end justify-between gap-2 h-80 mb-6">
          {monthlyTotals.map((total, monthIndex) => {
            const height = total > 0 ? (total / maxValue) * 100 : 0;
            const breakdown = monthlyBreakdown[monthIndex];
            const watches = Object.entries(breakdown);
            const isHovered = hoveredMonth === monthIndex;
            
            return (
              <TooltipProvider key={monthIndex}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex-1 flex flex-col items-center gap-2"
                      onMouseEnter={() => setHoveredMonth(monthIndex)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    >
                      <div className="w-full flex flex-col items-center justify-end h-full relative">
                        <div className="text-xs text-muted-foreground mb-2 font-medium">
                          {total > 0 ? total : ""}
                        </div>
                        <div
                          className="w-full rounded-t-md transition-all duration-300 relative overflow-hidden"
                          style={{ height: `${height}%`, minHeight: total > 0 ? '8px' : '0' }}
                        >
                          {watches.length > 0 ? (
                            <div className="h-full flex flex-col">
                              {watches.map(([watchName, days], idx) => {
                                const percentage = (days / total) * 100;
                                return (
                                  <div
                                    key={watchName}
                                    className={`transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-90'}`}
                                    style={{
                                      height: `${percentage}%`,
                                      backgroundColor: watchColorMap.get(watchName),
                                    }}
                                  />
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {monthNames[monthIndex]}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold mb-2">{monthNames[monthIndex]}</p>
                      {watches.length > 0 ? (
                        watches.map(([watchName, days]) => (
                          <div key={watchName} className="flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-sm"
                                style={{ backgroundColor: watchColorMap.get(watchName) }}
                              />
                              <span className="truncate max-w-[180px]">{watchName}</span>
                            </div>
                            <span className="font-medium">{days}d</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No watches worn</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
          {wornWatches.slice(0, 8).map((watch) => {
            const watchKey = `${watch.brand} ${watch.model}`;
            return (
              <div key={watchKey} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: watchColorMap.get(watchKey) }}
                />
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {watch.brand}
                </span>
              </div>
            );
          })}
          {wornWatches.length > 8 && (
            <span className="text-xs text-muted-foreground">+{wornWatches.length - 8} more</span>
          )}
        </div>
      </Card>

      {/* Side Stats */}
      <div className="space-y-6">
        {/* Seasonal Trends */}
        <Card className="border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Seasonal Trends</h3>
          <div className="space-y-4">
            {(Object.entries(seasonalData) as [Season, typeof seasonalData[Season]][])
              .sort((a, b) => b[1].days - a[1].days)
              .map(([season, data]) => {
                const maxSeasonDays = Math.max(...Object.values(seasonalData).map(s => s.days));
                const percentage = (data.days / maxSeasonDays) * 100;
                const avgCostPerDay = data.days > 0 ? data.cost / data.days : 0;
                
                return (
                  <div key={season} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">{season}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{data.days.toFixed(1)}d</span>
                        {season === Object.entries(seasonalData).sort((a, b) => b[1].days - a[1].days)[0][0] ? (
                          <TrendingUp className="w-4 h-4 text-primary" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg: ${avgCostPerDay.toFixed(0)}/day
                    </p>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Top Cost Per Use */}
        <Card className="border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Best Value
          </h3>
          <div className="space-y-3">
            {watchCostPerUse.slice(0, 5).map((watch, index) => (
              <div key={watch.name} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-foreground font-medium truncate flex-1">
                    {watch.name}
                  </span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    ${watch.costPerUse.toFixed(0)}/day
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {watch.total} days • ${watch.cost.toLocaleString()} total
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Worst Cost Per Use */}
        <Card className="border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-destructive" />
            Needs More Wear
          </h3>
          <div className="space-y-3">
            {watchCostPerUse.slice(-5).reverse().map((watch) => (
              <div key={watch.name} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-foreground font-medium truncate flex-1">
                    {watch.name}
                  </span>
                  <Badge variant="destructive" className="text-xs shrink-0">
                    ${watch.costPerUse.toFixed(0)}/day
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {watch.total} days • ${watch.cost.toLocaleString()} total
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
