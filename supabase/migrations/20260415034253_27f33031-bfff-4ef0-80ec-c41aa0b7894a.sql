
-- Platform most worn this week (aggregates across all users)
CREATE OR REPLACE FUNCTION public.get_platform_most_worn_this_week()
RETURNS TABLE(brand text, model text, ai_image_url text, wear_count bigint, user_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    w.brand,
    w.model,
    w.ai_image_url,
    COUNT(*)::bigint AS wear_count,
    COUNT(DISTINCT we.user_id)::bigint AS user_count
  FROM wear_entries we
  JOIN watches w ON w.id = we.watch_id
  WHERE we.wear_date >= (date_trunc('week', CURRENT_DATE))::date
    AND we.wear_date <= CURRENT_DATE
  GROUP BY w.brand, w.model, w.ai_image_url
  ORDER BY wear_count DESC
  LIMIT 10;
$$;

-- Friends most worn this week
CREATE OR REPLACE FUNCTION public.get_friends_most_worn_this_week(_user_id uuid)
RETURNS TABLE(brand text, model text, ai_image_url text, wear_count bigint, user_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    w.brand,
    w.model,
    w.ai_image_url,
    COUNT(*)::bigint AS wear_count,
    COUNT(DISTINCT we.user_id)::bigint AS user_count
  FROM wear_entries we
  JOIN watches w ON w.id = we.watch_id
  WHERE we.wear_date >= (date_trunc('week', CURRENT_DATE))::date
    AND we.wear_date <= CURRENT_DATE
    AND we.user_id IN (
      SELECT friend_id FROM friendships WHERE user_id = _user_id
      UNION
      SELECT user_id FROM friendships WHERE friend_id = _user_id
    )
  GROUP BY w.brand, w.model, w.ai_image_url
  ORDER BY wear_count DESC
  LIMIT 10;
$$;
