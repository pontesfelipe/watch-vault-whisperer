import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripTimeline } from "@/components/TripTimeline";
import { AddEventDialog } from "@/components/AddEventDialog";
import { useEventData } from "@/hooks/useEventData";
import { useWatchData } from "@/hooks/useWatchData";

const Events = () => {
  const { events, loading: eventLoading, refetch } = useEventData();
  const { watches, loading: watchLoading } = useWatchData();
  const [showAddEvent, setShowAddEvent] = useState(false);

  if (eventLoading || watchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Special Events
          </h1>
          <p className="text-muted-foreground">
            Remember significant moments with your watches
          </p>
        </div>
        <Button onClick={() => setShowAddEvent(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
      </div>

      <TripTimeline
        trips={events.map((event) => ({
          id: event.id,
          startDate: event.start_date,
          location: event.location,
          watch: {},
          days: event.days,
          purpose: event.purpose,
        }))}
        type="event"
        watches={watches}
        onUpdate={refetch}
      />

      <AddEventDialog 
        watches={watches} 
        onSuccess={refetch} 
        open={showAddEvent}
        onOpenChange={setShowAddEvent}
      />
    </div>
  );
};

export default Events;
