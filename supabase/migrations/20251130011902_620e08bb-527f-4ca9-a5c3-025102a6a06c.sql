-- Add column for AI-generated watch image
ALTER TABLE public.watches ADD COLUMN IF NOT EXISTS ai_image_url TEXT;

-- Create storage bucket for AI-generated watch images
INSERT INTO storage.buckets (id, name, public)
VALUES ('watch-images', 'watch-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to watch images
CREATE POLICY "Watch images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'watch-images');

-- Allow authenticated users to upload their own watch images
CREATE POLICY "Users can upload watch images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'watch-images' AND auth.uid() IS NOT NULL);

-- Allow users to update their own watch images
CREATE POLICY "Users can update watch images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'watch-images' AND auth.uid() IS NOT NULL);

-- Allow users to delete their own watch images
CREATE POLICY "Users can delete watch images"
ON storage.objects FOR DELETE
USING (bucket_id = 'watch-images' AND auth.uid() IS NOT NULL);