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
  const { user, isAdmin } = useAuth();

  const fetchData = async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const query: any = (supabase.from('events' as any) as any).select('*');
      
      if (!isAdmin) {
        query.eq('user_id', user.id);
      }
      
      const result = await query.order('start_date', { ascending: false });

      if (result.data) setEvents(result.data);
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
