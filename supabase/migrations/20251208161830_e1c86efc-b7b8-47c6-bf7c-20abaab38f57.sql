-- Create friend request status enum
CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'declined');

-- Create friendships table (for accepted connections)
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id)
);

-- Create friend requests table
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  status friend_request_status NOT NULL DEFAULT 'pending',
  message TEXT,
  trade_match_watch_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (from_user_id, to_user_id)
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user1_id, user2_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trade match notifications table
CREATE TABLE public.trade_match_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wishlist_item_id UUID NOT NULL,
  trade_watch_id UUID NOT NULL,
  trade_owner_id UUID NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_match_notifications ENABLE ROW LEVEL SECURITY;

-- Friendships policies
CREATE POLICY "Users can view their own friendships"
ON public.friendships FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friendships"
ON public.friendships FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own friendships"
ON public.friendships FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friend requests policies
CREATE POLICY "Users can view requests they sent or received"
ON public.friend_requests FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send friend requests"
ON public.friend_requests FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update requests sent to them"
ON public.friend_requests FOR UPDATE
USING (auth.uid() = to_user_id);

CREATE POLICY "Users can delete requests they sent"
ON public.friend_requests FOR DELETE
USING (auth.uid() = from_user_id);

-- Conversations policies
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations with friends"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id);

-- Trade match notifications policies
CREATE POLICY "Users can view their trade notifications"
ON public.trade_match_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert trade notifications"
ON public.trade_match_notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
ON public.trade_match_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications"
ON public.trade_match_notifications FOR DELETE
USING (auth.uid() = user_id);

-- Admin policies for all tables
CREATE POLICY "Admins can view all friendships"
ON public.friendships FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all friend requests"
ON public.friend_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all conversations"
ON public.conversations FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all messages"
ON public.messages FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all trade notifications"
ON public.trade_match_notifications FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_match_notifications;

-- Create function to check trade matches when a watch is marked available_for_trade
CREATE OR REPLACE FUNCTION public.check_trade_matches()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wishlist_record RECORD;
BEGIN
  -- Only check if watch is being marked as available for trade
  IF NEW.available_for_trade = true AND (OLD.available_for_trade IS NULL OR OLD.available_for_trade = false) THEN
    -- Find matching wishlist items from other users
    FOR wishlist_record IN
      SELECT w.id as wishlist_id, w.user_id as wishlist_user_id
      FROM public.wishlist w
      WHERE w.user_id != NEW.user_id
        AND lower(w.brand) = lower(NEW.brand)
        AND lower(w.model) = lower(NEW.model)
    LOOP
      -- Create notification if not already exists
      INSERT INTO public.trade_match_notifications (user_id, wishlist_item_id, trade_watch_id, trade_owner_id)
      VALUES (wishlist_record.wishlist_user_id, wishlist_record.wishlist_id, NEW.id, NEW.user_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for trade matching
CREATE TRIGGER on_watch_trade_status_change
AFTER UPDATE ON public.watches
FOR EACH ROW
EXECUTE FUNCTION public.check_trade_matches();

-- Create function to accept friend request and create friendship + conversation
CREATE OR REPLACE FUNCTION public.accept_friend_request(_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record RECORD;
  conv_id uuid;
BEGIN
  -- Get the request
  SELECT * INTO request_record FROM public.friend_requests WHERE id = _request_id AND to_user_id = auth.uid();
  
  IF request_record IS NULL THEN
    RAISE EXCEPTION 'Friend request not found or not authorized';
  END IF;
  
  -- Update request status
  UPDATE public.friend_requests SET status = 'accepted', updated_at = now() WHERE id = _request_id;
  
  -- Create bidirectional friendships
  INSERT INTO public.friendships (user_id, friend_id) VALUES (request_record.from_user_id, request_record.to_user_id)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.friendships (user_id, friend_id) VALUES (request_record.to_user_id, request_record.from_user_id)
  ON CONFLICT DO NOTHING;
  
  -- Create conversation
  INSERT INTO public.conversations (user1_id, user2_id)
  VALUES (LEAST(request_record.from_user_id, request_record.to_user_id), GREATEST(request_record.from_user_id, request_record.to_user_id))
  ON CONFLICT DO NOTHING;
END;
$$;

-- Update user deletion handler to clean up messaging data
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete messaging data
  DELETE FROM public.messages WHERE sender_id = OLD.id;
  DELETE FROM public.conversations WHERE user1_id = OLD.id OR user2_id = OLD.id;
  DELETE FROM public.friendships WHERE user_id = OLD.id OR friend_id = OLD.id;
  DELETE FROM public.friend_requests WHERE from_user_id = OLD.id OR to_user_id = OLD.id;
  DELETE FROM public.trade_match_notifications WHERE user_id = OLD.id OR trade_owner_id = OLD.id;
  
  -- Existing deletions
  DELETE FROM public.wear_entries WHERE user_id = OLD.id;
  DELETE FROM public.water_usage WHERE user_id = OLD.id;
  DELETE FROM public.watch_specs WHERE user_id = OLD.id;
  DELETE FROM public.watches WHERE user_id = OLD.id;
  DELETE FROM public.trips WHERE user_id = OLD.id;
  DELETE FROM public.events WHERE user_id = OLD.id;
  DELETE FROM public.wishlist WHERE user_id = OLD.id;
  DELETE FROM public.collection_insights WHERE user_id = OLD.id;
  DELETE FROM public.collection_gap_suggestions WHERE user_id = OLD.id;
  DELETE FROM public.user_preferences WHERE user_id = OLD.id;
  DELETE FROM public.ai_feature_usage WHERE user_id = OLD.id;
  DELETE FROM public.user_collections WHERE user_id = OLD.id;
  DELETE FROM public.collections WHERE created_by = OLD.id;
  DELETE FROM public.user_roles WHERE user_id = OLD.id;
  DELETE FROM public.profiles WHERE id = OLD.id;
  DELETE FROM public.allowed_users WHERE lower(email) = lower(OLD.email);
  
  RETURN OLD;
END;
$$;