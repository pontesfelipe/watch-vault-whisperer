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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { usePasscode } from "@/contexts/PasscodeContext";

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
  const [editingCell, setEditingCell] = useState<{ watchId: string; monthIndex: number } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const { requestVerification } = usePasscode();
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

  const handleCellClick = (watchId: string, monthIndex: number, currentValue: number) => {
    requestVerification(() => {
      setEditingCell({ watchId, monthIndex });
      setEditValue(currentValue > 0 ? currentValue.toString() : "");
    });
  };

  const handleCellUpdate = async (watchId: string, monthIndex: number) => {
    const newValue = parseFloat(editValue);
    
    if (isNaN(newValue) || newValue < 0) {
      toast.error("Please enter a valid number");
      setEditingCell(null);
      return;
    }

    try {
      // Get the first day of the month
      const currentYear = new Date().getFullYear();
      const wearDate = new Date(currentYear, monthIndex, 1).toISOString().split('T')[0];
      
      // Check if an entry exists for this watch and month
      const { data: existingEntries } = await supabase
        .from('wear_entries')
        .select('*')
        .eq('watch_id', watchId)
        .gte('wear_date', `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-01`)
        .lt('wear_date', `${currentYear}-${String(monthIndex + 2).padStart(2, '0')}-01`);

      if (newValue === 0) {
        // Delete all entries for this month if value is 0
        if (existingEntries && existingEntries.length > 0) {
          const { error } = await supabase
            .from('wear_entries')
            .delete()
            .in('id', existingEntries.map(e => e.id));
          
          if (error) throw error;
          toast.success("Wear entry removed");
        }
      } else if (existingEntries && existingEntries.length > 0) {
        // Update the first existing entry and delete others
        const { error } = await supabase
          .from('wear_entries')
          .update({ days: newValue })
          .eq('id', existingEntries[0].id);
        
        if (error) throw error;

        // Delete other entries for this month
        if (existingEntries.length > 1) {
          await supabase
            .from('wear_entries')
            .delete()
            .in('id', existingEntries.slice(1).map(e => e.id));
        }
        
        toast.success("Wear entry updated");
      } else {
        // Create new entry
        const { error } = await supabase
          .from('wear_entries')
          .insert({
            watch_id: watchId,
            wear_date: wearDate,
            days: newValue,
          });
        
        if (error) throw error;
        toast.success("Wear entry added");
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating wear entry:', error);
      toast.error("Failed to update wear entry");
    }

    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, watchId: string, monthIndex: number) => {
    if (e.key === 'Enter') {
      handleCellUpdate(watchId, monthIndex);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

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
                    const isEditing = editingCell?.watchId === watch.id && editingCell?.monthIndex === monthIndex;
                    
                    return (
                      <TableCell 
                        key={monthIndex} 
                        className="text-center text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                        style={{
                          backgroundColor: days > 0 ? `${watchColorMap.get(watchKey)}20` : 'transparent',
                          fontWeight: days > 0 ? '600' : 'normal',
                        }}
                        onClick={() => !isEditing && handleCellClick(watch.id, monthIndex, days)}
                      >
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellUpdate(watch.id, monthIndex)}
                            onKeyDown={(e) => handleKeyDown(e, watch.id, monthIndex)}
                            className="w-16 h-7 text-center p-1"
                            autoFocus
                            step="0.5"
                            min="0"
                          />
                        ) : (
                          days > 0 ? days.toFixed(1) : '-'
                        )}
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
