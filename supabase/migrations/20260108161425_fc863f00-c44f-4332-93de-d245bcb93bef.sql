-- Drop existing post_likes table and recreate with vote_type
DROP TABLE IF EXISTS public.post_likes;

-- Create post_votes table with vote_type
CREATE TABLE public.post_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create comment_votes table
CREATE TABLE public.comment_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

-- Post votes policies
CREATE POLICY "Anyone can view post votes"
ON public.post_votes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote on posts"
ON public.post_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own post votes"
ON public.post_votes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove own post votes"
ON public.post_votes FOR DELETE
USING (auth.uid() = user_id);

-- Comment votes policies
CREATE POLICY "Anyone can view comment votes"
ON public.comment_votes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can vote on comments"
ON public.comment_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comment votes"
ON public.comment_votes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove own comment votes"
ON public.comment_votes FOR DELETE
USING (auth.uid() = user_id);