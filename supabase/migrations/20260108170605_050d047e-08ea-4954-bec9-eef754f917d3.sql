-- Create function to anonymize old access logs by removing PII
CREATE OR REPLACE FUNCTION public.anonymize_old_access_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove PII from access logs older than 7 days
  -- Keep action, page, and aggregated details for analytics purposes
  UPDATE public.access_logs
  SET 
    ip_address = NULL,
    user_agent = NULL,
    user_email = NULL,
    details = CASE 
      WHEN details IS NOT NULL THEN 
        jsonb_build_object('anonymized', true, 'original_action', action)
      ELSE NULL 
    END
  WHERE created_at < now() - interval '7 days'
    AND (ip_address IS NOT NULL OR user_agent IS NOT NULL OR user_email IS NOT NULL);
END;
$$;

-- Create trigger function that runs anonymization on each insert (probabilistic to avoid performance impact)
CREATE OR REPLACE FUNCTION public.auto_anonymize_access_logs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only run anonymization occasionally (roughly 1 in 50 inserts) to avoid performance impact
  IF random() < 0.02 THEN
    PERFORM public.anonymize_old_access_logs();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_anonymize_access_logs ON public.access_logs;
CREATE TRIGGER trigger_auto_anonymize_access_logs
  AFTER INSERT ON public.access_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_anonymize_access_logs();

-- Run anonymization now for any existing old logs
SELECT public.anonymize_old_access_logs();