-- 1. Remove city column from login_history (keep only country for reduced granularity)
ALTER TABLE public.login_history DROP COLUMN IF EXISTS city;

-- 2. Create a function to automatically purge old login history records (older than 30 days)
CREATE OR REPLACE FUNCTION public.purge_old_login_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_history
  WHERE login_at < now() - interval '30 days';
END;
$$;

-- 3. Create a trigger function to purge old records on each new insert (self-cleaning)
CREATE OR REPLACE FUNCTION public.auto_purge_login_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only purge occasionally (roughly 1 in 100 inserts) to avoid performance impact
  IF random() < 0.01 THEN
    DELETE FROM public.login_history
    WHERE login_at < now() - interval '30 days';
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Create the trigger for auto-purging
DROP TRIGGER IF EXISTS trigger_auto_purge_login_history ON public.login_history;
CREATE TRIGGER trigger_auto_purge_login_history
  AFTER INSERT ON public.login_history
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_purge_login_history();

-- 5. Run an initial purge of existing old records
SELECT public.purge_old_login_history();