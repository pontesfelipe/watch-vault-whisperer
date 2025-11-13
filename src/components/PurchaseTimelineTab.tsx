import { Calendar, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

interface Watch {
  id: string;
  brand: string;
  model: string;
  cost: number;
  when_bought?: string;
  why_bought?: string;
  created_at: string;
}

interface PurchaseTimelineTabProps {
  watches: Watch[];
}

export function PurchaseTimelineTab({ watches }: PurchaseTimelineTabProps) {
  // Sort watches by purchase date (oldest first)
  const sortedWatches = [...watches].sort((a, b) => {
    // Get comparable dates for sorting
    const getDate = (watch: Watch): Date => {
      if (watch.when_bought) {
        // Try to parse as ISO date (YYYY-MM-DD)
        const date = new Date(watch.when_bought);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      // Fallback to created_at
      return new Date(watch.created_at);
    };
    
    return getDate(a).getTime() - getDate(b).getTime();
  });

  return (
    <div className="space-y-8">
      {sortedWatches.map((watch, index) => (
        <div key={watch.id} className="relative">
          {/* Timeline connector */}
          {index !== sortedWatches.length - 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
          )}
          
          {/* Timeline item */}
          <div className="flex gap-4">
            {/* Timeline dot */}
            <div className="relative flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>

            {/* Content */}
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Watch details */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {watch.brand} {watch.model}
                      </h3>
                      {watch.when_bought && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {(() => {
                            try {
                              const date = new Date(watch.when_bought);
                              return !isNaN(date.getTime()) ? format(date, "MMMM d, yyyy") : watch.when_bought;
                            } catch {
                              return watch.when_bought;
                            }
                          })()}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <DollarSign className="h-4 w-4" />
                      {watch.cost.toLocaleString()}
                    </div>

                    {watch.why_bought && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Why I bought it</p>
                        <p className="text-sm text-muted-foreground">{watch.why_bought}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}
