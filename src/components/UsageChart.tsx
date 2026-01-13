import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Eye, EyeOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePasscode } from "@/contexts/PasscodeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Watch {
  id: string;
  brand: string;
  model: string;
  cost: number;
  type: string;
  dial_color: string;
}

interface WearEntry {
  watch_id: string;
  wear_date: string;
  days: number;
}

interface UsageChartProps {
  watches: Watch[];
  wearEntries: WearEntry[];
  onDataChange?: () => void;
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

export const UsageChart = ({ watches, wearEntries, onDataChange }: UsageChartProps) => {
  const { isAdmin } = useAuth();
  const [showAllBestValue, setShowAllBestValue] = useState(false);
  const [showAllNeedsWear, setShowAllNeedsWear] = useState(false);
  const [showCost, setShowCost] = useState(isAdmin);
  const { requestVerification, isVerified } = usePasscode();

  const handleToggleCost = () => {
    if (!showCost) {
      if (isVerified) {
        setShowCost(true);
      } else {
        requestVerification(() => {
          setShowCost(true);
        });
      }
    } else {
      setShowCost(false);
    }
  };

  // Auto-show cost if already verified or if admin
  useEffect(() => {
    if (isVerified || isAdmin) {
      setShowCost(true);
    }
  }, [isVerified, isAdmin]);

  // Calculate monthly breakdown by watch
  const monthlyBreakdown = Array(12).fill(0).map(() => ({})) as Array<Record<string, number>>;
  const watchTotals = new Map<string, number>();
  
  wearEntries.forEach((entry) => {
    const date = new Date(entry.wear_date);
    const monthIndex = date.getMonth();
    const watch = watches.find(w => w.id === entry.watch_id);
    
    if (watch) {
      const watchKey = `${watch.brand} ${watch.model}`;
      monthlyBreakdown[monthIndex][watchKey] = (monthlyBreakdown[monthIndex][watchKey] || 0) + entry.days;
      watchTotals.set(watch.id, (watchTotals.get(watch.id) || 0) + entry.days);
    }
  });

  // Calculate seasonal trends with detailed breakdowns
  const seasonalData: Record<Season, { 
    days: number; 
    cost: number; 
    watches: Map<string, number>;
    styles: Map<string, number>;
    colors: Map<string, number>;
  }> = {
    Winter: { days: 0, cost: 0, watches: new Map(), styles: new Map(), colors: new Map() },
    Spring: { days: 0, cost: 0, watches: new Map(), styles: new Map(), colors: new Map() },
    Summer: { days: 0, cost: 0, watches: new Map(), styles: new Map(), colors: new Map() },
    Fall: { days: 0, cost: 0, watches: new Map(), styles: new Map(), colors: new Map() },
  };

  wearEntries.forEach(entry => {
    const date = new Date(entry.wear_date);
    const monthIndex = date.getMonth();
    const season = getSeasonFromMonth(monthIndex);
    const watch = watches.find(w => w.id === entry.watch_id);
    
    if (watch) {
      const watchTotal = watchTotals.get(watch.id) || 1;
      const watchKey = `${watch.brand} ${watch.model}`;
      
      seasonalData[season].days += entry.days;
      seasonalData[season].cost += (watch.cost / watchTotal) * entry.days;
      seasonalData[season].watches.set(watchKey, (seasonalData[season].watches.get(watchKey) || 0) + entry.days);
      seasonalData[season].styles.set(watch.type, (seasonalData[season].styles.get(watch.type) || 0) + entry.days);
      seasonalData[season].colors.set(watch.dial_color, (seasonalData[season].colors.get(watch.dial_color) || 0) + entry.days);
    }
  });

  // Calculate cost per use for each watch
  const watchCostPerUse = watches
    .map(watch => {
      const total = watchTotals.get(watch.id) || 0;
      return {
        name: `${watch.brand} ${watch.model}`,
        costPerUse: total > 0 ? watch.cost / total : watch.cost,
        total,
        cost: watch.cost,
      };
    })
    .filter(w => w.total > 0)
    .sort((a, b) => a.costPerUse - b.costPerUse);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Seasonal Trends */}
        <Card className="border-border bg-card p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Seasonal Trends</h3>
          <div className="space-y-6">
            {(Object.entries(seasonalData) as [Season, typeof seasonalData[Season]][])
              .sort((a, b) => b[1].days - a[1].days)
              .map(([season, data]) => {
                const maxSeasonDays = Math.max(...Object.values(seasonalData).map(s => s.days));
                const percentage = (data.days / maxSeasonDays) * 100;
                const avgCostPerDay = data.days > 0 ? data.cost / data.days : 0;
                
                // Get top watch, style, and color for this season
                const topWatch = Array.from(data.watches.entries()).sort((a, b) => b[1] - a[1])[0];
                const topStyle = Array.from(data.styles.entries()).sort((a, b) => b[1] - a[1])[0];
                const topColor = Array.from(data.colors.entries()).sort((a, b) => b[1] - a[1])[0];
                
                return (
                  <TooltipProvider key={season}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-2 cursor-pointer">
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
                          <div className="flex flex-wrap gap-1">
                            {topStyle && (
                              <Badge variant="outline" className="text-xs">
                                {topStyle[0]}
                              </Badge>
                            )}
                            {topColor && (
                              <Badge variant="outline" className="text-xs">
                                {topColor[0]}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-card border-2 border-border z-50">
                        <div className="space-y-3 p-2">
                          <p className="font-bold text-foreground">{season}</p>
                          <div className="space-y-2">
                            {showCost && (
                              <p className="text-xs text-muted-foreground">Avg: ${avgCostPerDay.toFixed(0)}/day</p>
                            )}
                            {topWatch && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Top watch:</span>
                                <span className="ml-1 text-foreground font-medium">{topWatch[0]}</span>
                                <span className="ml-1 text-muted-foreground">({topWatch[1].toFixed(1)}d)</span>
                              </div>
                            )}
                            {data.styles.size > 0 && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Styles:</span>
                                {Array.from(data.styles.entries())
                                  .sort((a, b) => b[1] - a[1])
                                  .map(([style, days]) => (
                                    <div key={style} className="ml-2">
                                      {style}: {days.toFixed(1)}d
                                    </div>
                                  ))}
                              </div>
                            )}
                            {data.colors.size > 0 && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Colors:</span>
                                {Array.from(data.colors.entries())
                                  .sort((a, b) => b[1] - a[1])
                                  .map(([color, days]) => (
                                    <div key={color} className="ml-2">
                                      {color}: {days.toFixed(1)}d
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
          </div>
        </Card>

        {/* Top Cost Per Use */}
        <Card className="border-border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-1.5 sm:gap-2 truncate">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <span className="truncate">Best Value</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleToggleCost}
              >
                {showCost ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {watchCostPerUse.length > 5 && (
              <button
                onClick={() => setShowAllBestValue(!showAllBestValue)}
                className="text-xs text-primary hover:underline"
              >
                {showAllBestValue ? 'Show less' : `Show all (${watchCostPerUse.length})`}
              </button>
            )}
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {(showAllBestValue ? watchCostPerUse : watchCostPerUse.slice(0, 5)).map((watch, index) => (
              <div key={watch.name} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-foreground font-medium truncate flex-1">
                    {watch.name}
                  </span>
                  {showCost ? (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      ${watch.costPerUse.toFixed(0)}/day
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      ••••/day
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {watch.total} days{showCost && ` • $${watch.cost.toLocaleString()} total`}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Worst Cost Per Use */}
        <Card className="border-border bg-card p-4 sm:p-6 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-1.5 sm:gap-2 truncate">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-destructive flex-shrink-0" />
              <span className="truncate">Needs More Wear</span>
            </h3>
            {watchCostPerUse.length > 5 && (
              <button
                onClick={() => setShowAllNeedsWear(!showAllNeedsWear)}
                className="text-xs text-primary hover:underline"
              >
                {showAllNeedsWear ? 'Show less' : `Show all (${watchCostPerUse.length})`}
              </button>
            )}
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {(showAllNeedsWear ? watchCostPerUse.slice().reverse() : watchCostPerUse.slice(-5).reverse()).map((watch) => (
              <div key={watch.name} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-foreground font-medium truncate flex-1">
                    {watch.name}
                  </span>
                  {showCost ? (
                    <Badge variant="destructive" className="text-xs shrink-0">
                      ${watch.costPerUse.toFixed(0)}/day
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs shrink-0">
                      ••••/day
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {watch.total} days{showCost && ` • $${watch.cost.toLocaleString()} total`}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
