-- Update wear_entries for daily tracking system
-- This allows multiple watches to be worn on the same day
-- but prevents duplicate entries for the same watch on the same day

-- First, drop the existing unique constraint if it exists
-- The constraint might be on (watch_id, wear_date, user_id) or similar
DO $$ 
BEGIN
    -- Drop any unique constraint on wear_entries
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'wear_entries_watch_id_wear_date_user_id_key'
    ) THEN
        ALTER TABLE wear_entries DROP CONSTRAINT wear_entries_watch_id_wear_date_user_id_key;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'wear_entries_watch_id_wear_date_key'
    ) THEN
        ALTER TABLE wear_entries DROP CONSTRAINT wear_entries_watch_id_wear_date_key;
    END IF;
END $$;

-- Add a new unique constraint that allows multiple watches per day
-- but prevents the same watch from being logged multiple times on the same day
ALTER TABLE wear_entries 
ADD CONSTRAINT wear_entries_watch_id_wear_date_unique 
UNIQUE (watch_id, wear_date);

-- Add a comment to clarify the new behavior
COMMENT ON CONSTRAINT wear_entries_watch_id_wear_date_unique ON wear_entries IS 
'Allows multiple different watches to be worn on the same day, but prevents duplicate entries for the same watch on the same date';