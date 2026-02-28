-- STEP 2: Create Tables and Data (Run this AFTER step 1)
-- This runs after the diamond enum value has been committed

-- =========================================
-- CREATE TRUST TIER PRIVILEGES TABLE
-- =========================================

-- Create trust tier privileges table
CREATE TABLE IF NOT EXISTS public.trust_tier_privileges (
    tier trust_tier_enum PRIMARY KEY,
    max_giveaways_per_month integer NOT NULL DEFAULT 1,
    max_total_prize_value numeric(10,2) NOT NULL DEFAULT 100.00,
    can_feature_giveaways boolean NOT NULL DEFAULT false,
    can_use_external_links boolean NOT NULL DEFAULT false,
    priority_support boolean NOT NULL DEFAULT false,
    custom_profile_features boolean NOT NULL DEFAULT false,
    analytics_access boolean NOT NULL DEFAULT false,
    api_access boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =========================================
-- INSERT TIER PRIVILEGES DATA
-- =========================================

-- Insert privilege settings for each tier (now diamond is available)
INSERT INTO public.trust_tier_privileges (
    tier, max_giveaways_per_month, max_total_prize_value, 
    can_feature_giveaways, can_use_external_links, priority_support,
    custom_profile_features, analytics_access, api_access
) VALUES 
    ('bronze', 1, 100.00, false, false, false, false, false, false),
    ('silver', 3, 500.00, false, true, false, true, false, false),
    ('gold', 5, 1000.00, true, true, true, true, true, false),
    ('platinum', 10, 5000.00, true, true, true, true, true, true),
    ('diamond', 25, 25000.00, true, true, true, true, true, true)
ON CONFLICT (tier) DO UPDATE SET
    max_giveaways_per_month = EXCLUDED.max_giveaways_per_month,
    max_total_prize_value = EXCLUDED.max_total_prize_value,
    can_feature_giveaways = EXCLUDED.can_feature_giveaways,
    can_use_external_links = EXCLUDED.can_use_external_links,
    priority_support = EXCLUDED.priority_support,
    custom_profile_features = EXCLUDED.custom_profile_features,
    analytics_access = EXCLUDED.analytics_access,
    api_access = EXCLUDED.api_access,
    updated_at = now();

-- =========================================
-- ADD PAYMENT METHODS TABLE
-- =========================================

-- Create user_payment_methods table
CREATE TABLE IF NOT EXISTS public.user_payment_methods (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    stripe_payment_method_id text NOT NULL,
    card_brand text,
    card_last4 text,
    card_exp_month integer,
    card_exp_year integer,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON public.user_payment_methods(user_id);

-- =========================================
-- ENABLE BASIC RLS POLICIES
-- =========================================

-- Enable RLS on new tables
ALTER TABLE public.trust_tier_privileges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trust tier privileges (read-only for all)
DROP POLICY IF EXISTS "Trust tier privileges are readable by all" ON public.trust_tier_privileges;
CREATE POLICY "Trust tier privileges are readable by all" ON public.trust_tier_privileges
    FOR SELECT USING (true);

-- RLS Policies for payment methods
DROP POLICY IF EXISTS "Users can manage own payment methods" ON public.user_payment_methods;
CREATE POLICY "Users can manage own payment methods" ON public.user_payment_methods
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.trust_tier_privileges TO authenticated;
GRANT ALL ON public.user_payment_methods TO authenticated;
