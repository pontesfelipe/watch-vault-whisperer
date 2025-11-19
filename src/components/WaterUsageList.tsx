import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droplets, Eye, EyeOff, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { usePasscode } from "@/contexts/PasscodeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


interface WaterUsage {
  id: string;
  activity_date: string;
  activity_type: string;
  duration_minutes?: number;
  depth_meters?: number;
  notes?: string;
  watch_id: string;
}

interface WaterUsageListProps {
  usages: WaterUsage[];
  watches: { id: string; brand: string; model: string }[];
  onUpdate: () => void;
}

const getActivityColor = (activityType: string) => {
  const key = activityType?.trim().toLowerCase();
  const colors: Record<string, string> = {
    pool: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "hot tub": "bg-red-500/10 text-red-500 border-red-500/20",
    hottub: "bg-red-500/10 text-red-500 border-red-500/20",
    "hot-tub": "bg-red-500/10 text-red-500 border-red-500/20",
    lake: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    ocean: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    beach: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    swimming: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    diving: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    snorkeling: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    shower: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    rain: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };
  return colors[key] || "bg-primary/10 text-primary border-primary/20";
};

export const WaterUsageList = ({ usages, watches, onUpdate }: WaterUsageListProps) => {
  const { isAdmin } = useAuth();
  const { isVerified, requestVerification } = usePasscode();
  const [showLocation, setShowLocation] = useState(isAdmin);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleToggleLocation = () => {
    if (!showLocation) {
      if (isVerified) {
        setShowLocation(true);
      } else {
        requestVerification(() => {
          setShowLocation(true);
        });
      }
    } else {
      setShowLocation(false);
    }
  };

  // Auto-show location if already verified or if admin
  useEffect(() => {
    if (isVerified || isAdmin) {
      setShowLocation(true);
    }
  }, [isVerified, isAdmin]);

  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("water_usage")
        .delete()
        .in("id", Array.from(selectedItems));
      
      if (error) throw error;
      
      toast.success(`${selectedItems.size} water usage entr${selectedItems.size > 1 ? "ies" : "y"} deleted successfully`);
      setSelectedItems(new Set());
      await onUpdate(); // Wait for refresh
    } catch (error) {
      console.error("Error deleting water usage:", error);
      toast.error("Failed to delete water usage");
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === usages.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(usages.map(u => u.id)));
    }
  };

  if (usages.length === 0) {
    return (
      <Card className="border-border bg-card p-8 text-center">
        <Droplets className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">No water usage entries yet</p>
        <p className="text-sm text-muted-foreground mt-1">Start tracking water activities with your watches</p>
      </Card>
    );
  }

  return (
    <>
      {usages.length > 0 && (
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
          {(isVerified || isAdmin) && usages.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-water"
                checked={selectedItems.size === usages.length && usages.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <label htmlFor="select-all-water" className="text-sm text-muted-foreground cursor-pointer">
                Select All
              </label>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {selectedItems.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                disabled={loading}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete {selectedItems.size} Entr{selectedItems.size > 1 ? "ies" : "y"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleLocation}
              className="gap-2 text-xs"
            >
              {showLocation ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide Locations
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show Locations
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {usages.map((entry) => {
        const watch = watches.find(w => w.id === entry.watch_id);
        if (!watch) return null;
        
        return (
        <Card key={entry.id} className="border-border bg-card p-4 hover:shadow-md transition-all duration-300">
          <div className="flex items-start gap-4">
            {(isVerified || isAdmin) && (
              <Checkbox
                checked={selectedItems.has(entry.id)}
                onCheckedChange={() => toggleItemSelection(entry.id)}
                className="mt-3"
              />
            )}
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Droplets className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getActivityColor(entry.activity_type)}>
                      {entry.activity_type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(entry.activity_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                  <h4 className="font-semibold text-foreground">
                    {watch.brand} {watch.model}
                  </h4>
                </div>
              </div>
              
              <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                {entry.duration_minutes && (
                  <span>Duration: {entry.duration_minutes} min</span>
                )}
                {entry.depth_meters && (
                  <span>Depth: {entry.depth_meters}m</span>
                )}
              </div>
              
              {entry.notes && (
                <p className="text-sm text-muted-foreground mt-2 border-t border-border pt-2">
                  {showLocation ? entry.notes : "••••••"}
                </p>
              )}
            </div>
          </div>
        </Card>
        );
        })}
      </div>
    </>
  );
};
