-- =======================================================
-- COMPLETE RLS AUDIT AND SECURITY HARDENING
-- =======================================================
-- Comprehensive Row Level Security audit to ensure all tables
-- are properly secured and no data leaks are possible.
--
-- This script verifies and fixes RLS policies across all tables
-- to meet production security standards.
-- =======================================================

-- Check which tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Missing'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY rowsecurity DESC, tablename;

-- =======================================================
-- ENABLE RLS ON ALL MISSING TABLES
-- =======================================================

-- Core tables (should already be enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Additional tables that might be missing RLS
DO $$ 
BEGIN
    -- Enable RLS on tables that exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments' AND table_schema = 'public') THEN
        ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports' AND table_schema = 'public') THEN
        ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions' AND table_schema = 'public') THEN
        ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =======================================================
-- COMPREHENSIVE RLS POLICIES
-- =======================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role has full access to users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Profiles table policies  
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access to profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Giveaways table policies
DROP POLICY IF EXISTS "Anyone can view published giveaways" ON public.giveaways;
DROP POLICY IF EXISTS "Creators can manage own giveaways" ON public.giveaways;
DROP POLICY IF EXISTS "Admins can manage all giveaways" ON public.giveaways;

CREATE POLICY "Anyone can view published giveaways" ON public.giveaways
    FOR SELECT USING (
        status IN ('active', 'ended') 
        AND moderation_status = 'approved'
    );

CREATE POLICY "Creators can view own giveaways" ON public.giveaways
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert new giveaways" ON public.giveaways
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own giveaways" ON public.giveaways
    FOR UPDATE USING (
        auth.uid() = creator_id 
        AND status IN ('draft', 'pending_approval')
    );

CREATE POLICY "Admins can manage all giveaways" ON public.giveaways
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Service role has full access to giveaways" ON public.giveaways
    FOR ALL USING (auth.role() = 'service_role');

-- Entries table policies
DROP POLICY IF EXISTS "Users can view own entries" ON public.entries;
DROP POLICY IF EXISTS "Creators can view entries for their giveaways" ON public.entries;
DROP POLICY IF EXISTS "Users can create entries" ON public.entries;

CREATE POLICY "Users can view own entries" ON public.entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Creators can view entries for their giveaways" ON public.entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM giveaways 
            WHERE id = giveaway_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can create entries" ON public.entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage entries" ON public.entries
    FOR ALL USING (auth.role() = 'service_role');

-- Payments table policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Creators can view payments for their giveaways" ON public.payments;

CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Creators can view payments for their giveaways" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM giveaways 
            WHERE id = giveaway_id AND creator_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage payments" ON public.payments
    FOR ALL USING (auth.role() = 'service_role');

-- Followers table policies
DROP POLICY IF EXISTS "Users can view all followers" ON public.followers;
DROP POLICY IF EXISTS "Users can manage own following" ON public.followers;

CREATE POLICY "Users can view all followers" ON public.followers
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own following" ON public.followers
    FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Service role can manage followers" ON public.followers
    FOR ALL USING (auth.role() = 'service_role');

-- =======================================================
-- SECURITY FUNCTIONS
-- =======================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns giveaway
CREATE OR REPLACE FUNCTION auth.owns_giveaway(giveaway_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.giveaways
        WHERE id = giveaway_id AND creator_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can moderate
CREATE OR REPLACE FUNCTION auth.can_moderate()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() 
        AND (is_admin = true OR role IN ('moderator', 'owner'))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================================================
-- BACKUP AND MONITORING POLICIES
-- =======================================================

-- Create backup monitoring table
CREATE TABLE IF NOT EXISTS backup_monitoring (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_type text NOT NULL,              -- 'daily', 'manual', 'pre_release'
    backup_size bigint,                     -- Size in bytes
    tables_backed_up text[],                -- List of tables
    backup_location text,                   -- S3 path, etc.
    status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    error_message text,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    created_by text DEFAULT 'system'
);

-- Enable RLS on backup monitoring
ALTER TABLE backup_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backup status" ON backup_monitoring
    FOR SELECT USING (auth.is_admin());

CREATE POLICY "Service role can manage backups" ON backup_monitoring
    FOR ALL USING (auth.role() = 'service_role');

-- =======================================================
-- ADDITIONAL SECURITY MEASURES
-- =======================================================

-- Revoke default permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;

-- Grant specific permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant table permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =======================================================
-- SECURITY VALIDATION QUERIES
-- =======================================================

-- View to check RLS status
CREATE OR REPLACE VIEW security_audit AS
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    (SELECT count(*) FROM pg_policies WHERE tablename = pg_tables.tablename) as policy_count,
    CASE 
        WHEN rowsecurity AND (SELECT count(*) FROM pg_policies WHERE tablename = pg_tables.tablename) > 0 
        THEN '✅ Secure'
        WHEN rowsecurity AND (SELECT count(*) FROM pg_policies WHERE tablename = pg_tables.tablename) = 0 
        THEN '⚠️ RLS enabled but no policies'
        ELSE '❌ Vulnerable'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY security_status, tablename;

-- Function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE(table_name text, test_result text) AS $$
BEGIN
    -- Test that users can't see other users' private data
    RETURN QUERY
    SELECT 
        'users'::text,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM public.users 
                WHERE id != auth.uid() 
                AND email IS NOT NULL
            ) 
            THEN '❌ Can see other users private data'
            ELSE '✅ RLS working correctly'
        END;
    
    -- Add more tests as needed
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================================================
-- MONITORING AND ALERTING
-- =======================================================

-- Function to check for security violations
CREATE OR REPLACE FUNCTION detect_security_violations()
RETURNS TABLE(violation_type text, details text, severity text) AS $$
BEGIN
    -- Check for tables without RLS
    RETURN QUERY
    SELECT 
        'missing_rls'::text,
        'Table: ' || tablename || ' does not have RLS enabled',
        'high'::text
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND rowsecurity = false;
    
    -- Check for RLS without policies
    RETURN QUERY
    SELECT 
        'rls_no_policies'::text,
        'Table: ' || tablename || ' has RLS but no policies',
        'high'::text
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND rowsecurity = true
    AND (SELECT count(*) FROM pg_policies WHERE tablename = pg_tables.tablename) = 0;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================================================
-- DATA CLASSIFICATION
-- =======================================================

-- Add comments to classify data sensitivity
COMMENT ON TABLE users IS 'SENSITIVE: Contains PII and authentication data';
COMMENT ON TABLE profiles IS 'PUBLIC: User profiles visible to all users';
COMMENT ON TABLE giveaways IS 'PUBLIC: Giveaway information visible to participants';
COMMENT ON TABLE entries IS 'PRIVATE: User entry data, restricted access';
COMMENT ON TABLE payments IS 'SENSITIVE: Financial transaction data';
COMMENT ON TABLE security_events IS 'INTERNAL: Security monitoring data';
COMMENT ON TABLE rate_limit_usage IS 'INTERNAL: Rate limiting tracking';

-- =======================================================
-- FINAL SECURITY VALIDATION
-- =======================================================

-- Run security audit
SELECT 'Security Audit Results:' as audit_status;
SELECT * FROM security_audit;

-- Check for violations  
SELECT 'Security Violations:' as violation_check;
SELECT * FROM detect_security_violations();

-- Summary
SELECT 
    COUNT(*) as total_tables,
    SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) as tables_with_rls,
    SUM(CASE WHEN rowsecurity AND (SELECT count(*) FROM pg_policies WHERE tablename = pg_tables.tablename) > 0 THEN 1 ELSE 0 END) as fully_secured_tables
FROM pg_tables 
WHERE schemaname = 'public';

SELECT '✅ RLS Security Audit Complete' as status;
