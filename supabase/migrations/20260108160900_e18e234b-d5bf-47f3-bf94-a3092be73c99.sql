-- Add category column to posts
ALTER TABLE public.posts ADD COLUMN category TEXT DEFAULT 'general';

-- Create index for faster search
CREATE INDEX idx_posts_title_content ON public.posts USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));
CREATE INDEX idx_posts_category ON public.posts(category);