import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droplets, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePasscode } from "@/contexts/PasscodeContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WaterUsage {
  id: string;
  watch_id: string;
  activity_date: string;
  activity_type: string;
  duration_minutes?: number;
  depth_meters?: number;
  notes?: string;
}

interface WaterUsageListProps {
  usages: WaterUsage[];
  watches: { id: string; brand: string; model: string }[];
  onUpdate: () => void;
}

const ACTIVITY_COLORS: Record<string, string> = {
  Swimming: "bg-blue-500/10 text-blue-500",
  Diving: "bg-indigo-500/10 text-indigo-500",
  Shower: "bg-cyan-500/10 text-cyan-500",
  Rain: "bg-slate-500/10 text-slate-500",
  "Washing Hands": "bg-teal-500/10 text-teal-500",
  Snorkeling: "bg-violet-500/10 text-violet-500",
  Other: "bg-gray-500/10 text-gray-500",
};

export const WaterUsageList = ({ usages, watches, onUpdate }: WaterUsageListProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isVerified } = usePasscode();
  const [selectedYear, setSelectedYear] = useState<string>("all");

  // Get available years from usages
  const availableYears = Array.from(
    new Set(usages.map(usage => new Date(usage.activity_date).getFullYear()))
  ).sort((a, b) => b - a);

  // Filter usages by year
  const filteredUsages = selectedYear === "all"
    ? usages
    : usages.filter(usage => {
        const date = new Date(usage.activity_date);
        return date.getFullYear().toString() === selectedYear;
      });

  const handleDelete = async () => {
    if (!deleteId) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("water_usage").delete().eq("id", deleteId);

      if (error) throw error;

      toast.success("Water usage entry deleted");
      setDeleteId(null);
      onUpdate();
    } catch (error) {
      console.error("Error deleting water usage:", error);
      toast.error("Failed to delete entry");
    } finally {
      setLoading(false);
    }
  };

  const getWatchName = (watchId: string) => {
    const watch = watches.find((w) => w.id === watchId);
    return watch ? `${watch.brand} ${watch.model}` : "Unknown Watch";
  };

  if (usages.length === 0) {
    return (
      <Card className="border-border bg-card p-8 text-center">
        <Droplets className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No water usage logged yet</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {usages.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Year:</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {filteredUsages.map((usage) => (
          <Card key={usage.id} className="border-border bg-card p-6 hover:shadow-[var(--shadow-luxury)] transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Droplets className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">
                      {getWatchName(usage.watch_id)}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{new Date(usage.activity_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={ACTIVITY_COLORS[usage.activity_type] || ACTIVITY_COLORS.Other}>
                      {usage.activity_type}
                    </Badge>
                    {isVerified && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(usage.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border space-y-1">
                  {usage.duration_minutes && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Duration:</span> {usage.duration_minutes} minutes
                    </p>
                  )}
                  {usage.depth_meters !== undefined && usage.depth_meters !== null && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Depth:</span> {usage.depth_meters}m
                    </p>
                  )}
                  {usage.notes && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Notes:</span> {usage.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Water Usage Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this water usage entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
