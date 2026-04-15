-- Trust level function (calculates based on account age, posts, friends)
CREATE OR REPLACE FUNCTION public.get_public_trust_level(_user_id uuid)
RETURNS TABLE(trust_level text, completed_trades bigint, verified_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    CASE
      WHEN (
        SELECT COUNT(*) FROM public.friendships WHERE user_id = _user_id OR friend_id = _user_id
      ) >= 10 AND (
        SELECT COUNT(*) FROM public.posts WHERE user_id = _user_id
      ) >= 5 THEN 'verified_collector'
      WHEN (
        SELECT COUNT(*) FROM public.friendships WHERE user_id = _user_id OR friend_id = _user_id
      ) >= 3 THEN 'collector'
      ELSE 'observer'
    END::text AS trust_level,
    0::bigint AS completed_trades,
    NULL::timestamptz AS verified_at;
$$;

-- Reputation score function
CREATE OR REPLACE FUNCTION public.get_reputation_score(_user_id uuid)
RETURNS TABLE(
  reputation_score integer,
  account_age_days integer,
  post_count bigint,
  completed_trades bigint,
  trust_level text,
  friend_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH stats AS (
    SELECT
      EXTRACT(DAY FROM now() - COALESCE(
        (SELECT created_at FROM public.profiles WHERE id = _user_id),
        now()
      ))::integer AS age_days,
      (SELECT COUNT(*) FROM public.posts WHERE user_id = _user_id) AS posts,
      (SELECT COUNT(*) FROM public.friendships WHERE user_id = _user_id OR friend_id = _user_id) AS friends
  )
  SELECT
    LEAST(100, (
      LEAST(age_days, 365) * 20 / 365 +
      LEAST(posts, 50) * 30 / 50 +
      LEAST(friends, 20) * 30 / 20 +
      20
    ))::integer AS reputation_score,
    age_days AS account_age_days,
    posts AS post_count,
    0::bigint AS completed_trades,
    CASE
      WHEN friends >= 10 AND posts >= 5 THEN 'verified_collector'
      WHEN friends >= 3 THEN 'collector'
      ELSE 'observer'
    END::text AS trust_level,
    friends AS friend_count
  FROM stats;
$$;