-- Add opt-in sharing column for watches
ALTER TABLE public.watches 
ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false;

-- Add followers/following functionality
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Enable RLS on followers
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Followers policies
CREATE POLICY "Users can see all follow relationships"
ON public.followers FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON public.followers FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.followers FOR DELETE
USING (auth.uid() = follower_id);

-- Create user_posts table for feed posts
CREATE TABLE IF NOT EXISTS public.user_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT,
  image_url TEXT,
  watch_id UUID REFERENCES public.watches(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'wrist_check', 'question', 'review')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_posts
ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Anyone can view posts"
ON public.user_posts FOR SELECT
USING (true);

CREATE POLICY "Users can create their own posts"
ON public.user_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
ON public.user_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
ON public.user_posts FOR DELETE
USING (auth.uid() = user_id);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.user_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS on post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Post likes policies
CREATE POLICY "Anyone can see likes"
ON public.post_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like posts"
ON public.post_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
ON public.post_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS public.user_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.user_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_post_comments
ALTER TABLE public.user_post_comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Anyone can see comments"
ON public.user_post_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create comments"
ON public.user_post_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.user_post_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.user_post_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can see tags"
ON public.tags FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create tags"
ON public.tags FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create wear_entry_tags junction table
CREATE TABLE IF NOT EXISTS public.wear_entry_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wear_entry_id UUID NOT NULL REFERENCES public.wear_entries(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wear_entry_id, tag_id)
);

-- Enable RLS on wear_entry_tags
ALTER TABLE public.wear_entry_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see tags on their entries"
ON public.wear_entry_tags FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.wear_entries we 
  WHERE we.id = wear_entry_id AND we.user_id = auth.uid()
));

CREATE POLICY "Users can add tags to their entries"
ON public.wear_entry_tags FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.wear_entries we 
  WHERE we.id = wear_entry_id AND we.user_id = auth.uid()
));

CREATE POLICY "Users can remove tags from their entries"
ON public.wear_entry_tags FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.wear_entries we 
  WHERE we.id = wear_entry_id AND we.user_id = auth.uid()
));

-- Create user_lists table for custom lists
CREATE TABLE IF NOT EXISTS public.user_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  list_type TEXT DEFAULT 'custom' CHECK (list_type IN ('trade', 'sell', 'custom')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_lists
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own lists"
ON public.user_lists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create lists"
ON public.user_lists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their lists"
ON public.user_lists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their lists"
ON public.user_lists FOR DELETE
USING (auth.uid() = user_id AND is_system = false);

-- Create list_items junction table
CREATE TABLE IF NOT EXISTS public.list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.user_lists(id) ON DELETE CASCADE,
  watch_id UUID NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(list_id, watch_id)
);

-- Enable RLS on list_items
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see items in their lists"
ON public.list_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_lists ul 
  WHERE ul.id = list_id AND ul.user_id = auth.uid()
));

CREATE POLICY "Users can add items to their lists"
ON public.list_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_lists ul 
  WHERE ul.id = list_id AND ul.user_id = auth.uid()
));

CREATE POLICY "Users can remove items from their lists"
ON public.list_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.user_lists ul 
  WHERE ul.id = list_id AND ul.user_id = auth.uid()
));

-- Insert default tags
INSERT INTO public.tags (name, category) VALUES 
  ('Trip', 'activity'),
  ('Event', 'activity'),
  ('Work', 'activity'),
  ('Casual', 'activity'),
  ('Sport', 'activity'),
  ('Date Night', 'activity'),
  ('Wedding', 'event'),
  ('Meeting', 'activity'),
  ('Vintage', 'style'),
  ('Dress', 'style'),
  ('Diver', 'style'),
  ('Sport', 'style'),
  ('Daily Driver', 'frequency'),
  ('Special Occasion', 'frequency')
ON CONFLICT (name) DO NOTHING;

-- Enable realtime for feed features
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.followers;