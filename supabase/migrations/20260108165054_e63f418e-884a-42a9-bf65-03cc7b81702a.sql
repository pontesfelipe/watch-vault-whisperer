-- Add avatar_color column to profiles for custom color selection
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_color TEXT;

-- Update existing profiles to have null avatar_color (will use auto-generated color)
-- No need to set default, null means use auto-generated color