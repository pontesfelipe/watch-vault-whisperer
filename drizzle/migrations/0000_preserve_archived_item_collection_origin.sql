ALTER TABLE public.watches ADD COLUMN archived_collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.watches.archived_collection_id IS 'Collection at archival time. Legacy detached items with unknown origin remain NULL; never infer their collection.';
UPDATE public.watches SET archived_collection_id = collection_id WHERE collection_id IS NOT NULL AND status IN ('sold', 'traded', 'lost', 'stolen', 'gave_away');
CREATE INDEX watches_archived_collection_idx ON public.watches (archived_collection_id) WHERE archived_collection_id IS NOT NULL;
CREATE FUNCTION public.preserve_archived_item_collection()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.archived_collection_id := NULL;
  ELSIF NEW.status IN ('sold', 'traded', 'lost', 'stolen', 'gave_away') AND OLD.collection_id IS NOT NULL THEN
    NEW.archived_collection_id := OLD.collection_id;
  ELSIF NEW.status = 'active' AND NEW.collection_id IS NOT NULL THEN
    NEW.archived_collection_id := NULL;
  ELSE
    NEW.archived_collection_id := OLD.archived_collection_id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.preserve_archived_item_collection() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER preserve_archived_item_collection BEFORE INSERT OR UPDATE ON public.watches FOR EACH ROW EXECUTE FUNCTION public.preserve_archived_item_collection();