import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await supabase
        .from("trips")
        .select("*")
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
  }, []);

  return { trips, loading, refetch: fetchData };
};
