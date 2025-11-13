-- Add admin SELECT policies to all tables

-- watches
CREATE POLICY "Admins can view all watches" 
ON public.watches 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- wear_entries
CREATE POLICY "Admins can view all wear entries" 
ON public.wear_entries 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- trips
CREATE POLICY "Admins can view all trips" 
ON public.trips 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- events
CREATE POLICY "Admins can view all events" 
ON public.events 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- wishlist
CREATE POLICY "Admins can view all wishlist items" 
ON public.wishlist 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- water_usage
CREATE POLICY "Admins can view all water usage" 
ON public.water_usage 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- watch_specs
CREATE POLICY "Admins can view all watch specs" 
ON public.watch_specs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- user_preferences
CREATE POLICY "Admins can view all user preferences" 
ON public.user_preferences 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));