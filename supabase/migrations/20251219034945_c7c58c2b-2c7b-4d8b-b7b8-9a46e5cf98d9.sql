-- Add policy for admins to delete collections
CREATE POLICY "Admins can delete all collections"
ON public.collections
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for admins to delete user_collections entries
CREATE POLICY "Admins can delete user collection access"
ON public.user_collections
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));