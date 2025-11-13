-- Phase 1.1: Create User Roles System
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Phase 1.2: Create Allowed Users Table
CREATE TABLE public.allowed_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage allowed users"
  ON public.allowed_users FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Phase 1.3: Create Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Phase 1.4: Create Trigger for First User Admin Assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- If first user, make them admin
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- For subsequent users, assign default 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Phase 1.5: Add user_id to all data tables and update RLS policies

-- WATCHES TABLE
ALTER TABLE public.watches ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anyone can view watches" ON public.watches;
DROP POLICY IF EXISTS "Anyone can insert watches" ON public.watches;
DROP POLICY IF EXISTS "Anyone can update watches" ON public.watches;
DROP POLICY IF EXISTS "Anyone can delete watches" ON public.watches;

CREATE POLICY "Users can view own watches"
  ON public.watches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watches"
  ON public.watches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watches"
  ON public.watches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watches"
  ON public.watches FOR DELETE
  USING (auth.uid() = user_id);

-- WEAR_ENTRIES TABLE
ALTER TABLE public.wear_entries ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anyone can view wear entries" ON public.wear_entries;
DROP POLICY IF EXISTS "Anyone can insert wear entries" ON public.wear_entries;
DROP POLICY IF EXISTS "Anyone can update wear entries" ON public.wear_entries;
DROP POLICY IF EXISTS "Anyone can delete wear entries" ON public.wear_entries;

CREATE POLICY "Users can view own wear entries"
  ON public.wear_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wear entries"
  ON public.wear_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wear entries"
  ON public.wear_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wear entries"
  ON public.wear_entries FOR DELETE
  USING (auth.uid() = user_id);

-- TRIPS TABLE
ALTER TABLE public.trips ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anyone can view trips" ON public.trips;
DROP POLICY IF EXISTS "Anyone can insert trips" ON public.trips;
DROP POLICY IF EXISTS "Anyone can update trips" ON public.trips;
DROP POLICY IF EXISTS "Anyone can delete trips" ON public.trips;

CREATE POLICY "Users can view own trips"
  ON public.trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

-- EVENTS TABLE
ALTER TABLE public.events ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Anyone can insert events" ON public.events;
DROP POLICY IF EXISTS "Anyone can update events" ON public.events;
DROP POLICY IF EXISTS "Anyone can delete events" ON public.events;

CREATE POLICY "Users can view own events"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON public.events FOR DELETE
  USING (auth.uid() = user_id);

-- WATER_USAGE TABLE
ALTER TABLE public.water_usage ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anyone can view water usage" ON public.water_usage;
DROP POLICY IF EXISTS "Anyone can insert water usage" ON public.water_usage;
DROP POLICY IF EXISTS "Anyone can update water usage" ON public.water_usage;
DROP POLICY IF EXISTS "Anyone can delete water usage" ON public.water_usage;

CREATE POLICY "Users can view own water usage"
  ON public.water_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water usage"
  ON public.water_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water usage"
  ON public.water_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own water usage"
  ON public.water_usage FOR DELETE
  USING (auth.uid() = user_id);

-- WISHLIST TABLE
ALTER TABLE public.wishlist ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anyone can view wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Anyone can insert wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Anyone can update wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Anyone can delete wishlist" ON public.wishlist;

CREATE POLICY "Users can view own wishlist"
  ON public.wishlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlist"
  ON public.wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlist"
  ON public.wishlist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist"
  ON public.wishlist FOR DELETE
  USING (auth.uid() = user_id);

-- USER_PREFERENCES TABLE
ALTER TABLE public.user_preferences ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anyone can view preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Anyone can insert preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Anyone can update preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Anyone can delete preferences" ON public.user_preferences;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON public.user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- WATCH_SPECS TABLE
ALTER TABLE public.watch_specs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Anyone can view watch specs" ON public.watch_specs;
DROP POLICY IF EXISTS "Anyone can insert watch specs" ON public.watch_specs;
DROP POLICY IF EXISTS "Anyone can update watch specs" ON public.watch_specs;
DROP POLICY IF EXISTS "Anyone can delete watch specs" ON public.watch_specs;

CREATE POLICY "Users can view own watch specs"
  ON public.watch_specs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch specs"
  ON public.watch_specs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch specs"
  ON public.watch_specs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watch specs"
  ON public.watch_specs FOR DELETE
  USING (auth.uid() = user_id);