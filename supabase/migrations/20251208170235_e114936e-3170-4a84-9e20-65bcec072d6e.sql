-- Drop the existing trigger first, then function with CASCADE
DROP TRIGGER IF EXISTS check_trade_matches_trigger ON watches;
DROP FUNCTION IF EXISTS check_trade_matches() CASCADE;

-- Create improved function with fuzzy matching
CREATE OR REPLACE FUNCTION public.check_trade_matches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  wishlist_record RECORD;
  watch_brand_lower TEXT;
  watch_model_lower TEXT;
  wishlist_brand_lower TEXT;
  wishlist_model_lower TEXT;
BEGIN
  -- Only check if watch is being marked as available for trade
  IF NEW.available_for_trade = true AND (OLD.available_for_trade IS NULL OR OLD.available_for_trade = false) THEN
    -- Normalize the watch brand and model
    watch_brand_lower := lower(trim(NEW.brand));
    watch_model_lower := lower(trim(NEW.model));
    
    -- Find matching wishlist items from other users using fuzzy matching
    FOR wishlist_record IN
      SELECT w.id as wishlist_id, w.user_id as wishlist_user_id, w.brand, w.model
      FROM public.wishlist w
      WHERE w.user_id != NEW.user_id
    LOOP
      -- Normalize wishlist brand and model
      wishlist_brand_lower := lower(trim(wishlist_record.brand));
      wishlist_model_lower := lower(trim(wishlist_record.model));
      
      -- Check for fuzzy match:
      -- 1. Brand must match exactly OR one contains the other
      -- 2. Model must share significant keywords (at least one 4+ character word matches)
      IF (
        -- Brand matching: exact or contains
        (watch_brand_lower = wishlist_brand_lower OR 
         watch_brand_lower LIKE '%' || wishlist_brand_lower || '%' OR 
         wishlist_brand_lower LIKE '%' || watch_brand_lower || '%')
        AND
        -- Model matching: check if they share a significant word (4+ chars)
        EXISTS (
          SELECT 1 
          FROM unnest(string_to_array(regexp_replace(watch_model_lower, '[^a-z0-9 ]', ' ', 'g'), ' ')) AS watch_word
          WHERE length(watch_word) >= 4
          AND EXISTS (
            SELECT 1 
            FROM unnest(string_to_array(regexp_replace(wishlist_model_lower, '[^a-z0-9 ]', ' ', 'g'), ' ')) AS wishlist_word
            WHERE length(wishlist_word) >= 4
            AND watch_word = wishlist_word
          )
        )
      ) THEN
        -- Create notification if not already exists
        INSERT INTO public.trade_match_notifications (user_id, wishlist_item_id, trade_watch_id, trade_owner_id)
        VALUES (wishlist_record.wishlist_user_id, wishlist_record.wishlist_id, NEW.id, NEW.user_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER check_trade_matches_trigger
AFTER UPDATE ON watches
FOR EACH ROW
EXECUTE FUNCTION check_trade_matches();