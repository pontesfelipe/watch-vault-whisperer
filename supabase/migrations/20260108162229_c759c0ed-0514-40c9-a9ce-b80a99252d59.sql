-- Add is_pinned column to posts
ALTER TABLE public.posts ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Create index for pinned posts
CREATE INDEX idx_posts_pinned ON public.posts(is_pinned DESC, created_at DESC);