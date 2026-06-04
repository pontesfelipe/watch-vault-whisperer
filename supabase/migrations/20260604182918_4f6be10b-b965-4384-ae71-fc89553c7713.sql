-- Restrict SELECT on social interaction tables to authenticated users
DROP POLICY IF EXISTS "Post comments are viewable by everyone" ON public.post_comments;
DROP POLICY IF EXISTS "Anyone can view post comments" ON public.post_comments;
DROP POLICY IF EXISTS "Public can view post comments" ON public.post_comments;
CREATE POLICY "Authenticated users can view post comments"
  ON public.post_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "User post comments are viewable by everyone" ON public.user_post_comments;
DROP POLICY IF EXISTS "Anyone can view user post comments" ON public.user_post_comments;
DROP POLICY IF EXISTS "Public can view user post comments" ON public.user_post_comments;
CREATE POLICY "Authenticated users can view user post comments"
  ON public.user_post_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Post votes are viewable by everyone" ON public.post_votes;
DROP POLICY IF EXISTS "Anyone can view post votes" ON public.post_votes;
DROP POLICY IF EXISTS "Public can view post votes" ON public.post_votes;
CREATE POLICY "Authenticated users can view post votes"
  ON public.post_votes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Comment votes are viewable by everyone" ON public.comment_votes;
DROP POLICY IF EXISTS "Anyone can view comment votes" ON public.comment_votes;
DROP POLICY IF EXISTS "Public can view comment votes" ON public.comment_votes;
CREATE POLICY "Authenticated users can view comment votes"
  ON public.comment_votes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Post likes are viewable by everyone" ON public.post_likes;
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;
DROP POLICY IF EXISTS "Public can view post likes" ON public.post_likes;
CREATE POLICY "Authenticated users can view post likes"
  ON public.post_likes FOR SELECT
  TO authenticated
  USING (true);

-- Restrict storage API listing/reading of post-images to authenticated users
-- (bucket remains public, so direct CDN URLs continue to work)
DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view post images" ON storage.objects;
CREATE POLICY "Authenticated users can read post-images via API"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'post-images');
