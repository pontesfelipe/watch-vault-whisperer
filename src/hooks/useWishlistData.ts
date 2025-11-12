import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WishlistItem {
  id: string;
  brand: string;
  model: string;
  dial_colors: string;
  rank: number;
  notes?: string;
  is_ai_suggested: boolean;
}

export const useWishlistData = () => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await supabase
        .from("wishlist")
        .select("*")
        .order("rank", { ascending: true });

      if (result.data) setWishlist(result.data);
    } catch (error) {
      console.error("Error fetching wishlist data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { wishlist, loading, refetch: fetchData };
};
