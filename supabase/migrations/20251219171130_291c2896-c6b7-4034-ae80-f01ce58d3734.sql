-- Add unique constraint on user_preferences.user_id for upsert to work
ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);