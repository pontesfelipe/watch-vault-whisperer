DELETE FROM public.collection_insights a USING public.collection_insights b
WHERE a.user_id = b.user_id AND a.ctid < b.ctid;
UPDATE public.collection_insights SET updated_at = now() WHERE updated_at IS NULL;
ALTER TABLE public.collection_insights ALTER COLUMN updated_at SET DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS collection_insights_user_id_key ON public.collection_insights(user_id);