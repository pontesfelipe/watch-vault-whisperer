import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Watch {
  id: string;
  brand: string;
  model: string;
}

interface WearEntry {
  watch_id: string;
  wear_date: string;
  days: number;
}

interface MonthlyWearGridProps {
  watches: Watch[];
  wearEntries: WearEntry[];
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

export const MonthlyWearGrid = ({ watches, wearEntries }: MonthlyWearGridProps) => {
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

  // Get unique watches that were worn
  const wornWatches = watches.filter(w => (watchTotals.get(w.id) || 0) > 0);
  const watchColorMap = new Map<string, string>();
  wornWatches.forEach((watch, index) => {
    watchColorMap.set(`${watch.brand} ${watch.model}`, WATCH_COLORS[index % WATCH_COLORS.length]);
  });

  // Calculate monthly totals
  const monthlyTotals = monthlyBreakdown.map(breakdown => 
    Object.values(breakdown).reduce((sum, days) => sum + days, 0)
  );

  return (
    <Card className="border-border bg-card p-6">
      <h3 className="text-xl font-semibold text-foreground mb-6">Monthly Wear Distribution</h3>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-foreground sticky left-0 bg-card z-10">Watch</TableHead>
              {monthNames.map((month) => (
                <TableHead key={month} className="text-center font-semibold text-foreground min-w-[60px]">
                  {month}
                </TableHead>
              ))}
              <TableHead className="text-center font-semibold text-foreground">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wornWatches.map((watch) => {
              const watchKey = `${watch.brand} ${watch.model}`;
              const total = watchTotals.get(watch.id) || 0;
              
              return (
                <TableRow key={watch.id}>
                  <TableCell className="font-medium sticky left-0 bg-card z-10">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: watchColorMap.get(watchKey) }}
                      />
                      <span className="text-foreground text-sm truncate max-w-[180px]">
                        {watch.brand} {watch.model}
                      </span>
                    </div>
                  </TableCell>
                  {monthlyBreakdown.map((breakdown, monthIndex) => {
                    const days = breakdown[watchKey] || 0;
                    return (
                      <TableCell 
                        key={monthIndex} 
                        className="text-center text-sm"
                        style={{
                          backgroundColor: days > 0 ? `${watchColorMap.get(watchKey)}20` : 'transparent',
                          fontWeight: days > 0 ? '600' : 'normal',
                        }}
                      >
                        {days > 0 ? days.toFixed(1) : '-'}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-bold text-primary">
                    {total.toFixed(1)}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/50">
              <TableCell className="font-bold text-foreground sticky left-0 bg-muted/50 z-10">
                Monthly Total
              </TableCell>
              {monthlyTotals.map((total, monthIndex) => (
                <TableCell key={monthIndex} className="text-center font-bold text-foreground">
                  {total > 0 ? total.toFixed(1) : '-'}
                </TableCell>
              ))}
              <TableCell className="text-center font-bold text-primary">
                {monthlyTotals.reduce((sum, val) => sum + val, 0).toFixed(1)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
