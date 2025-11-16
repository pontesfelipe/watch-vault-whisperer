-- Add sort_order column to watches table
ALTER TABLE public.watches 
ADD COLUMN sort_order integer;

-- Set initial sort_order values based on current alphabetical order (brand, then model)
WITH ordered_watches AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id, collection_id ORDER BY brand, model) as row_num
  FROM public.watches
)
UPDATE public.watches
SET sort_order = ordered_watches.row_num
FROM ordered_watches
WHERE watches.id = ordered_watches.id;

-- Make sort_order NOT NULL with default value
ALTER TABLE public.watches 
ALTER COLUMN sort_order SET NOT NULL,
ALTER COLUMN sort_order SET DEFAULT 0;

-- Create index for better performance
CREATE INDEX idx_watches_sort_order ON public.watches(collection_id, sort_order);