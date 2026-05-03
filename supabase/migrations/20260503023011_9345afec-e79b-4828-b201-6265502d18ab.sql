
-- Allow admins to manage the email suppression list
CREATE POLICY "Admins can view suppressed emails"
ON public.suppressed_emails
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert suppressed emails"
ON public.suppressed_emails
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete suppressed emails"
ON public.suppressed_emails
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
