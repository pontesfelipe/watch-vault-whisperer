import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets } from "lucide-react";

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
}

const getActivityColor = (activityType: string) => {
  const colors: Record<string, string> = {
    Pool: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "Hot tub": "bg-red-500/10 text-red-500 border-red-500/20",
    Lake: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    Ocean: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    Beach: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Swimming: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Diving: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    Snorkeling: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    Shower: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    Rain: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };
  return colors[activityType] || "bg-primary/10 text-primary border-primary/20";
};

export const WaterUsageList = ({ usages, watches }: WaterUsageListProps) => {
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
    <div className="space-y-3">
      {usages.map((entry) => {
        const watch = watches.find(w => w.id === entry.watch_id);
        if (!watch) return null;
        
        return (
        <Card key={entry.id} className="border-border bg-card p-4 hover:shadow-md transition-all duration-300">
          <div className="flex items-start gap-4">
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
                  {entry.notes}
                </p>
              )}
            </div>
          </div>
        </Card>
        );
      })}
    </div>
  );
};
