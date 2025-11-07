-- Add detailed watch specifications columns
ALTER TABLE public.watches
ADD COLUMN case_size TEXT,
ADD COLUMN lug_to_lug_size TEXT,
ADD COLUMN caseback_material TEXT,
ADD COLUMN movement TEXT,
ADD COLUMN has_sapphire BOOLEAN;