-- STEP 1: Add Diamond Tier (Run this first)
-- This must be run separately due to PostgreSQL enum transaction requirements

-- Add diamond tier to trust_tier_enum if not exists
DO $$ 
BEGIN
    -- Check if diamond already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'diamond' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'trust_tier_enum')
    ) THEN
        -- Add diamond to existing enum (safer approach)
        ALTER TYPE trust_tier_enum ADD VALUE 'diamond';
    END IF;
END $$;

-- Fix users table name column while we're here
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name text;

-- Update name column with safe defaults
UPDATE public.users SET name = COALESCE(name, username, 'User') WHERE name IS NULL OR name = '';

-- Set NOT NULL constraint only if table has data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
        ALTER TABLE public.users ALTER COLUMN name SET NOT NULL;
    END IF;
END $$;
