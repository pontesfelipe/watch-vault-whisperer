-- Add new fields to watches table for warranty and resale price
ALTER TABLE watches 
ADD COLUMN average_resale_price numeric,
ADD COLUMN warranty_date date,
ADD COLUMN warranty_card_url text;

-- Create storage bucket for warranty cards
INSERT INTO storage.buckets (id, name, public)
VALUES ('warranty-cards', 'warranty-cards', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for warranty cards storage
CREATE POLICY "Anyone can view warranty cards"
ON storage.objects FOR SELECT
USING (bucket_id = 'warranty-cards');

CREATE POLICY "Anyone can upload warranty cards"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'warranty-cards');

CREATE POLICY "Anyone can update warranty cards"
ON storage.objects FOR UPDATE
USING (bucket_id = 'warranty-cards');

CREATE POLICY "Anyone can delete warranty cards"
ON storage.objects FOR DELETE
USING (bucket_id = 'warranty-cards');