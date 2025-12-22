import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Watch {
  id: string;
  brand: string;
  model: string;
  cost: number;
  msrp?: number;
  image_url?: string;
  ai_image_url?: string;
  dial_color: string;
  case_size?: string;
  lug_to_lug_size?: string;
  caseback_material?: string;
  type: string;
  average_resale_price?: number;
  when_bought?: string;
  sort_order?: number;
  rarity?: string;
  historical_significance?: string;
  available_for_trade?: boolean;
  movement?: string;
  has_sapphire?: boolean;
  warranty_date?: string;
  warranty_card_url?: string;
  metadata_analysis_reasoning?: string;
}

interface WearEntry {
  id: string;
  watch_id: string;
  wear_date: string;
  days: number;
}

export const useWatchData = (collectionId?: string | null) => {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [wearEntries, setWearEntries] = useState<WearEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const fetchData = async () => {
    if (!user) {
      setWatches([]);
      setWearEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const watchesQuery: any = (supabase.from('watches' as any) as any).select('*');
      
      // Admins can see all watches across all collections
      // Regular users only see their own watches
      if (!isAdmin) {
        watchesQuery.eq('user_id', user.id);
      }
      
      // Filter by collection if provided (both admin and regular users)
      if (collectionId) {
        watchesQuery.eq('collection_id', collectionId);
      }
      
      // Sort by custom sort_order, then fall back to brand and model for new watches
      const watchesResult = await watchesQuery
        .order("sort_order", { ascending: true })
        .order("brand", { ascending: true })
        .order("model", { ascending: true });

      if (watchesResult.data) {
        setWatches(watchesResult.data);
        
        // Fetch wear entries for the watches in this collection
        const watchIds = watchesResult.data.map((w: Watch) => w.id);
        const wearEntriesQuery: any = (supabase.from('wear_entries' as any) as any)
          .select('*')
          .in('watch_id', watchIds);
        
        if (!isAdmin) {
          wearEntriesQuery.eq('user_id', user.id);
        }
        
        const wearEntriesResult = await wearEntriesQuery;
        if (wearEntriesResult.data) setWearEntries(wearEntriesResult.data);
      } else {
        setWatches([]);
        setWearEntries([]);
      }
    } catch (error) {
      console.error("Error fetching watch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up realtime subscription for wear_entries
    const channel = supabase
      .channel('wear_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wear_entries'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, collectionId]);

  return { watches, wearEntries, loading, refetch: fetchData };
};
