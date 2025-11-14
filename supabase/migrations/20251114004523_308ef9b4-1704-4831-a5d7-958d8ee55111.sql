-- Create collections table
CREATE TABLE public.collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create enum for collection access roles
CREATE TYPE public.collection_role AS ENUM ('owner', 'editor', 'viewer');

-- Create user_collections junction table for many-to-many relationship
CREATE TABLE public.user_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  role collection_role NOT NULL DEFAULT 'viewer',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, collection_id)
);

-- Add collection_id to watches table
ALTER TABLE public.watches ADD COLUMN collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;

-- RLS policies for collections
CREATE POLICY "Users can view collections they have access to"
ON public.collections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_collections
    WHERE user_collections.collection_id = collections.id
    AND user_collections.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own collections"
ON public.collections FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Collection owners can update their collections"
ON public.collections FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_collections
    WHERE user_collections.collection_id = collections.id
    AND user_collections.user_id = auth.uid()
    AND user_collections.role = 'owner'
  )
);

CREATE POLICY "Collection owners can delete their collections"
ON public.collections FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_collections
    WHERE user_collections.collection_id = collections.id
    AND user_collections.user_id = auth.uid()
    AND user_collections.role = 'owner'
  )
);

CREATE POLICY "Admins can view all collections"
ON public.collections FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all collections"
ON public.collections FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for user_collections
CREATE POLICY "Users can view their own collection access"
ON public.user_collections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Collection owners can manage access"
ON public.user_collections FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_collections uc
    WHERE uc.collection_id = user_collections.collection_id
    AND uc.user_id = auth.uid()
    AND uc.role = 'owner'
  )
);

CREATE POLICY "Admins can manage all collection access"
ON public.user_collections FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on collections
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_watches_updated_at();

-- Create function to auto-create default collection for new users
CREATE OR REPLACE FUNCTION public.create_default_collection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_collection_id uuid;
BEGIN
  -- Create default collection
  INSERT INTO public.collections (name, created_by)
  VALUES ('My Collection', NEW.id)
  RETURNING id INTO new_collection_id;
  
  -- Add user as owner of the collection
  INSERT INTO public.user_collections (user_id, collection_id, role)
  VALUES (NEW.id, new_collection_id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create default collection when user profile is created
CREATE TRIGGER on_profile_created
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_default_collection();