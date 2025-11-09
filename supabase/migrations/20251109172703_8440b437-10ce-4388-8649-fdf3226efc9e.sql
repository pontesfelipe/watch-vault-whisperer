-- Create wishlist table
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  dial_colors TEXT NOT NULL,
  rank INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  is_ai_suggested BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  taste_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for wishlist
CREATE POLICY "Anyone can view wishlist"
ON public.wishlist
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert wishlist"
ON public.wishlist
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update wishlist"
ON public.wishlist
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete wishlist"
ON public.wishlist
FOR DELETE
USING (true);

-- Create policies for user_preferences
CREATE POLICY "Anyone can view preferences"
ON public.user_preferences
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update preferences"
ON public.user_preferences
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete preferences"
ON public.user_preferences
FOR DELETE
USING (true);

-- Create trigger for wishlist updated_at
CREATE TRIGGER update_wishlist_updated_at
BEFORE UPDATE ON public.wishlist
FOR EACH ROW
EXECUTE FUNCTION public.update_watches_updated_at();

-- Create trigger for user_preferences updated_at
CREATE TRIGGER update_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_watches_updated_at();