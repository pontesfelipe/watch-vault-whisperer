-- Create watches table
CREATE TABLE public.watches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  dial_color TEXT NOT NULL,
  type TEXT NOT NULL,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wear_entries table to track daily wear
CREATE TABLE public.wear_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  wear_date DATE NOT NULL,
  days DECIMAL(4, 2) NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(watch_id, wear_date)
);

-- Enable Row Level Security
ALTER TABLE public.watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wear_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a personal collection tracker)
CREATE POLICY "Anyone can view watches"
  ON public.watches FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert watches"
  ON public.watches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update watches"
  ON public.watches FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete watches"
  ON public.watches FOR DELETE
  USING (true);

CREATE POLICY "Anyone can view wear entries"
  ON public.wear_entries FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert wear entries"
  ON public.wear_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update wear entries"
  ON public.wear_entries FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete wear entries"
  ON public.wear_entries FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_wear_entries_watch_id ON public.wear_entries(watch_id);
CREATE INDEX idx_wear_entries_wear_date ON public.wear_entries(wear_date);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_watches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_watches_timestamp
  BEFORE UPDATE ON public.watches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_watches_updated_at();

CREATE TRIGGER update_wear_entries_timestamp
  BEFORE UPDATE ON public.wear_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_watches_updated_at();