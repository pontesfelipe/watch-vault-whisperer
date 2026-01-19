-- Create vault_pal_conversations table
CREATE TABLE public.vault_pal_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  collection_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vault_pal_messages table
CREATE TABLE public.vault_pal_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.vault_pal_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vault_pal_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_pal_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.vault_pal_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.vault_pal_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.vault_pal_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.vault_pal_conversations FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for messages (through conversation ownership)
CREATE POLICY "Users can view messages in their conversations"
ON public.vault_pal_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.vault_pal_conversations
  WHERE id = conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their conversations"
ON public.vault_pal_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.vault_pal_conversations
  WHERE id = conversation_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete messages in their conversations"
ON public.vault_pal_messages FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.vault_pal_conversations
  WHERE id = conversation_id AND user_id = auth.uid()
));

-- Indexes for performance
CREATE INDEX idx_vault_pal_conversations_user_id ON public.vault_pal_conversations(user_id);
CREATE INDEX idx_vault_pal_conversations_updated_at ON public.vault_pal_conversations(updated_at DESC);
CREATE INDEX idx_vault_pal_messages_conversation_id ON public.vault_pal_messages(conversation_id);
CREATE INDEX idx_vault_pal_messages_created_at ON public.vault_pal_messages(created_at);

-- Trigger to update conversation updated_at when messages are added
CREATE OR REPLACE FUNCTION public.update_vault_pal_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vault_pal_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON public.vault_pal_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_vault_pal_conversation_timestamp();