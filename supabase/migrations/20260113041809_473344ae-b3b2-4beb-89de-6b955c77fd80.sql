-- Multi-Collection Support Migration
-- Adds support for watches, sneakers, and purses collection types

-- Step 1: Create the collection_type enum
CREATE TYPE public.collection_type AS ENUM ('watches', 'sneakers', 'purses');

-- Step 2: Add collection_type column to collections table
ALTER TABLE public.collections 
ADD COLUMN collection_type public.collection_type NOT NULL DEFAULT 'watches';

-- Step 3: Create sneaker_specs table
CREATE TABLE public.sneaker_specs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  user_id UUID,
  colorway TEXT,
  shoe_size TEXT,
  size_type TEXT DEFAULT 'US' CHECK (size_type IN ('US', 'UK', 'EU', 'CM')),
  sku TEXT,
  style_code TEXT,
  condition TEXT DEFAULT 'used' CHECK (condition IN ('deadstock', 'vnds', 'used', 'worn')),
  box_included BOOLEAN DEFAULT false,
  og_all BOOLEAN DEFAULT false,
  collaboration TEXT,
  limited_edition BOOLEAN DEFAULT false,
  release_date DATE,
  silhouette TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 4: Create purse_specs table
CREATE TABLE public.purse_specs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  user_id UUID,
  material TEXT,
  hardware_color TEXT,
  size_category TEXT DEFAULT 'medium' CHECK (size_category IN ('mini', 'small', 'medium', 'large', 'oversized')),
  authenticity_verified BOOLEAN DEFAULT false,
  serial_number TEXT,
  dust_bag_included BOOLEAN DEFAULT false,
  closure_type TEXT,
  strap_type TEXT DEFAULT 'fixed' CHECK (strap_type IN ('fixed', 'removable', 'adjustable', 'chain', 'none')),
  box_included BOOLEAN DEFAULT false,
  authenticity_card_included BOOLEAN DEFAULT false,
  color TEXT,
  pattern TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 5: Create indexes for performance
CREATE INDEX idx_sneaker_specs_item_id ON public.sneaker_specs(item_id);
CREATE INDEX idx_sneaker_specs_user_id ON public.sneaker_specs(user_id);
CREATE INDEX idx_purse_specs_item_id ON public.purse_specs(item_id);
CREATE INDEX idx_purse_specs_user_id ON public.purse_specs(user_id);
CREATE INDEX idx_collections_type ON public.collections(collection_type);

-- Step 6: Enable RLS on new tables
ALTER TABLE public.sneaker_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purse_specs ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for sneaker_specs
CREATE POLICY "Users can view sneaker specs for their collection items"
ON public.sneaker_specs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    JOIN public.user_collections uc ON w.collection_id = uc.collection_id
    WHERE w.id = sneaker_specs.item_id AND uc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert sneaker specs for their collection items"
ON public.sneaker_specs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.watches w
    JOIN public.user_collections uc ON w.collection_id = uc.collection_id
    WHERE w.id = item_id AND uc.user_id = auth.uid() AND uc.role IN ('owner', 'editor')
  )
);

CREATE POLICY "Users can update sneaker specs for their collection items"
ON public.sneaker_specs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    JOIN public.user_collections uc ON w.collection_id = uc.collection_id
    WHERE w.id = sneaker_specs.item_id AND uc.user_id = auth.uid() AND uc.role IN ('owner', 'editor')
  )
);

CREATE POLICY "Users can delete sneaker specs for their collection items"
ON public.sneaker_specs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    JOIN public.user_collections uc ON w.collection_id = uc.collection_id
    WHERE w.id = sneaker_specs.item_id AND uc.user_id = auth.uid() AND uc.role IN ('owner', 'editor')
  )
);

-- Step 8: Create RLS policies for purse_specs
CREATE POLICY "Users can view purse specs for their collection items"
ON public.purse_specs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    JOIN public.user_collections uc ON w.collection_id = uc.collection_id
    WHERE w.id = purse_specs.item_id AND uc.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert purse specs for their collection items"
ON public.purse_specs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.watches w
    JOIN public.user_collections uc ON w.collection_id = uc.collection_id
    WHERE w.id = item_id AND uc.user_id = auth.uid() AND uc.role IN ('owner', 'editor')
  )
);

CREATE POLICY "Users can update purse specs for their collection items"
ON public.purse_specs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    JOIN public.user_collections uc ON w.collection_id = uc.collection_id
    WHERE w.id = purse_specs.item_id AND uc.user_id = auth.uid() AND uc.role IN ('owner', 'editor')
  )
);

CREATE POLICY "Users can delete purse specs for their collection items"
ON public.purse_specs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.watches w
    JOIN public.user_collections uc ON w.collection_id = uc.collection_id
    WHERE w.id = purse_specs.item_id AND uc.user_id = auth.uid() AND uc.role IN ('owner', 'editor')
  )
);

-- Step 9: Create trigger for updating updated_at
CREATE TRIGGER update_sneaker_specs_updated_at
BEFORE UPDATE ON public.sneaker_specs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purse_specs_updated_at
BEFORE UPDATE ON public.purse_specs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();