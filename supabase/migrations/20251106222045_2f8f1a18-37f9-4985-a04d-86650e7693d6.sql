-- Create trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date DATE NOT NULL,
  location TEXT NOT NULL,
  watch_model TEXT NOT NULL,
  days NUMERIC NOT NULL DEFAULT 1,
  purpose TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date DATE NOT NULL,
  location TEXT NOT NULL,
  watch_model TEXT NOT NULL,
  days NUMERIC NOT NULL DEFAULT 0.5,
  purpose TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for trips
CREATE POLICY "Anyone can view trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Anyone can insert trips" ON public.trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update trips" ON public.trips FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete trips" ON public.trips FOR DELETE USING (true);

-- Create policies for events
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Anyone can insert events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete events" ON public.events FOR DELETE USING (true);

-- Create trigger for trips updated_at
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_watches_updated_at();

-- Create trigger for events updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_watches_updated_at();