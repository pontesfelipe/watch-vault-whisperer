-- Add unique constraint to prevent duplicate wear entries for the same watch on the same date
ALTER TABLE wear_entries 
ADD CONSTRAINT wear_entries_watch_date_user_unique 
UNIQUE (watch_id, wear_date, user_id);