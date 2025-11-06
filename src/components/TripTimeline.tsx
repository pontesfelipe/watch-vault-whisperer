import { Trip } from "@/types/watch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Palmtree } from "lucide-react";

interface TripTimelineProps {
  trips: Trip[];
  limit?: number;
}

export const TripTimeline = ({ trips, limit }: TripTimelineProps) => {
  const displayTrips = limit ? trips.slice(0, limit) : trips;

  return (
    <div className="space-y-4">
      {displayTrips.map((trip, index) => (
        <Card key={index} className="border-border bg-card p-6 hover:shadow-[var(--shadow-luxury)] transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {trip.purpose === "Vacation" ? (
                <Palmtree className="w-5 h-5 text-primary" />
              ) : (
                <Briefcase className="w-5 h-5 text-primary" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">{trip.location}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{trip.startDate}</span>
                  </div>
                </div>
                <Badge variant={trip.purpose === "Vacation" ? "default" : "secondary"}>
                  {trip.purpose}
                </Badge>
              </div>
              
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{trip.watch}</span>
                  <span className="mx-2">•</span>
                  <span>{trip.days} {trip.days === 1 ? 'day' : 'days'}</span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
