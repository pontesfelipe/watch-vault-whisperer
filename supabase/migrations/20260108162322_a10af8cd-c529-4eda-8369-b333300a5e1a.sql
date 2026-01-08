-- Allow admins to update any post (for pinning)
CREATE POLICY "Admins can update any post"
ON public.posts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));