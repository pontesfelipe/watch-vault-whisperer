-- Multi-Collection Support Migration
-- This migration adds support for different collection types (watches, sneakers, purses)

-- Create collection_type enum
CREATE TYPE public.collection_type AS ENUM ('watches', 'sneakers', 'purses');

-- Add collection_type column to collections table
ALTER TABLE public.collections
ADD COLUMN collection_type public.collection_type NOT NULL DEFAULT 'watches';

-- Add collection_id to trips table for collection scoping
ALTER TABLE public.trips
ADD COLUMN collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE;

-- Add collection_id to events table for collection scoping
ALTER TABLE public.events
ADD COLUMN collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE;

-- Add collection_id to water_usage table for collection scoping
ALTER TABLE public.water_usage
ADD COLUMN collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE;

-- Add collection_id to wishlist table for collection scoping
ALTER TABLE public.wishlist
ADD COLUMN collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE;

-- Add collection_id to personal_notes table for collection scoping
ALTER TABLE public.personal_notes
ADD COLUMN collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE;

-- Add collection_id to collection_insights table for collection scoping
ALTER TABLE public.collection_insights
ADD COLUMN collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE;

-- Add collection_id to collection_gap_suggestions table for collection scoping
ALTER TABLE public.collection_gap_suggestions
ADD COLUMN collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE;

-- Create sneaker_specs table for sneaker-specific attributes
CREATE TABLE public.sneaker_specs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  shoe_size NUMERIC,
  size_type TEXT, -- US, UK, EU
  colorway TEXT,
  release_date DATE,
  retail_price NUMERIC,
  sku TEXT,
  style_code TEXT,
  collaboration TEXT,
  limited_edition BOOLEAN DEFAULT false,
  condition TEXT, -- deadstock, vnds, used
  box_included BOOLEAN DEFAULT true,
  og_all BOOLEAN DEFAULT false, -- Original All (box, receipt, laces, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purse_specs table for purse-specific attributes
CREATE TABLE public.purse_specs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  material TEXT, -- leather, canvas, synthetic, etc.
  hardware_color TEXT, -- gold, silver, rose gold, etc.
  condition TEXT, -- pristine, excellent, good, fair
  authenticity_verified BOOLEAN DEFAULT false,
  serial_number TEXT,
  dust_bag_included BOOLEAN DEFAULT false,
  authenticity_card BOOLEAN DEFAULT false,
  original_receipt BOOLEAN DEFAULT false,
  size_category TEXT, -- mini, small, medium, large
  closure_type TEXT, -- zipper, magnetic, clasp, etc.
  strap_type TEXT, -- shoulder, crossbody, top handle, clutch
  interior_color TEXT,
  number_of_compartments INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.sneaker_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purse_specs ENABLE ROW LEVEL SECURITY;

-- RLS policies for sneaker_specs
CREATE POLICY "Users can view sneaker specs for their watches"
ON public.sneaker_specs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    WHERE w.id = sneaker_specs.watch_id
    AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert sneaker specs for their watches"
ON public.sneaker_specs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.watches w
    WHERE w.id = sneaker_specs.watch_id
    AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update sneaker specs for their watches"
ON public.sneaker_specs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    WHERE w.id = sneaker_specs.watch_id
    AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete sneaker specs for their watches"
ON public.sneaker_specs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    WHERE w.id = sneaker_specs.watch_id
    AND w.user_id = auth.uid()
  )
);

-- RLS policies for purse_specs
CREATE POLICY "Users can view purse specs for their items"
ON public.purse_specs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    WHERE w.id = purse_specs.watch_id
    AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert purse specs for their items"
ON public.purse_specs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.watches w
    WHERE w.id = purse_specs.watch_id
    AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update purse specs for their items"
ON public.purse_specs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    WHERE w.id = purse_specs.watch_id
    AND w.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete purse specs for their items"
ON public.purse_specs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    WHERE w.id = purse_specs.watch_id
    AND w.user_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_sneaker_specs_updated_at
BEFORE UPDATE ON public.sneaker_specs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purse_specs_updated_at
BEFORE UPDATE ON public.purse_specs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies for trips, events, water_usage to support collection_id
-- We'll keep backward compatibility by allowing NULL collection_id for existing data

-- Add index for better query performance
CREATE INDEX idx_trips_collection_id ON public.trips(collection_id);
CREATE INDEX idx_events_collection_id ON public.events(collection_id);
CREATE INDEX idx_water_usage_collection_id ON public.water_usage(collection_id);
CREATE INDEX idx_wishlist_collection_id ON public.wishlist(collection_id);
CREATE INDEX idx_personal_notes_collection_id ON public.personal_notes(collection_id);
CREATE INDEX idx_collection_insights_collection_id ON public.collection_insights(collection_id);
CREATE INDEX idx_collection_gap_suggestions_collection_id ON public.collection_gap_suggestions(collection_id);
CREATE INDEX idx_collections_type ON public.collections(collection_type);

-- Add comments for documentation
COMMENT ON TYPE public.collection_type IS 'Supported collection types: watches, sneakers, purses';
COMMENT ON COLUMN public.collections.collection_type IS 'The type of items in this collection';
COMMENT ON TABLE public.sneaker_specs IS 'Sneaker-specific attributes for items in sneaker collections';
COMMENT ON TABLE public.purse_specs IS 'Purse-specific attributes for items in purse collections';
