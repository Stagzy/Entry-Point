-- Fairness and Verification System Schema
-- Add these tables to support verifiable winner selection

-- Giveaway seeds for verifiable randomness
CREATE TABLE IF NOT EXISTS giveaway_seeds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Seed commitment system
  seed_hash TEXT NOT NULL,        -- SHA256 hash published before giveaway ends
  seed_value TEXT NOT NULL,       -- Actual seed revealed after winner selection
  
  -- Status tracking
  revealed BOOLEAN DEFAULT FALSE,
  committed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revealed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(giveaway_id)
);

-- Fairness proofs for transparent winner selection
CREATE TABLE IF NOT EXISTS fairness_proofs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE NOT NULL,
  seed_id UUID REFERENCES giveaway_seeds(id) ON DELETE CASCADE NOT NULL,
  
  -- Winner information
  winner_entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE NOT NULL,
  winner_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Cryptographic proof data
  seed_value TEXT NOT NULL,
  seed_hash TEXT NOT NULL,
  winner_input TEXT NOT NULL,     -- payment_intent_id or entry_id used
  winner_hash TEXT NOT NULL,      -- HMAC_SHA256 result
  
  -- Selection metadata
  total_entries INTEGER NOT NULL,
  selection_method TEXT DEFAULT 'HMAC_SHA256_MAX',
  all_calculations JSONB,         -- Full proof for all entries
  
  -- Verification
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(giveaway_id)
);

-- Content moderation logs
CREATE TABLE IF NOT EXISTS content_moderation (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_type TEXT NOT NULL,     -- 'giveaway_image', 'comment', 'giveaway_description'
  content_id UUID NOT NULL,       -- ID of the content being moderated
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Moderation results
  status moderation_status_enum DEFAULT 'pending',
  ai_confidence DECIMAL(3,2),     -- 0.00 to 1.00 confidence score
  flagged_categories TEXT[],      -- ['nsfw', 'violence', 'hate', 'spam']
  
  -- Review information
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User verification status (KYC)
CREATE TABLE IF NOT EXISTS user_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Verification status
  verification_status verification_status_enum DEFAULT 'unverified',
  verification_level INTEGER DEFAULT 0, -- 0=none, 1=basic, 2=enhanced, 3=full
  
  -- Document verification
  documents_submitted BOOLEAN DEFAULT FALSE,
  documents_verified BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  address_verified BOOLEAN DEFAULT FALSE,
  
  -- Age verification (required for creators)
  age_verified BOOLEAN DEFAULT FALSE,
  date_of_birth DATE,
  
  -- KYC provider information
  kyc_provider TEXT,              -- 'stripe', 'jumio', 'onfido', etc.
  kyc_session_id TEXT,
  kyc_reference_id TEXT,
  
  -- Geographic compliance
  verified_country TEXT,
  verified_state TEXT,
  eligible_for_creation BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  verification_started_at TIMESTAMP WITH TIME ZONE,
  verification_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- AMOE (Alternative Method of Entry) rate limiting
CREATE TABLE IF NOT EXISTS amoe_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Entry details
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ip_address INET,
  user_agent TEXT,
  
  -- Verification data
  verification_data JSONB,        -- Address, phone, etc. for eligibility
  
  -- Status
  status TEXT DEFAULT 'active',   -- 'active', 'revoked', 'disqualified'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Enforce one entry per user per giveaway per day
  UNIQUE(giveaway_id, user_id, entry_date)
);

-- Create enums
DO $$ BEGIN
    CREATE TYPE moderation_status_enum AS ENUM ('pending', 'approved', 'rejected', 'flagged');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status_enum AS ENUM ('unverified', 'pending', 'verified', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add fairness proof reference to giveaways
ALTER TABLE public.giveaways 
ADD COLUMN IF NOT EXISTS fairness_proof_id UUID REFERENCES fairness_proofs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS seed_hash TEXT,  -- Published before giveaway ends
ADD COLUMN IF NOT EXISTS moderation_status moderation_status_enum DEFAULT 'pending';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_giveaway_seeds_giveaway_id ON giveaway_seeds(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_fairness_proofs_giveaway_id ON fairness_proofs(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_content ON content_moderation(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON content_moderation(status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_amoe_entries_daily ON amoe_entries(giveaway_id, user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_amoe_entries_ip ON amoe_entries(ip_address, entry_date);

-- Row Level Security
ALTER TABLE giveaway_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE fairness_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE amoe_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Giveaway seeds - creators can see their own, everyone can see revealed hashes
CREATE POLICY "Creators can manage own giveaway seeds" ON giveaway_seeds
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Public can view revealed seed hashes" ON giveaway_seeds
  FOR SELECT USING (revealed = true);

-- Fairness proofs - public read access for transparency
CREATE POLICY "Public can view fairness proofs" ON fairness_proofs
  FOR SELECT USING (true);

CREATE POLICY "Creators can create fairness proofs" ON fairness_proofs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM giveaways 
      WHERE id = giveaway_id AND creator_id = auth.uid()
    )
  );

-- User verifications - users can see own, admins can see all
CREATE POLICY "Users can view own verification" ON user_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verifications" ON user_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- AMOE entries - users can see own, creators can see for their giveaways
CREATE POLICY "Users can view own AMOE entries" ON amoe_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Creators can view AMOE entries for their giveaways" ON amoe_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM giveaways 
      WHERE id = giveaway_id AND creator_id = auth.uid()
    )
  );

-- Functions

-- Function to check AMOE daily limits
CREATE OR REPLACE FUNCTION check_amoe_daily_limit(
  p_giveaway_id UUID,
  p_user_id UUID,
  p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_entries_today INTEGER;
  ip_entries_today INTEGER;
BEGIN
  -- Check user daily limit (1 per day)
  SELECT COUNT(*) INTO user_entries_today
  FROM amoe_entries
  WHERE giveaway_id = p_giveaway_id 
    AND user_id = p_user_id 
    AND entry_date = CURRENT_DATE;
  
  IF user_entries_today > 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Check IP daily limit (max 3 per day to prevent abuse)
  IF p_ip_address IS NOT NULL THEN
    SELECT COUNT(*) INTO ip_entries_today
    FROM amoe_entries
    WHERE giveaway_id = p_giveaway_id 
      AND ip_address = p_ip_address 
      AND entry_date = CURRENT_DATE;
    
    IF ip_entries_today >= 3 THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate geographic eligibility
CREATE OR REPLACE FUNCTION validate_geographic_eligibility(
  p_country TEXT,
  p_state TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only allow US residents
  IF p_country != 'US' AND p_country != 'United States' THEN
    RETURN FALSE;
  END IF;
  
  -- Block excluded states
  IF p_state IN ('NY', 'New York', 'FL', 'Florida', 'RI', 'Rhode Island') THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Updated triggers
CREATE TRIGGER update_giveaway_seeds_updated_at 
  BEFORE UPDATE ON giveaway_seeds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_moderation_updated_at 
  BEFORE UPDATE ON content_moderation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_verifications_updated_at 
  BEFORE UPDATE ON user_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
