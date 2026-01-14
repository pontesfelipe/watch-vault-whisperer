-- Create sports table for tracking sport activities linked to wear entries
CREATE TABLE public.sports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  activity_date DATE NOT NULL,
  sport_type TEXT NOT NULL,
  location TEXT,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own sports" 
ON public.sports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sports" 
ON public.sports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sports" 
ON public.sports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sports" 
ON public.sports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add sport_id column to wear_entries table
ALTER TABLE public.wear_entries 
ADD COLUMN sport_id UUID REFERENCES public.sports(id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sports_updated_at
BEFORE UPDATE ON public.sports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();