-- Database Schema Fixes for Authentication Issues
-- This script addresses conflicts between users and profiles tables

-- Step 1: Create a unified approach using profiles as the main table
-- The profiles table should be the source of truth for user data

-- First, let's ensure all necessary columns exist in profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_giveaways_created INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_entries INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"shareWinPublicly": true, "showFollowersList": true, "showFollowingList": true, "allowProfileViewing": true, "allowSearchDiscovery": true}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_tier TEXT DEFAULT 'bronze';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add check constraints for trust_tier if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'profiles_trust_tier_check'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_trust_tier_check 
        CHECK (trust_tier IN ('bronze', 'silver', 'gold', 'diamond'));
    END IF;
END $$;

-- Add check constraints for role if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'profiles_role_check'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('user', 'creator', 'admin'));
    END IF;
END $$;

-- Create function to handle auth user creation
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
    user_name TEXT;
    user_username TEXT;
    user_email TEXT;
BEGIN
    -- Extract user data from auth.users
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User');
    user_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
    user_email := NEW.email;
    
    -- Ensure username is unique
    WHILE EXISTS (SELECT 1 FROM profiles WHERE username = user_username) LOOP
        user_username := user_username || '_' || floor(random() * 1000)::text;
    END LOOP;
    
    -- Insert into profiles table
    INSERT INTO profiles (
        id,
        username,
        full_name,
        email,
        is_creator,
        avatar_url,
        bio,
        trust_tier,
        role,
        created_at
    ) VALUES (
        NEW.id,
        user_username,
        user_name,
        user_email,
        COALESCE((NEW.raw_user_meta_data->>'is_creator')::boolean, false),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'bio',
        COALESCE(NEW.raw_user_meta_data->>'trust_tier', 'bronze'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        NOW()
    );
    
    -- Also insert into users table if it's being used by other parts of the app
    INSERT INTO users (
        id,
        username,
        name,
        email,
        avatar_url,
        bio,
        is_creator,
        trust_tier,
        created_at
    ) VALUES (
        NEW.id,
        user_username,
        user_name,
        user_email,
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'bio',
        COALESCE((NEW.raw_user_meta_data->>'is_creator')::boolean, false),
        COALESCE(NEW.raw_user_meta_data->>'trust_tier', 'bronze'),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        bio = EXCLUDED.bio,
        is_creator = EXCLUDED.is_creator,
        trust_tier = EXCLUDED.trust_tier,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Create function to sync profile updates to users table
CREATE OR REPLACE FUNCTION sync_profile_to_users()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update users table when profiles is updated
    UPDATE users SET
        username = NEW.username,
        name = NEW.full_name,
        email = NEW.email,
        avatar_url = NEW.avatar_url,
        bio = NEW.bio,
        is_creator = NEW.is_creator,
        is_verified = NEW.is_verified,
        trust_tier = NEW.trust_tier,
        followers_count = NEW.followers_count,
        following_count = NEW.following_count,
        total_giveaways_created = NEW.total_giveaways_created,
        total_entries = NEW.total_entries,
        total_wins = NEW.total_wins,
        privacy_settings = NEW.privacy_settings,
        last_active_at = NEW.last_active_at,
        updated_at = NOW()
    WHERE id = NEW.id;
    
    -- If no row was updated, insert it
    IF NOT FOUND THEN
        INSERT INTO users (
            id, username, name, email, avatar_url, bio, is_creator, is_verified,
            trust_tier, followers_count, following_count, total_giveaways_created,
            total_entries, total_wins, privacy_settings, last_active_at, created_at, updated_at
        ) VALUES (
            NEW.id, NEW.username, NEW.full_name, NEW.email, NEW.avatar_url, NEW.bio,
            NEW.is_creator, NEW.is_verified, NEW.trust_tier, NEW.followers_count,
            NEW.following_count, NEW.total_giveaways_created, NEW.total_entries,
            NEW.total_wins, NEW.privacy_settings, NEW.last_active_at, NOW(), NOW()
        );
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the profile update
    RAISE LOG 'Error in sync_profile_to_users: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger to sync profiles to users
DROP TRIGGER IF EXISTS sync_profile_to_users_trigger ON profiles;
CREATE TRIGGER sync_profile_to_users_trigger
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_profile_to_users();

-- Fix foreign key references to use profiles instead of users where appropriate
-- Note: You may need to update your application code to use profiles table consistently

-- Update notification_preferences to reference profiles
DO $$ 
BEGIN 
    -- Check if the foreign key exists and points to users
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'notification_preferences' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
        AND kcu.referenced_table_name = 'users'
    ) THEN
        -- Drop the existing constraint
        ALTER TABLE notification_preferences DROP CONSTRAINT notification_preferences_user_id_fkey;
        
        -- Add new constraint pointing to profiles
        ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(id);
    END IF;
END $$;

-- Update messages table to reference profiles
DO $$ 
BEGIN 
    -- Check and update sender_id foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'messages' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'sender_id'
        AND kcu.referenced_table_name = 'users'
    ) THEN
        ALTER TABLE messages DROP CONSTRAINT messages_sender_id_fkey;
        ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES profiles(id);
    END IF;
    
    -- Check and update recipient_id foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'messages' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'recipient_id'
        AND kcu.referenced_table_name = 'users'
    ) THEN
        ALTER TABLE messages DROP CONSTRAINT messages_recipient_id_fkey;
        ALTER TABLE messages ADD CONSTRAINT messages_recipient_id_fkey 
        FOREIGN KEY (recipient_id) REFERENCES profiles(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_creator ON profiles(is_creator);
CREATE INDEX IF NOT EXISTS idx_profiles_trust_tier ON profiles(trust_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create view for unified user data (backwards compatibility)
CREATE OR REPLACE VIEW unified_users AS
SELECT 
    p.id,
    p.username,
    p.full_name as name,
    p.email,
    p.avatar_url,
    p.display_name,
    p.bio,
    p.website,
    p.social_links,
    p.is_creator,
    p.is_verified,
    p.verification_type,
    p.kyc_status,
    p.stripe_account_id,
    p.payout_enabled,
    p.notification_preferences,
    p.trust_tier,
    p.role,
    p.followers_count,
    p.following_count,
    p.total_giveaways_created,
    p.total_entries,
    p.total_wins,
    p.privacy_settings,
    p.last_active_at,
    p.created_at,
    p.updated_at,
    -- Additional computed fields
    CASE 
        WHEN p.role = 'admin' THEN true 
        ELSE false 
    END as is_admin
FROM profiles p;

-- Grant access to the view
GRANT SELECT ON unified_users TO authenticated, anon;

-- Function to migrate existing users data to profiles (run once)
CREATE OR REPLACE FUNCTION migrate_users_to_profiles()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert users that exist in users table but not in profiles
    INSERT INTO profiles (
        id, username, full_name, email, avatar_url, bio, website,
        is_creator, is_verified, trust_tier, followers_count, following_count,
        total_giveaways_created, total_entries, total_wins, privacy_settings,
        last_active_at, created_at
    )
    SELECT 
        u.id,
        u.username,
        u.name,
        u.email,
        u.avatar_url,
        u.bio,
        u.website_url,
        u.is_creator,
        u.is_verified,
        u.trust_tier::text,
        u.followers_count,
        u.following_count,
        u.total_giveaways_created,
        u.total_entries,
        u.total_wins,
        u.privacy_settings,
        u.last_active_at,
        u.created_at
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);
    
    RAISE NOTICE 'Migration completed. Check profiles table for migrated data.';
END;
$$;

-- Run the migration (uncomment if you want to run it immediately)
-- SELECT migrate_users_to_profiles();

COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates profile when new auth user is created';
COMMENT ON FUNCTION sync_profile_to_users() IS 'Keeps users table in sync with profiles table for backwards compatibility';
COMMENT ON FUNCTION migrate_users_to_profiles() IS 'One-time migration function to move data from users to profiles table';
