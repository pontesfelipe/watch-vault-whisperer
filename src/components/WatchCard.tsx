import { Watch } from "@/types/watch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Watch as WatchIcon, Calendar } from "lucide-react";

interface WatchCardProps {
  watch: Watch;
}

export const WatchCard = ({ watch }: WatchCardProps) => {
  return (
    <Card className="group relative overflow-hidden border-border bg-card hover:shadow-[var(--shadow-luxury)] transition-all duration-300 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-[var(--gradient-luxury)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <WatchIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg text-foreground">{watch.brand}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{watch.model}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {watch.type}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dial Color</span>
            <span className="font-medium text-foreground">{watch.dialColor}</span>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Days Worn</span>
            </div>
            <span className="text-2xl font-bold text-primary">{watch.total}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
