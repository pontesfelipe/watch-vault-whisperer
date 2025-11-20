import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditWearEntryDialog } from "./EditWearEntryDialog";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Watch {
  id: string;
  brand: string;
  model: string;
}

interface WearEntry {
  id: string;
  watch_id: string;
  wear_date: string;
  days: number;
  notes?: string | null;
  updated_at?: string;
  trip_id?: string | null;
  event_id?: string | null;
  water_usage_id?: string | null;
}

interface MonthlyWearGridProps {
  watches: Watch[];
  wearEntries: WearEntry[];
  onDataChange?: () => void;
}

type Metric = 'days' | 'entries';

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

export const MonthlyWearGrid = ({ watches, wearEntries, onDataChange }: MonthlyWearGridProps) => {
const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
const [metric, setMetric] = useState<Metric>('entries');
const [selectedEntries, setSelectedEntries] = useState<WearEntry[]>([]);
const [selectedWatchName, setSelectedWatchName] = useState<string>("");
const [dialogOpen, setDialogOpen] = useState(false);

// Get available years from wear entries
const availableYears = Array.from(
  new Set(wearEntries.map(entry => new Date(entry.wear_date).getFullYear()))
).sort((a, b) => b - a);
  
  // Find the most recent update timestamp
  const lastUpdateDate = wearEntries.length > 0 && wearEntries.some(e => e.updated_at)
    ? format(
        new Date(
          Math.max(...wearEntries.filter(e => e.updated_at).map(entry => new Date(entry.updated_at!).getTime()))
        ),
        "MMMM d, yyyy"
      )
    : "No entries yet";
  
  // Filter wear entries by selected year
  const filteredWearEntries = wearEntries.filter(entry => 
    new Date(entry.wear_date).getFullYear().toString() === selectedYear
  );
  
// Calculate monthly breakdowns by watch for both metrics
const monthlyDaysBreakdown = Array(12).fill(0).map(() => ({} as Record<string, number>));
const monthlyEntriesBreakdown = Array(12).fill(0).map(() => ({} as Record<string, number>));
const watchTotalsDays = new Map<string, number>();
const watchTotalsEntries = new Map<string, number>();

filteredWearEntries.forEach((entry) => {
  const date = new Date(entry.wear_date);
  const monthIndex = date.getMonth();
  const watch = watches.find(w => w.id === entry.watch_id);
  
  if (watch) {
    const watchKey = `${watch.brand} ${watch.model}`;
    // Days metric
    monthlyDaysBreakdown[monthIndex][watchKey] = (monthlyDaysBreakdown[monthIndex][watchKey] || 0) + entry.days;
    watchTotalsDays.set(watch.id, (watchTotalsDays.get(watch.id) || 0) + entry.days);
    // Entries metric
    monthlyEntriesBreakdown[monthIndex][watchKey] = (monthlyEntriesBreakdown[monthIndex][watchKey] || 0) + 1;
    watchTotalsEntries.set(watch.id, (watchTotalsEntries.get(watch.id) || 0) + 1);
  }
});

  // Get color map for all watches to ensure consistent colors even for unworn watches
  const watchColorMap = new Map<string, string>();
  watches.forEach((watch, index) => {
    watchColorMap.set(`${watch.brand} ${watch.model}`, WATCH_COLORS[index % WATCH_COLORS.length]);
  });

  // Calculate monthly totals for both metrics
  const monthlyTotalsDays = monthlyDaysBreakdown.map(breakdown =>
    Object.values(breakdown).reduce((sum, days) => sum + days, 0)
  );
  const monthlyTotalsEntries = monthlyEntriesBreakdown.map(breakdown =>
    Object.values(breakdown).reduce((sum, count) => sum + count, 0)
  );

  // Active datasets based on selected metric
  const activeBreakdown = metric === 'days' ? monthlyDaysBreakdown : monthlyEntriesBreakdown;
  const watchTotalsMap = metric === 'days' ? watchTotalsDays : watchTotalsEntries;
  const monthlyTotals = metric === 'days' ? monthlyTotalsDays : monthlyTotalsEntries;

  const handleCellClick = (watch: Watch, monthIndex: number) => {
    const watchKey = `${watch.brand} ${watch.model}`;
    const entriesForCell = filteredWearEntries.filter(entry => {
      const entryDate = new Date(entry.wear_date);
      return entry.watch_id === watch.id && entryDate.getMonth() === monthIndex;
    });

    if (entriesForCell.length > 0) {
      setSelectedEntries(entriesForCell);
      setSelectedWatchName(watchKey);
      setDialogOpen(true);
    }
  };

  const handleDialogUpdate = () => {
    if (onDataChange) {
      onDataChange();
    }
  };

  return (
    <>
      <EditWearEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entries={selectedEntries}
        watchName={selectedWatchName}
        onUpdate={handleDialogUpdate}
      />
    <Card className="border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">
          Monthly Wear Distribution ({metric === 'days' ? 'Days worn' : 'Entries'}) - Last Update: {lastUpdateDate}
        </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Year:</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Metric:</label>
              <Select value={metric} onValueChange={(v) => setMetric(v as Metric)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Entries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entries">Entries</SelectItem>
                  <SelectItem value="days">Days worn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
      </div>
      
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
            {watches.map((watch) => {
              const watchKey = `${watch.brand} ${watch.model}`;
              const total = watchTotalsMap.get(watch.id) || 0;
              
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
                  {activeBreakdown.map((breakdown, monthIndex) => {
                    const val = breakdown[watchKey] || 0;
                    
                    return (
                      <TableCell 
                        key={monthIndex} 
                        className="text-center text-sm cursor-pointer hover:opacity-70 transition-opacity"
                        style={{
                          backgroundColor: val > 0 ? `${watchColorMap.get(watchKey)}20` : 'transparent',
                          fontWeight: val > 0 ? '600' : 'normal',
                        }}
                        onClick={() => val > 0 && handleCellClick(watch, monthIndex)}
                      >
                        <span>
                          {val > 0 ? (metric === 'days' ? `${val.toFixed(1)}d` : Math.round(val)) : '-'}
                        </span>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-bold text-primary">
                    {metric === 'days' ? `${total.toFixed(1)}d` : Math.round(total)}
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
                  {total > 0 ? (metric === 'days' ? total.toFixed(1) : Math.round(total)) : '-'}
                </TableCell>
              ))}
              <TableCell className="text-center font-bold text-primary">
                {metric === 'days' 
                  ? (monthlyTotals.reduce((sum, val) => sum + val, 0)).toFixed(1)
                  : Math.round(monthlyTotals.reduce((sum, val) => sum + val, 0))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
    </>
  );
};
