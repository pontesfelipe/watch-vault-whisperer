-- Create mention notifications table
CREATE TABLE public.mention_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mentioned_by_user_id UUID NOT NULL,
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_mention_notifications_user ON public.mention_notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_mention_notifications_comment ON public.mention_notifications(comment_id);

-- Enable RLS
ALTER TABLE public.mention_notifications ENABLE ROW LEVEL SECURITY;

-- Users can see their own notifications
CREATE POLICY "Users can view their own mention notifications"
ON public.mention_notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own mention notifications"
ON public.mention_notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own mention notifications"
ON public.mention_notifications FOR DELETE
USING (auth.uid() = user_id);

-- Any authenticated user can create mention notifications
CREATE POLICY "Authenticated users can create mention notifications"
ON public.mention_notifications FOR INSERT
WITH CHECK (auth.uid() = mentioned_by_user_id);