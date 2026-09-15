-- ============================================================================
-- DATABASE SCHEMA FOR LINKBIO PROJECT
-- Supabase PostgreSQL Database
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USERS TABLE (Managed by Supabase Auth)
-- Note: This is typically handled by Supabase Auth, but documenting for reference
-- ============================================================================

-- The auth.users table is created automatically by Supabase
-- We create a public.users view for easier access if needed

-- ============================================================================
-- 2. PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(500),
  accent_color VARCHAR(7) DEFAULT '#ec4899',
  button_style VARCHAR(20) DEFAULT 'soft' CHECK (button_style IN ('soft', 'outline')),
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT user_id_unique UNIQUE(user_id)
);

-- Índices
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_slug ON public.profiles(slug);

-- ============================================================================
-- 3. PROFILE_LINKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profile_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  href VARCHAR(2000) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  position INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_position CHECK (position >= 0)
);

-- Índices
CREATE INDEX idx_profile_links_profile_id ON public.profile_links(profile_id);
CREATE INDEX idx_profile_links_position ON public.profile_links(profile_id, position);

-- ============================================================================
-- 4. USER_STATS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_clicks INTEGER DEFAULT 0 CHECK (total_clicks >= 0),
  total_views INTEGER DEFAULT 0 CHECK (total_views >= 0),
  monthly_active_users INTEGER DEFAULT 0 CHECK (monthly_active_users >= 0),
  conversion_rate DECIMAL(5, 2) DEFAULT 0 CHECK (conversion_rate >= 0 AND conversion_rate <= 100),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_stats_user_id ON public.user_stats(user_id);

-- ============================================================================
-- 5. LINK_CLICKS TABLE (Analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.link_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID NOT NULL REFERENCES public.profile_links(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address VARCHAR(45),
  referrer VARCHAR(500),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para analítica eficiente
CREATE INDEX idx_link_clicks_link_id ON public.link_clicks(link_id);
CREATE INDEX idx_link_clicks_timestamp ON public.link_clicks(timestamp);
CREATE INDEX idx_link_clicks_link_timestamp ON public.link_clicks(link_id, timestamp);

-- ============================================================================
-- 6. SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  billing_period VARCHAR(20) CHECK (billing_period IN ('monthly', 'yearly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON public.subscriptions(expires_at);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES RLS
-- ============================================================================

-- Anyone can read profiles (public profiles)
CREATE POLICY "Profiles are public" ON public.profiles
  FOR SELECT USING (true);

-- Only owner can insert
CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only owner can update
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only owner can delete
CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- PROFILE_LINKS RLS
-- ============================================================================

-- Anyone can read links (they're part of public profile)
CREATE POLICY "Profile links are public" ON public.profile_links
  FOR SELECT USING (true);

-- Only profile owner can insert
CREATE POLICY "Users can add links to their profile" ON public.profile_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = profile_id AND user_id = auth.uid()
    )
  );

-- Only profile owner can update
CREATE POLICY "Users can update their profile links" ON public.profile_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = profile_id AND user_id = auth.uid()
    )
  );

-- Only profile owner can delete
CREATE POLICY "Users can delete their profile links" ON public.profile_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = profile_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- USER_STATS RLS
-- ============================================================================

-- Only owner can read their stats
CREATE POLICY "Users can read their own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

-- System functions can insert/update (via triggers)
CREATE POLICY "System can update stats" ON public.user_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update user stats" ON public.user_stats
  FOR UPDATE WITH CHECK (true);

-- ============================================================================
-- LINK_CLICKS RLS
-- ============================================================================

-- Only link owner can read clicks
CREATE POLICY "Users can read clicks on their links" ON public.link_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profile_links pl
      JOIN public.profiles p ON pl.profile_id = p.id
      WHERE pl.id = link_id AND p.user_id = auth.uid()
    )
  );

-- Anyone can insert clicks (anonymous tracking)
CREATE POLICY "Anyone can record link clicks" ON public.link_clicks
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- SUBSCRIPTIONS RLS
-- ============================================================================

-- Only owner can read their subscription
CREATE POLICY "Users can read their own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert/update subscriptions
CREATE POLICY "System can create subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update subscriptions" ON public.subscriptions
  FOR UPDATE WITH CHECK (true);

-- ============================================================================
-- 8. TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. TRIGGER FOR AUTO-CREATING STATS AND SUBSCRIPTION
-- ============================================================================

-- When a user is created in auth.users, create their stats and subscription
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_slug TEXT;
BEGIN
  -- Generate unique slug from email
  new_slug := LOWER(SPLIT_PART(NEW.email, '@', 1)) || '-' || SUBSTR(NEW.id::text, 1, 8);
  
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name, slug)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1), new_slug)
  ON CONFLICT DO NOTHING;
  
  -- Create stats
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  
  -- Create subscription (default: free)
  INSERT INTO public.subscriptions (user_id, plan)
  VALUES (NEW.id, 'free')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_on_signup();

-- ============================================================================
-- 10. FUNCTION TO TRACK LINK CLICKS AND UPDATE STATS
-- ============================================================================

CREATE OR REPLACE FUNCTION track_link_click()
RETURNS TRIGGER AS $$
DECLARE
  profile_user_id UUID;
BEGIN
  -- Get the user who owns this link
  SELECT p.user_id INTO profile_user_id
  FROM public.profiles p
  JOIN public.profile_links pl ON p.id = pl.profile_id
  WHERE pl.id = NEW.link_id;
  
  -- Update total_clicks
  UPDATE public.user_stats
  SET total_clicks = total_clicks + 1,
      updated_at = NOW()
  WHERE user_id = profile_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger when a click is recorded
CREATE TRIGGER on_link_click_recorded
  AFTER INSERT ON public.link_clicks
  FOR EACH ROW
  EXECUTE FUNCTION track_link_click();

-- ============================================================================
-- 11. STORAGE BUCKETS (for avatars and other media)
-- ============================================================================

-- Note: These should be created via Supabase Dashboard
-- Bucket name: 'avatars'
-- Bucket name: 'public-content'

-- ============================================================================
-- 12. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Profile with link count
CREATE OR REPLACE VIEW public.profiles_with_stats AS
SELECT
  p.id,
  p.user_id,
  p.display_name,
  p.slug,
  p.bio,
  p.avatar_url,
  p.accent_color,
  p.button_style,
  p.created_at,
  p.updated_at,
  COUNT(pl.id) AS link_count,
  COALESCE(us.total_clicks, 0) AS total_clicks,
  COALESCE(us.total_views, 0) AS total_views
FROM public.profiles p
LEFT JOIN public.profile_links pl ON p.id = pl.profile_id
LEFT JOIN public.user_stats us ON p.user_id = us.user_id
GROUP BY p.id, us.id;

-- ============================================================================
-- 13. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Already created above, but summary:
-- - profiles: user_id, slug
-- - profile_links: profile_id, position
-- - user_stats: user_id
-- - link_clicks: link_id, timestamp, link_id+timestamp
-- - subscriptions: user_id, status, expires_at

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
