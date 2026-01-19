-- Create a table to store feature toggles per collection type
CREATE TABLE public.collection_feature_toggles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_type TEXT NOT NULL CHECK (collection_type IN ('watches', 'sneakers', 'purses')),
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_type, feature_key)
);

-- Enable RLS
ALTER TABLE public.collection_feature_toggles ENABLE ROW LEVEL SECURITY;

-- Only admins can modify feature toggles
CREATE POLICY "Admins can update feature toggles"
ON public.collection_feature_toggles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert feature toggles"
ON public.collection_feature_toggles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete feature toggles"
ON public.collection_feature_toggles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow all authenticated users to read (for feature flag checks in the app)
CREATE POLICY "Authenticated users can read feature toggles"
ON public.collection_feature_toggles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_collection_feature_toggles_updated_at
BEFORE UPDATE ON public.collection_feature_toggles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default feature toggles for all collection types and features
INSERT INTO public.collection_feature_toggles (collection_type, feature_key, feature_name, is_enabled) VALUES
-- Watches features
('watches', 'water_tracking', 'Water Tracking', true),
('watches', 'movement_specs', 'Movement Specifications', true),
('watches', 'warranty_tracking', 'Warranty Tracking', true),
('watches', 'wear_tracking', 'Wear Tracking', true),
('watches', 'ai_analysis', 'AI Analysis', true),
('watches', 'price_tracking', 'Price Tracking', true),
('watches', 'depreciation', 'Depreciation Charts', true),
('watches', 'trade_matching', 'Trade Matching', true),
-- Sneakers features
('sneakers', 'condition_grading', 'Condition Grading', true),
('sneakers', 'box_status', 'Box Status Tracking', true),
('sneakers', 'og_all_tracking', 'OG All Tracking', true),
('sneakers', 'collaboration_tracking', 'Collaboration Tracking', true),
('sneakers', 'wear_tracking', 'Wear Tracking', true),
('sneakers', 'ai_analysis', 'AI Analysis', true),
('sneakers', 'price_tracking', 'Price Tracking', true),
('sneakers', 'depreciation', 'Depreciation Charts', true),
('sneakers', 'trade_matching', 'Trade Matching', true),
-- Purses features
('purses', 'authenticity_tracking', 'Authenticity Tracking', true),
('purses', 'size_breakdown', 'Size Breakdown', true),
('purses', 'material_tracking', 'Material Tracking', true),
('purses', 'warranty_tracking', 'Warranty Tracking', true),
('purses', 'wear_tracking', 'Wear Tracking', true),
('purses', 'ai_analysis', 'AI Analysis', true),
('purses', 'price_tracking', 'Price Tracking', true),
('purses', 'depreciation', 'Depreciation Charts', true),
('purses', 'trade_matching', 'Trade Matching', true);