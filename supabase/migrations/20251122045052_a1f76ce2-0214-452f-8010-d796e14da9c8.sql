-- Fix the enforce_collection_created_by function to not override created_by when already set
-- This prevents NULL values during the user signup process when create_default_collection() runs
CREATE OR REPLACE FUNCTION public.enforce_collection_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- Only set created_by if it's not already set
  -- This allows create_default_collection() to explicitly set it during user creation
  IF new.created_by IS NULL THEN
    new.created_by = auth.uid();
  END IF;
  return new;
end;
$function$;