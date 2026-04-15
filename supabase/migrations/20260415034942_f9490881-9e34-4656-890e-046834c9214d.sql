
-- User Tags table
CREATE TABLE public.user_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#808080',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags" ON public.user_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tags" ON public.user_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON public.user_tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON public.user_tags FOR DELETE USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_user_tags_unique_name ON public.user_tags (user_id, lower(name));

-- Watch Tags junction table
CREATE TABLE public.watch_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  watch_id uuid NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.user_tags(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(watch_id, tag_id)
);

ALTER TABLE public.watch_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags on their items" ON public.watch_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.watches w
    JOIN public.user_collections uc ON w.collection_id = uc.collection_id
    WHERE w.id = watch_tags.watch_id AND uc.user_id = auth.uid()
  ));

CREATE POLICY "Users can assign tags to their items" ON public.watch_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.watches w
    JOIN public.user_collections uc ON w.collection_id = uc.collection_id
    WHERE w.id = watch_tags.watch_id AND uc.user_id = auth.uid()
    AND uc.role IN ('owner', 'editor')
  ));

CREATE POLICY "Users can remove tags from their items" ON public.watch_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.watches w
    JOIN public.user_collections uc ON w.collection_id = uc.collection_id
    WHERE w.id = watch_tags.watch_id AND uc.user_id = auth.uid()
    AND uc.role IN ('owner', 'editor')
  ));

-- Add canvas_widgets and is_collection_public to user_preferences
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS canvas_widgets jsonb DEFAULT '{"collection_stats":true,"usage_trends":true,"usage_chart":true,"depreciation":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_collection_public boolean DEFAULT false;

-- Update trigger for user_tags
CREATE TRIGGER update_user_tags_updated_at
  BEFORE UPDATE ON public.user_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
