import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Trip {
  id: string;
  start_date: string;
  location: string;
  watch_model?: any;
  days: number;
  purpose: string;
  notes?: string | null;
}

export const useTripData = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const fetchData = async () => {
    if (!user) {
      setTrips([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const query: any = (supabase.from('trips' as any) as any).select('*');
      
      if (!isAdmin) {
        query.eq('user_id', user.id);
      }
      
      const result = await query.order('start_date', { ascending: false });

      if (result.data) setTrips(result.data);
    } catch (error) {
      console.error("Error fetching trip data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isAdmin]);

  return { trips, loading, refetch: fetchData };
};
