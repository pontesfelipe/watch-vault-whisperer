-- Add new column for watch days distribution
ALTER TABLE public.trips ADD COLUMN watch_days jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.events ADD COLUMN watch_days jsonb DEFAULT '{}'::jsonb;

-- Migrate existing data: convert array to jsonb object with 1 day per watch
UPDATE public.trips 
SET watch_days = (
  SELECT jsonb_object_agg(elem, 1)
  FROM unnest(watch_model) AS elem
)
WHERE watch_model IS NOT NULL AND array_length(watch_model, 1) > 0;

UPDATE public.events 
SET watch_days = (
  SELECT jsonb_object_agg(elem, 1)
  FROM unnest(watch_model) AS elem
)
WHERE watch_model IS NOT NULL AND array_length(watch_model, 1) > 0;

-- Drop old column and rename new one
ALTER TABLE public.trips DROP COLUMN watch_model;
ALTER TABLE public.trips RENAME COLUMN watch_days TO watch_model;

ALTER TABLE public.events DROP COLUMN watch_model;
ALTER TABLE public.events RENAME COLUMN watch_days TO watch_model;