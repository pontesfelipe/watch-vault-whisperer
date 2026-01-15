-- Add default_collection_id to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN default_collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL;