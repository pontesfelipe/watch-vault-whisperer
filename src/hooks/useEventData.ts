import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  start_date: string;
  location: string;
  watch_id?: string;
  days: number;
  purpose: string;
}

export const useEventData = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: false });

      if (result.data) setEvents(result.data);
    } catch (error) {
      console.error("Error fetching event data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { events, loading, refetch: fetchData };
};
