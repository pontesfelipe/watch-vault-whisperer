
CREATE TABLE public.watch_provenance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  watch_id uuid NOT NULL REFERENCES public.watches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  purchase_year integer,
  original_owner text,
  service_history text,
  has_original_box boolean NOT NULL DEFAULT false,
  has_original_papers boolean NOT NULL DEFAULT false,
  has_original_receipt boolean NOT NULL DEFAULT false,
  additional_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(watch_id)
);

ALTER TABLE public.watch_provenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view provenance for their collection items" ON public.watch_provenance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.watches w
      JOIN public.user_collections uc ON w.collection_id = uc.collection_id
      WHERE w.id = watch_provenance.watch_id AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert provenance for their collection items" ON public.watch_provenance
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.watches w
      JOIN public.user_collections uc ON w.collection_id = uc.collection_id
      WHERE w.id = watch_provenance.watch_id AND uc.user_id = auth.uid()
      AND uc.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can update provenance for their collection items" ON public.watch_provenance
  FOR UPDATE USING (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.watches w
      JOIN public.user_collections uc ON w.collection_id = uc.collection_id
      WHERE w.id = watch_provenance.watch_id AND uc.user_id = auth.uid()
      AND uc.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can delete provenance for their collection items" ON public.watch_provenance
  FOR DELETE USING (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.watches w
      JOIN public.user_collections uc ON w.collection_id = uc.collection_id
      WHERE w.id = watch_provenance.watch_id AND uc.user_id = auth.uid()
      AND uc.role IN ('owner', 'editor')
    )
  );

CREATE TRIGGER update_watch_provenance_updated_at
  BEFORE UPDATE ON public.watch_provenance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
