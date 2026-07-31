DROP TABLE IF EXISTS public.mention_notifications CASCADE;
DROP TABLE IF EXISTS public.comment_votes CASCADE;
DROP TABLE IF EXISTS public.post_votes CASCADE;
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.user_post_comments CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.user_posts CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;

CREATE OR REPLACE FUNCTION public.get_reputation_score(_user_id uuid)
RETURNS TABLE(reputation_score integer, account_age_days integer, post_count bigint, completed_trades bigint, trust_level text, friend_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _age_days integer;
  _friends bigint;
  _trades bigint;
  _score integer;
  _trust text;
BEGIN
  SELECT COALESCE(EXTRACT(DAY FROM (now() - u.created_at))::integer, 0)
    INTO _age_days
  FROM auth.users u WHERE u.id = _user_id;

  SELECT COUNT(*) INTO _friends FROM public.friendships f WHERE f.user_id = _user_id;

  SELECT COUNT(*) INTO _trades FROM public.watches w
   WHERE w.user_id = _user_id AND w.status IN ('sold', 'traded');

  _score := LEAST(100,
      LEAST(COALESCE(_age_days, 0) / 3, 40)
    + LEAST(_friends * 5, 30)::integer
    + LEAST(_trades * 5, 30)::integer
  );

  _trust := CASE
    WHEN _score >= 75 THEN 'trusted'
    WHEN _score >= 40 THEN 'established'
    ELSE 'new'
  END;

  RETURN QUERY SELECT _score, COALESCE(_age_days, 0), 0::bigint, _trades, _trust, _friends;
END;
$$;