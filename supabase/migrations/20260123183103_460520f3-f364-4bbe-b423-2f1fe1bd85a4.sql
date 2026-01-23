-- Mark messages as read (receiver-side) via secure RPC to avoid loosening UPDATE RLS on messages

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = _conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorized for this conversation';
  END IF;

  UPDATE public.messages
  SET read_at = now()
  WHERE conversation_id = _conversation_id
    AND sender_id <> auth.uid()
    AND read_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(uuid) TO authenticated;