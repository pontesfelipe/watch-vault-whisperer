-- Create function to purge all user data
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete wear entries (before watches due to foreign key)
  DELETE FROM public.wear_entries WHERE user_id = OLD.id;
  
  -- Delete water usage
  DELETE FROM public.water_usage WHERE user_id = OLD.id;
  
  -- Delete watch specs (before watches due to foreign key)
  DELETE FROM public.watch_specs WHERE user_id = OLD.id;
  
  -- Delete watches
  DELETE FROM public.watches WHERE user_id = OLD.id;
  
  -- Delete trips
  DELETE FROM public.trips WHERE user_id = OLD.id;
  
  -- Delete events
  DELETE FROM public.events WHERE user_id = OLD.id;
  
  -- Delete wishlist items
  DELETE FROM public.wishlist WHERE user_id = OLD.id;
  
  -- Delete collection insights
  DELETE FROM public.collection_insights WHERE user_id = OLD.id;
  
  -- Delete collection gap suggestions
  DELETE FROM public.collection_gap_suggestions WHERE user_id = OLD.id;
  
  -- Delete user preferences
  DELETE FROM public.user_preferences WHERE user_id = OLD.id;
  
  -- Delete AI feature usage
  DELETE FROM public.ai_feature_usage WHERE user_id = OLD.id;
  
  -- Delete user collections (before collections due to references)
  DELETE FROM public.user_collections WHERE user_id = OLD.id;
  
  -- Delete collections created by user
  DELETE FROM public.collections WHERE created_by = OLD.id;
  
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = OLD.id;
  
  -- Delete profile
  DELETE FROM public.profiles WHERE id = OLD.id;
  
  -- Remove from allowed_users by email
  DELETE FROM public.allowed_users WHERE lower(email) = lower(OLD.email);
  
  RETURN OLD;
END;
$$;

-- Create trigger on auth.users for deletion
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deletion();