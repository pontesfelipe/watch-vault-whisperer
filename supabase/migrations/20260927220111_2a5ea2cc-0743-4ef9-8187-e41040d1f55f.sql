DROP POLICY IF EXISTS "Authenticated users can create tags" ON public.tags;
CREATE POLICY "Admins can create tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Anyone can see tags" ON public.tags;
CREATE POLICY "Signed-in users can see tags" ON public.tags FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.tags FROM anon;

DROP POLICY IF EXISTS "Users can see all follow relationships" ON public.followers;
CREATE POLICY "Users can see their own follow relationships" ON public.followers FOR SELECT TO authenticated USING (auth.uid() = follower_id OR auth.uid() = following_id);

DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;