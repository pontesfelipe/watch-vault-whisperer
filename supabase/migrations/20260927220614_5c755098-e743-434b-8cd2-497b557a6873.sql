ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS is_global boolean NOT NULL DEFAULT false;
UPDATE public.tags SET is_global = true WHERE created_by IS NULL;

DROP POLICY IF EXISTS "Admins can create tags" ON public.tags;
DROP POLICY IF EXISTS "Signed-in users can see tags" ON public.tags;

CREATE POLICY "Users see global, own, or admin sees all tags" ON public.tags FOR SELECT TO authenticated
USING (is_global OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create private tags; admins create any" ON public.tags FOR INSERT TO authenticated
WITH CHECK (
  (created_by = auth.uid() AND is_global = false)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Owners or admins can update tags" ON public.tags FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR (created_by = auth.uid() AND is_global = false))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR (created_by = auth.uid() AND is_global = false));

CREATE POLICY "Owners or admins can delete tags" ON public.tags FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR (created_by = auth.uid() AND is_global = false));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can read feature toggles" ON public.collection_feature_toggles;
CREATE POLICY "Admins can read feature toggles" ON public.collection_feature_toggles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));