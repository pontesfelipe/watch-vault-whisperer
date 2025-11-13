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
}

export const useTripData = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) {
      setTrips([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });

      if (result.data) setTrips(result.data);
    } catch (error) {
      console.error("Error fetching trip data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return { trips, loading, refetch: fetchData };
};
