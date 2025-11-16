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
import { Button } from "@/components/ui/button";
import { usePasscode } from "@/contexts/PasscodeContext";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

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
  updated_at?: string;
}

interface MonthlyWearGridProps {
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

export const MonthlyWearGrid = ({ watches, wearEntries, onDataChange }: MonthlyWearGridProps) => {
  const [editingCell, setEditingCell] = useState<{ watchId: string; monthIndex: number } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const { requestVerification } = usePasscode();
  const [gridEditable, setGridEditable] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectionStart, setSelectionStart] = useState<{ watchId: string; monthIndex: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ watchId: string; monthIndex: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
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
  
  // Calculate monthly breakdown by watch
  const monthlyBreakdown = Array(12).fill(0).map(() => ({})) as Array<Record<string, number>>;
  const watchTotals = new Map<string, number>();
  
  filteredWearEntries.forEach((entry) => {
    const date = new Date(entry.wear_date);
    const monthIndex = date.getMonth();
    const watch = watches.find(w => w.id === entry.watch_id);
    
    if (watch) {
      const watchKey = `${watch.brand} ${watch.model}`;
      monthlyBreakdown[monthIndex][watchKey] = (monthlyBreakdown[monthIndex][watchKey] || 0) + entry.days;
      watchTotals.set(watch.id, (watchTotals.get(watch.id) || 0) + entry.days);
    }
  });

  // Get color map for all watches to ensure consistent colors even for unworn watches
  const watchColorMap = new Map<string, string>();
  watches.forEach((watch, index) => {
    watchColorMap.set(`${watch.brand} ${watch.model}`, WATCH_COLORS[index % WATCH_COLORS.length]);
  });

  // Calculate monthly totals by summing all watch-days
  // Calculate monthly totals by summing all watch-days (allows > days-in-month if multiple watches per day)
  const monthlyTotals = monthlyBreakdown.map(breakdown => 
    Object.values(breakdown).reduce((sum, days) => sum + days, 0)
  );

  const handleCellClick = (watchId: string, monthIndex: number, currentValue: number) => {
    if (!gridEditable) return;
    setEditingCell({ watchId, monthIndex });
    setEditValue(currentValue > 0 ? currentValue.toFixed(1) : "");
  };

  const handleCellUpdate = async (watchId: string, monthIndex: number) => {
    if (isSaving) return;

    const cleaned = editValue.replace(',', '.');
    const newValue = parseFloat(cleaned);
    
    if (isNaN(newValue) || newValue < 0) {
      toast.error("Please enter a valid number");
      setEditingCell(null);
      return;
    }

    const rounded = Math.round(newValue * 2) / 2;

    setIsSaving(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Use the selected year, not "now"
      const year = parseInt(selectedYear, 10);
      const startOfMonthDate = new Date(year, monthIndex, 1);
      const startOfNextMonthDate = new Date(year, monthIndex + 1, 1);

      // Fetch existing entries for this watch and month
      const { data: existingEntries, error: fetchErr } = await supabase
        .from('wear_entries')
        .select('id')
        .eq('watch_id', watchId)
        .gte('wear_date', format(startOfMonthDate, 'yyyy-MM-dd'))
        .lt('wear_date', format(startOfNextMonthDate, 'yyyy-MM-dd'));

      if (fetchErr) throw fetchErr;

      // Always clear existing entries for that watch/month first
      if (existingEntries && existingEntries.length > 0) {
        const { error: delOldErr } = await supabase
          .from('wear_entries')
          .delete()
          .in('id', existingEntries.map(e => e.id));
        if (delOldErr) throw delOldErr;
      }

      if (rounded > 0) {
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const fullDays = Math.floor(rounded);
        const remainder = +(rounded - fullDays).toFixed(1); // 0 or 0.5

        const inserts: { watch_id: string; wear_date: string; days: number; user_id: string }[] = [];

        // Distribute full-day wears one per calendar day, cycling if needed
        for (let i = 0; i < fullDays; i++) {
          const day = (i % daysInMonth) + 1;
          const date = new Date(year, monthIndex, day);
          inserts.push({
            watch_id: watchId,
            wear_date: format(date, 'yyyy-MM-dd'),
            days: 1,
            user_id: user.id,
          });
        }

        // Add the remaining half-day if present
        if (remainder > 0) {
          const day = ((fullDays) % daysInMonth) + 1;
          const date = new Date(year, monthIndex, day);
          inserts.push({
            watch_id: watchId,
            wear_date: format(date, 'yyyy-MM-dd'),
            days: remainder,
            user_id: user.id,
          });
        }

        if (inserts.length > 0) {
          const { error: insertErr } = await supabase
            .from('wear_entries')
            .insert(inserts);
          if (insertErr) throw insertErr;
        }

        toast.success('Wear entries saved');
      } else {
        // Nothing to insert, entries were cleared above
        toast.success('Wear entries cleared');
      }

      // Trigger data refresh
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error('Error updating wear entry:', error);
      toast.error("Failed to update wear entry");
    } finally {
      setIsSaving(false);
    }

    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, watchId: string, monthIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellUpdate(watchId, monthIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
    }
  };

  // Get selected cell range
  const getSelectedRange = () => {
    if (!selectionStart || !selectionEnd) return null;
    
    const startWatchIdx = watches.findIndex(w => w.id === selectionStart.watchId);
    const endWatchIdx = watches.findIndex(w => w.id === selectionEnd.watchId);
    const minWatchIdx = Math.min(startWatchIdx, endWatchIdx);
    const maxWatchIdx = Math.max(startWatchIdx, endWatchIdx);
    
    const minMonth = Math.min(selectionStart.monthIndex, selectionEnd.monthIndex);
    const maxMonth = Math.max(selectionStart.monthIndex, selectionEnd.monthIndex);
    
    return { minWatchIdx, maxWatchIdx, minMonth, maxMonth };
  };

  // Check if cell is in selection
  const isCellSelected = (watchId: string, monthIndex: number) => {
    const range = getSelectedRange();
    if (!range) return false;
    
    const watchIdx = watches.findIndex(w => w.id === watchId);
    return watchIdx >= range.minWatchIdx && watchIdx <= range.maxWatchIdx &&
           monthIndex >= range.minMonth && monthIndex <= range.maxMonth;
  };

  // Handle copy
  const handleCopy = (e: React.ClipboardEvent) => {
    if (!gridEditable || !selectionStart || !selectionEnd) return;
    
    const range = getSelectedRange();
    if (!range) return;
    
    e.preventDefault();
    
    const rows: string[] = [];
    for (let i = range.minWatchIdx; i <= range.maxWatchIdx; i++) {
      const watch = watches[i];
      const watchKey = `${watch.brand} ${watch.model}`;
      const cells: string[] = [];
      
      for (let m = range.minMonth; m <= range.maxMonth; m++) {
        const days = monthlyBreakdown[m][watchKey] || 0;
        cells.push(days > 0 ? days.toFixed(1) : '0');
      }
      rows.push(cells.join('\t'));
    }
    
    e.clipboardData.setData('text/plain', rows.join('\n'));
    toast.success(`Copied ${rows.length} row(s)`);
  };

  // Handle paste
  const handlePaste = async (e: React.ClipboardEvent) => {
    if (!gridEditable || !selectionStart) return;
    
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const rows = text.split('\n').filter(r => r.trim());
    
    const startWatchIdx = watches.findIndex(w => w.id === selectionStart.watchId);
    if (startWatchIdx === -1) return;
    
    const updates: Array<{ watchId: string; monthIndex: number; value: number }> = [];
    
    rows.forEach((row, rowOffset) => {
      const cells = row.split('\t');
      const watchIdx = startWatchIdx + rowOffset;
      
      if (watchIdx < watches.length) {
        cells.forEach((cell, colOffset) => {
          const monthIndex = selectionStart.monthIndex + colOffset;
          if (monthIndex < 12) {
            const value = parseFloat(cell.replace(',', '.'));
            if (!isNaN(value) && value >= 0) {
              updates.push({
                watchId: watches[watchIdx].id,
                monthIndex,
                value: Math.round(value * 2) / 2
              });
            }
          }
        });
      }
    });
    
    if (updates.length === 0) return;
    
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      for (const update of updates) {
        const year = parseInt(selectedYear, 10);
        const startOfMonthDate = new Date(year, update.monthIndex, 1);
        const startOfNextMonthDate = new Date(year, update.monthIndex + 1, 1);
        
        const { data: existingEntries } = await supabase
          .from('wear_entries')
          .select('id')
          .eq('watch_id', update.watchId)
          .gte('wear_date', format(startOfMonthDate, 'yyyy-MM-dd'))
          .lt('wear_date', format(startOfNextMonthDate, 'yyyy-MM-dd'));
        
        if (existingEntries && existingEntries.length > 0) {
          await supabase
            .from('wear_entries')
            .delete()
            .in('id', existingEntries.map(e => e.id));
        }
        
        if (update.value > 0) {
          const daysInMonth = new Date(year, update.monthIndex + 1, 0).getDate();
          const fullDays = Math.floor(update.value);
          const remainder = +(update.value - fullDays).toFixed(1);
          
          const inserts: { watch_id: string; wear_date: string; days: number; user_id: string }[] = [];
          
          for (let i = 0; i < fullDays; i++) {
            const day = (i % daysInMonth) + 1;
            const date = new Date(year, update.monthIndex, day);
            inserts.push({
              watch_id: update.watchId,
              wear_date: format(date, 'yyyy-MM-dd'),
              days: 1,
              user_id: user.id,
            });
          }
          
          if (remainder > 0) {
            const day = ((fullDays) % daysInMonth) + 1;
            const date = new Date(year, update.monthIndex, day);
            inserts.push({
              watch_id: update.watchId,
              wear_date: format(date, 'yyyy-MM-dd'),
              days: remainder,
              user_id: user.id,
            });
          }
          
          if (inserts.length > 0) {
            await supabase.from('wear_entries').insert(inserts);
          }
        }
      }
      
      toast.success(`Pasted ${updates.length} cell(s)`);
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error pasting:', error);
      toast.error("Failed to paste data");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle fill down
  const handleFillDown = async () => {
    if (!gridEditable || !selectionStart || !selectionEnd) return;
    
    const range = getSelectedRange();
    if (!range || range.minWatchIdx === range.maxWatchIdx) return;
    
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Get values from first row
      const firstWatch = watches[range.minWatchIdx];
      const firstWatchKey = `${firstWatch.brand} ${firstWatch.model}`;
      const sourceValues: number[] = [];
      
      for (let m = range.minMonth; m <= range.maxMonth; m++) {
        sourceValues.push(monthlyBreakdown[m][firstWatchKey] || 0);
      }
      
      // Apply to remaining rows
      for (let i = range.minWatchIdx + 1; i <= range.maxWatchIdx; i++) {
        const watch = watches[i];
        
        for (let colIdx = 0; colIdx < sourceValues.length; colIdx++) {
          const monthIndex = range.minMonth + colIdx;
          const value = sourceValues[colIdx];
          
          const year = parseInt(selectedYear, 10);
          const startOfMonthDate = new Date(year, monthIndex, 1);
          const startOfNextMonthDate = new Date(year, monthIndex + 1, 1);
          
          const { data: existingEntries } = await supabase
            .from('wear_entries')
            .select('id')
            .eq('watch_id', watch.id)
            .gte('wear_date', format(startOfMonthDate, 'yyyy-MM-dd'))
            .lt('wear_date', format(startOfNextMonthDate, 'yyyy-MM-dd'));
          
          if (existingEntries && existingEntries.length > 0) {
            await supabase
              .from('wear_entries')
              .delete()
              .in('id', existingEntries.map(e => e.id));
          }
          
          if (value > 0) {
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
            const fullDays = Math.floor(value);
            const remainder = +(value - fullDays).toFixed(1);
            
            const inserts: { watch_id: string; wear_date: string; days: number; user_id: string }[] = [];
            
            for (let j = 0; j < fullDays; j++) {
              const day = (j % daysInMonth) + 1;
              const date = new Date(year, monthIndex, day);
              inserts.push({
                watch_id: watch.id,
                wear_date: format(date, 'yyyy-MM-dd'),
                days: 1,
                user_id: user.id,
              });
            }
            
            if (remainder > 0) {
              const day = ((fullDays) % daysInMonth) + 1;
              const date = new Date(year, monthIndex, day);
              inserts.push({
                watch_id: watch.id,
                wear_date: format(date, 'yyyy-MM-dd'),
                days: remainder,
                user_id: user.id,
              });
            }
            
            if (inserts.length > 0) {
              await supabase.from('wear_entries').insert(inserts);
            }
          }
        }
      }
      
      toast.success('Filled down successfully');
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error('Error filling down:', error);
      toast.error("Failed to fill down");
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <Card className="border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground">
          Monthly Wear Distribution - Last Update: {lastUpdateDate}
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
            <span className="text-sm text-muted-foreground">Edit entries</span>
            <Switch
              checked={gridEditable}
              onCheckedChange={(v) => {
                if (v) {
                  requestVerification(() => setGridEditable(true));
                } else {
                  setGridEditable(false);
                }
              }}
            />
          </div>
        </div>
      </div>
      
      {gridEditable && selectionStart && selectionEnd && getSelectedRange() && (
        <div className="mb-4 flex gap-2">
          <Button
            onClick={handleFillDown}
            disabled={isSaving}
            size="sm"
            variant="outline"
          >
            Fill Down
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            Select cells and use Ctrl+C to copy, Ctrl+V to paste
          </span>
        </div>
      )}
      
      <div 
        className="overflow-x-auto"
        onCopy={handleCopy}
        onPaste={handlePaste}
        tabIndex={-1}
      >
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
                        className={`text-center text-sm transition-colors ${gridEditable ? 'cursor-pointer hover:bg-accent' : ''} ${
                          isCellSelected(watch.id, monthIndex) ? 'ring-2 ring-primary ring-inset' : ''
                        }`}
                        style={{
                          backgroundColor: days > 0 ? `${watchColorMap.get(watchKey)}20` : 'transparent',
                          fontWeight: days > 0 ? '600' : 'normal',
                        }}
                        onMouseDown={() => {
                          if (gridEditable && !isEditing) {
                            setSelectionStart({ watchId: watch.id, monthIndex });
                            setSelectionEnd({ watchId: watch.id, monthIndex });
                            setIsSelecting(true);
                          }
                        }}
                        onMouseEnter={() => {
                          if (isSelecting && selectionStart) {
                            setSelectionEnd({ watchId: watch.id, monthIndex });
                          }
                        }}
                        onMouseUp={() => setIsSelecting(false)}
                        onDoubleClick={() => { 
                          if (gridEditable && !isEditing) {
                            handleCellClick(watch.id, monthIndex, days);
                          }
                        }}
                      >
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, watch.id, monthIndex)}
                            onBlur={() => setEditingCell(null)}
                            className="w-full h-8 text-center"
                            autoFocus
                            step="0.5"
                            min="0"
                          />
                        ) : (
                          <span className={gridEditable ? 'text-primary' : ''}>
                            {days > 0 ? days.toFixed(1) : '-'}
                          </span>
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
