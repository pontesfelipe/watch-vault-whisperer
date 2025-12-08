import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TripWatch {
  watchId: string;
  brand: string;
  model: string;
  days: number;
}

interface Trip {
  id: string;
  start_date: string;
  location: string;
  days: number;
  purpose: string;
  notes?: string | null;
  linkedWatches: TripWatch[];
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
      // Fetch trips
      let tripQuery = supabase.from('trips').select('*');
      if (!isAdmin) {
        tripQuery = tripQuery.eq('user_id', user.id);
      }
      const tripResult = await tripQuery.order('start_date', { ascending: false });
      
      if (!tripResult.data) {
        setTrips([]);
        setLoading(false);
        return;
      }

      // Fetch wear entries with watch info for all trips
      const tripIds = tripResult.data.map(t => t.id);
      const { data: wearData } = await supabase
        .from('wear_entries')
        .select('trip_id, watch_id, days, watches(id, brand, model)')
        .in('trip_id', tripIds);

      // Group wear entries by trip
      const wearByTrip: Record<string, TripWatch[]> = {};
      wearData?.forEach((entry: any) => {
        if (entry.trip_id && entry.watches) {
          if (!wearByTrip[entry.trip_id]) {
            wearByTrip[entry.trip_id] = [];
          }
          wearByTrip[entry.trip_id].push({
            watchId: entry.watches.id,
            brand: entry.watches.brand,
            model: entry.watches.model,
            days: entry.days,
          });
        }
      });

      // Combine trips with their linked watches
      const tripsWithWatches: Trip[] = tripResult.data.map(trip => ({
        id: trip.id,
        start_date: trip.start_date,
        location: trip.location,
        days: trip.days,
        purpose: trip.purpose,
        notes: trip.notes,
        linkedWatches: wearByTrip[trip.id] || [],
      }));

      setTrips(tripsWithWatches);
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
