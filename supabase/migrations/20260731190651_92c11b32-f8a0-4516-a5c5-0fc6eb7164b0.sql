DROP POLICY IF EXISTS "Authenticated users can create mention notifications" ON public.mention_notifications;

CREATE POLICY "Users can create validated mention notifications"
ON public.mention_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = mentioned_by_user_id
  AND user_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.post_comments pc
    WHERE pc.id = comment_id
      AND pc.post_id = mention_notifications.post_id
      AND pc.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can insert trade notifications" ON public.trade_match_notifications;

CREATE POLICY "Users can insert validated trade notifications"
ON public.trade_match_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.wishlist w
    WHERE w.id = wishlist_item_id AND w.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.watches wa
    WHERE wa.id = trade_watch_id
      AND wa.user_id = trade_match_notifications.trade_owner_id
      AND wa.available_for_trade = true
  )
);

DROP POLICY IF EXISTS "Users can create their own posts" ON public.user_posts;

CREATE POLICY "Users can create their own posts"
ON public.user_posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    watch_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.watches w
      WHERE w.id = watch_id AND w.user_id = auth.uid()
    )
  )
);