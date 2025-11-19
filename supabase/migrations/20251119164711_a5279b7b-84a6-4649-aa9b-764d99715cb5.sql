-- Allow admins to delete any events while keeping user-specific deletes
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;

CREATE POLICY "Users and admins can delete events"
ON public.events
FOR DELETE
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin')
);