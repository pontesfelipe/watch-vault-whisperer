-- Allow admins to delete any wishlist item (supports admin moderation and cross-user cleanup)
CREATE POLICY "Admins can delete all wishlist items"
ON public.wishlist
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));