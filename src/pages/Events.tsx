import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripTimeline } from "@/components/TripTimeline";
import { QuickAddWearDialog } from "@/components/QuickAddWearDialog";
import { useEventData } from "@/hooks/useEventData";
import { useWatchData } from "@/hooks/useWatchData";

const Events = () => {
  const { events, loading: eventLoading, refetch } = useEventData();
  const { watches, loading: watchLoading } = useWatchData();

  if (eventLoading || watchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-textMuted">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-textMain">
            Special Events
          </h1>
          <p className="text-sm text-textMuted mt-1">
            Remember significant moments with your watches
          </p>
        </div>
        <QuickAddWearDialog 
          watches={watches} 
          onSuccess={refetch}
        />
      </div>

      <TripTimeline
        trips={events.map((event) => ({
          id: event.id,
          startDate: event.start_date,
          location: event.location,
          watch: (event.watch_model as Record<string, number>) || {},
          days: event.days,
          purpose: event.purpose,
        }))}
        type="event"
        watches={watches}
        onUpdate={refetch}
      />
    </div>
  );
};

export default Events;
