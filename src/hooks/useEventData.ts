import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EventWatch {
  watchId: string;
  brand: string;
  model: string;
  days: number;
}

interface Event {
  id: string;
  start_date: string;
  location: string;
  days: number;
  purpose: string;
  linkedWatches: EventWatch[];
}

export const useEventData = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const fetchData = async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch events
      let eventQuery = supabase.from('events').select('*');
      if (!isAdmin) {
        eventQuery = eventQuery.eq('user_id', user.id);
      }
      const eventResult = await eventQuery.order('start_date', { ascending: false });
      
      if (!eventResult.data) {
        setEvents([]);
        setLoading(false);
        return;
      }

      // Fetch wear entries with watch info for all events
      const eventIds = eventResult.data.map(e => e.id);
      const { data: wearData } = await supabase
        .from('wear_entries')
        .select('event_id, watch_id, days, watches(id, brand, model)')
        .in('event_id', eventIds);

      // Group wear entries by event
      const wearByEvent: Record<string, EventWatch[]> = {};
      wearData?.forEach((entry: any) => {
        if (entry.event_id && entry.watches) {
          if (!wearByEvent[entry.event_id]) {
            wearByEvent[entry.event_id] = [];
          }
          wearByEvent[entry.event_id].push({
            watchId: entry.watches.id,
            brand: entry.watches.brand,
            model: entry.watches.model,
            days: entry.days,
          });
        }
      });

      // Combine events with their linked watches
      const eventsWithWatches: Event[] = eventResult.data.map(event => ({
        id: event.id,
        start_date: event.start_date,
        location: event.location,
        days: event.days,
        purpose: event.purpose,
        linkedWatches: wearByEvent[event.id] || [],
      }));

      setEvents(eventsWithWatches);
    } catch (error) {
      console.error("Error fetching event data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isAdmin]);

  return { events, loading, refetch: fetchData };
};
