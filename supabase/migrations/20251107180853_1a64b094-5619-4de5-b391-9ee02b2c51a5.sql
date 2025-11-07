-- Create water_usage table to track water activities with watches
CREATE TABLE public.water_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activity_type TEXT NOT NULL, -- swimming, diving, shower, rain, etc.
  duration_minutes NUMERIC,
  depth_meters NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.water_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for water_usage
CREATE POLICY "Anyone can view water usage"
ON public.water_usage
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert water usage"
ON public.water_usage
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update water usage"
ON public.water_usage
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete water usage"
ON public.water_usage
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_water_usage_updated_at
BEFORE UPDATE ON public.water_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_watches_updated_at();