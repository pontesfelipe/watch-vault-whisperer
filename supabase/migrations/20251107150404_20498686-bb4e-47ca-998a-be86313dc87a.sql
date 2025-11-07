-- Create watch_specs table to store detailed specifications
CREATE TABLE public.watch_specs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  watch_id uuid NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  price numeric NOT NULL DEFAULT 0,
  movement text,
  power_reserve text,
  crystal text,
  case_material text,
  case_size text,
  lug_to_lug text,
  water_resistance text,
  caseback text,
  band text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.watch_specs ENABLE ROW LEVEL SECURITY;

-- Create policies for watch_specs
CREATE POLICY "Anyone can view watch specs" 
ON public.watch_specs 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert watch specs" 
ON public.watch_specs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update watch specs" 
ON public.watch_specs 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete watch specs" 
ON public.watch_specs 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_watch_specs_updated_at
BEFORE UPDATE ON public.watch_specs
FOR EACH ROW
EXECUTE FUNCTION public.update_watches_updated_at();