-- Enforce server-side ownership on collections inserts to satisfy RLS reliably
create or replace function public.enforce_collection_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Always set created_by to the authenticated user to align with RLS policy
  new.created_by = auth.uid();
  return new;
end;
$$;

-- Create trigger to run before insert on collections
drop trigger if exists trg_collections_set_created_by on public.collections;
create trigger trg_collections_set_created_by
before insert on public.collections
for each row
execute function public.enforce_collection_created_by();