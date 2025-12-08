
-- Add username and location fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add trade match scope to user_preferences
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS trade_match_scope TEXT DEFAULT 'global';

-- Create index for username lookup
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles(username) WHERE username IS NOT NULL;

-- Update check_trade_matches function to respect location preferences
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
  owner_profile RECORD;
  wishlist_user_profile RECORD;
  wishlist_user_prefs RECORD;
  location_match BOOLEAN;
BEGIN
  -- Only check if watch is being marked as available for trade
  IF NEW.available_for_trade = true AND (OLD.available_for_trade IS NULL OR OLD.available_for_trade = false) THEN
    -- Normalize the watch brand and model
    watch_brand_lower := lower(trim(NEW.brand));
    watch_model_lower := lower(trim(NEW.model));
    
    -- Get owner profile for location matching
    SELECT * INTO owner_profile FROM public.profiles WHERE id = NEW.user_id;
    
    -- Find matching wishlist items from other users using fuzzy matching
    FOR wishlist_record IN
      SELECT w.id as wishlist_id, w.user_id as wishlist_user_id, w.brand, w.model
      FROM public.wishlist w
      WHERE w.user_id != NEW.user_id
    LOOP
      -- Get wishlist user's profile and preferences
      SELECT * INTO wishlist_user_profile FROM public.profiles WHERE id = wishlist_record.wishlist_user_id;
      SELECT * INTO wishlist_user_prefs FROM public.user_preferences WHERE user_id = wishlist_record.wishlist_user_id;
      
      -- Check location match based on preferences
      location_match := true;
      IF wishlist_user_prefs.trade_match_scope IS NOT NULL THEN
        CASE wishlist_user_prefs.trade_match_scope
          WHEN 'same_city' THEN
            location_match := (owner_profile.country = wishlist_user_profile.country 
                              AND owner_profile.state = wishlist_user_profile.state 
                              AND owner_profile.city = wishlist_user_profile.city);
          WHEN 'same_state' THEN
            location_match := (owner_profile.country = wishlist_user_profile.country 
                              AND owner_profile.state = wishlist_user_profile.state);
          WHEN 'same_country' THEN
            location_match := (owner_profile.country = wishlist_user_profile.country);
          ELSE
            location_match := true; -- global
        END CASE;
      END IF;
      
      IF NOT location_match THEN
        CONTINUE;
      END IF;
      
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
