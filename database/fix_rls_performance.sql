-- Performance Optimization for RLS Policies
-- This script addresses the Supabase Performance Advisor warnings about Auth RLS initialization

-- First, let's create a function to get the current user ID more efficiently
CREATE OR REPLACE FUNCTION auth.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true)::json->>'sub', ''),
    (nullif(current_setting('request.jwt.claim.sub', true), ''))::uuid
  )::uuid;
$$;

-- Create indexes for better performance on auth-related queries
CREATE INDEX IF NOT EXISTS idx_profiles_id_btree ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_users_id_btree ON users(id);
CREATE INDEX IF NOT EXISTS idx_giveaways_creator_id ON giveaways(creator_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_giveaway_id ON entries(giveaway_id);

-- Drop existing problematic policies and recreate them with better performance

-- PROFILES TABLE POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- More efficient policies for profiles
CREATE POLICY "Public profiles viewable" ON profiles
    FOR SELECT 
    USING (true); -- Allow public read access

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT 
    WITH CHECK (auth.current_user_id() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE 
    USING (auth.current_user_id() = id)
    WITH CHECK (auth.current_user_id() = id);

-- USERS TABLE POLICIES (if you're using this table)
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own user" ON users;
DROP POLICY IF EXISTS "Users can update own user" ON users;

CREATE POLICY "Public users viewable" ON users
    FOR SELECT 
    USING (true); -- Allow public read access

CREATE POLICY "Users can insert own user" ON users
    FOR INSERT 
    WITH CHECK (auth.current_user_id() = id);

CREATE POLICY "Users can update own user" ON users
    FOR UPDATE 
    USING (auth.current_user_id() = id)
    WITH CHECK (auth.current_user_id() = id);

-- GIVEAWAYS TABLE POLICIES
DROP POLICY IF EXISTS "Anyone can view giveaways" ON giveaways;
DROP POLICY IF EXISTS "Users can create giveaways" ON giveaways;
DROP POLICY IF EXISTS "Creators can update own giveaways" ON giveaways;

CREATE POLICY "Public giveaways viewable" ON giveaways
    FOR SELECT 
    USING (true); -- Allow public read access

CREATE POLICY "Users can create giveaways" ON giveaways
    FOR INSERT 
    WITH CHECK (auth.current_user_id() = creator_id);

CREATE POLICY "Creators can update own giveaways" ON giveaways
    FOR UPDATE 
    USING (auth.current_user_id() = creator_id)
    WITH CHECK (auth.current_user_id() = creator_id);

-- ENTRIES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own entries" ON entries;
DROP POLICY IF EXISTS "Users can create entries" ON entries;
DROP POLICY IF EXISTS "Creators can view entries for their giveaways" ON entries;

CREATE POLICY "Users can view own entries" ON entries
    FOR SELECT 
    USING (auth.current_user_id() = user_id);

CREATE POLICY "Users can create entries" ON entries
    FOR INSERT 
    WITH CHECK (auth.current_user_id() = user_id);

-- Allow creators to view entries for their giveaways
CREATE POLICY "Creators can view giveaway entries" ON entries
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM giveaways 
            WHERE giveaways.id = entries.giveaway_id 
            AND giveaways.creator_id = auth.current_user_id()
        )
    );

-- ACTIVITIES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view activities" ON activities;
DROP POLICY IF EXISTS "Users can create activities" ON activities;

CREATE POLICY "Public activities viewable" ON activities
    FOR SELECT 
    USING (true); -- Allow public read access to activities

CREATE POLICY "Users can create activities" ON activities
    FOR INSERT 
    WITH CHECK (auth.current_user_id() = user_id);

-- COMMENTS TABLE POLICIES
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

CREATE POLICY "Public comments viewable" ON comments
    FOR SELECT 
    USING (true); -- Allow public read access

CREATE POLICY "Users can create comments" ON comments
    FOR INSERT 
    WITH CHECK (auth.current_user_id() = user_id);

CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE 
    USING (auth.current_user_id() = user_id)
    WITH CHECK (auth.current_user_id() = user_id);

-- LIKES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view likes" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

CREATE POLICY "Public likes viewable" ON likes
    FOR SELECT 
    USING (true); -- Allow public read access

CREATE POLICY "Users can create likes" ON likes
    FOR INSERT 
    WITH CHECK (auth.current_user_id() = user_id);

CREATE POLICY "Users can delete own likes" ON likes
    FOR DELETE 
    USING (auth.current_user_id() = user_id);

-- FOLLOWERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view followers" ON followers;
DROP POLICY IF EXISTS "Users can create follows" ON followers;
DROP POLICY IF EXISTS "Users can delete own follows" ON followers;

CREATE POLICY "Public followers viewable" ON followers
    FOR SELECT 
    USING (true); -- Allow public read access

CREATE POLICY "Users can create follows" ON followers
    FOR INSERT 
    WITH CHECK (auth.current_user_id() = follower_id);

CREATE POLICY "Users can delete own follows" ON followers
    FOR DELETE 
    USING (auth.current_user_id() = follower_id);

-- PAYMENTS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can create payments" ON payments;

CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT 
    USING (auth.current_user_id() = user_id);

CREATE POLICY "Users can create payments" ON payments
    FOR INSERT 
    WITH CHECK (auth.current_user_id() = user_id);

-- WINNERS TABLE POLICIES
DROP POLICY IF EXISTS "Anyone can view winners" ON winners;
DROP POLICY IF EXISTS "System can create winners" ON winners;

CREATE POLICY "Public winners viewable" ON winners
    FOR SELECT 
    USING (true); -- Allow public read access

-- Only allow system/admin to create winners
CREATE POLICY "System can create winners" ON winners
    FOR INSERT 
    WITH CHECK (
        auth.current_user_id() IN (
            SELECT id FROM users WHERE is_admin = true
        ) OR auth.role() = 'service_role'
    );

-- Create a function to refresh statistics periodically (reduces real-time RLS overhead)
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update follower counts
    UPDATE users SET followers_count = (
        SELECT COUNT(*) FROM followers WHERE following_id = users.id
    );
    
    UPDATE users SET following_count = (
        SELECT COUNT(*) FROM followers WHERE follower_id = users.id
    );
    
    -- Update giveaway counts
    UPDATE users SET total_giveaways_created = (
        SELECT COUNT(*) FROM giveaways WHERE creator_id = users.id
    );
    
    -- Update entry counts
    UPDATE users SET total_entries = (
        SELECT COALESCE(SUM(entry_count), 0) FROM entries WHERE user_id = users.id
    );
    
    -- Update win counts
    UPDATE users SET total_wins = (
        SELECT COUNT(*) FROM winners WHERE user_id = users.id
    );
    
    RAISE NOTICE 'User statistics refreshed';
END;
$$;

-- Create a scheduled function to run stats refresh (you can set this up in Supabase)
-- This reduces the need for real-time calculations in RLS policies

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION auth.current_user_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION refresh_user_stats() TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION auth.current_user_id() IS 'Efficiently gets the current authenticated user ID';
COMMENT ON FUNCTION refresh_user_stats() IS 'Batch updates user statistics to reduce RLS overhead';

-- Performance monitoring query (run this to check improvements)
-- SELECT schemaname, tablename, attname, n_distinct, correlation 
-- FROM pg_stats 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('users', 'profiles', 'giveaways', 'entries')
-- ORDER BY tablename, attname;
