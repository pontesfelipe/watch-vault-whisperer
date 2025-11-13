import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Event {
  id: string;
  start_date: string;
  location: string;
  watch_model?: any;
  days: number;
  purpose: string;
}

export const useEventData = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
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
  }, [user]);

  return { events, loading, refetch: fetchData };
};
