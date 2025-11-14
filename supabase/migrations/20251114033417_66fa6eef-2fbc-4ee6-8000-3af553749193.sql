-- Secure server-side collection creation that enforces permissions and ownership
create or replace function public.create_collection(_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  is_admin boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Check permissions: admin or allowed user
  select public.has_role(auth.uid(), 'admin') into is_admin;
  if not (is_admin or public.is_allowed_user(auth.uid())) then
    raise exception 'User is not allowed to create collections';
  end if;

  -- Enforce non-admin single collection limit
  if not is_admin then
    if exists (
      select 1 from public.collections where created_by = auth.uid()
    ) then
      raise exception 'Non-admin users can only create one collection. You can be granted access to additional collections by other users.';
    end if;
  end if;

  -- Create collection, created_by will also be set by trigger but we set explicitly too
  insert into public.collections(name, created_by)
  values (_name, auth.uid())
  returning id into new_id;

  -- Grant ownership to the creator
  insert into public.user_collections(user_id, collection_id, role)
  values (auth.uid(), new_id, 'owner');

  return new_id;
end;
$$;