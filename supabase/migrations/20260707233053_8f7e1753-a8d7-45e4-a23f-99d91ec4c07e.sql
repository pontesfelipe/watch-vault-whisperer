
-- Move warranty card URLs to a dedicated owner-only table so collection viewers/editors
-- cannot read another user's warranty documentation via the shared watches SELECT policy.
CREATE TABLE public.watch_warranty_cards (
  watch_id uuid PRIMARY KEY REFERENCES public.watches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  warranty_card_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_warranty_cards TO authenticated;
GRANT ALL ON public.watch_warranty_cards TO service_role;

ALTER TABLE public.watch_warranty_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own warranty cards"
  ON public.watch_warranty_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view warranty cards"
  ON public.watch_warranty_cards FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can insert own warranty cards"
  ON public.watch_warranty_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own warranty cards"
  ON public.watch_warranty_cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete own warranty cards"
  ON public.watch_warranty_cards FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_watch_warranty_cards_updated_at
  BEFORE UPDATE ON public.watch_warranty_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill existing values
INSERT INTO public.watch_warranty_cards (watch_id, user_id, warranty_card_url)
SELECT id, user_id, warranty_card_url
FROM public.watches
WHERE warranty_card_url IS NOT NULL
ON CONFLICT (watch_id) DO NOTHING;

-- Remove the exposed column from watches so it is no longer visible to collection members
ALTER TABLE public.watches DROP COLUMN IF EXISTS warranty_card_url;
