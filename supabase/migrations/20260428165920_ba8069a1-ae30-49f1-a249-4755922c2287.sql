-- User groups table
CREATE TABLE public.user_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#5A85C7',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (created_by, name)
);

ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;

-- Membership table (users can belong to multiple groups)
CREATE TABLE public.user_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  added_by UUID,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

ALTER TABLE public.user_group_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_group_members_user ON public.user_group_members(user_id);
CREATE INDEX idx_user_group_members_group ON public.user_group_members(group_id);

-- Helper: is the caller the group's owner?
CREATE OR REPLACE FUNCTION public.is_group_owner(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_groups
    WHERE id = _group_id AND created_by = _user_id
  )
$$;

-- Helper: is the caller a member of the group?
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_group_members
    WHERE group_id = _group_id AND user_id = _user_id
  )
$$;

-- Policies for user_groups
CREATE POLICY "Admins manage all groups"
ON public.user_groups
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can update their groups"
ON public.user_groups
FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Owners can delete their groups"
ON public.user_groups
FOR DELETE
USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can create groups"
ON public.user_groups
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members and owners can view groups"
ON public.user_groups
FOR SELECT
USING (
  auth.uid() = created_by
  OR public.is_group_member(auth.uid(), id)
  OR public.has_role(auth.uid(), 'admin')
);

-- Policies for user_group_members
CREATE POLICY "Admins manage all memberships"
ON public.user_group_members
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Group owners can add members"
ON public.user_group_members
FOR INSERT
WITH CHECK (public.is_group_owner(auth.uid(), group_id));

CREATE POLICY "Group owners can remove members"
ON public.user_group_members
FOR DELETE
USING (public.is_group_owner(auth.uid(), group_id));

CREATE POLICY "Users can view their own memberships and owners can view all"
ON public.user_group_members
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_group_owner(auth.uid(), group_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- updated_at trigger
CREATE TRIGGER update_user_groups_updated_at
BEFORE UPDATE ON public.user_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();