-- Persist last selected collection across devices
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS last_selected_collection_id uuid;

DO $$
BEGIN
  ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_last_selected_collection_id_fkey
  FOREIGN KEY (last_selected_collection_id)
  REFERENCES public.collections(id)
  ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_preferences_last_selected_collection_id
  ON public.user_preferences(last_selected_collection_id);

-- Optional backfill: if a user had a default set but no last selection yet
UPDATE public.user_preferences
SET last_selected_collection_id = default_collection_id
WHERE last_selected_collection_id IS NULL
  AND default_collection_id IS NOT NULL;