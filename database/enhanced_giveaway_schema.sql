-- Entry Point Giveaway Platform - Enhanced Database Schema
-- This schema supports paid entries, cash prizes, escrow, and platform fees

-- Add new enum types for comprehensive payment handling
CREATE TYPE transaction_type_enum AS ENUM (
  'entry_purchase',     -- User buying giveaway entries
  'prize_deposit',      -- Creator depositing prize money
  'prize_payout',       -- Winner receiving prize money
  'refund',            -- Entry refunds for cancelled giveaways
  'platform_fee',      -- Platform commission
  'creator_payout',    -- Revenue share to creators
  'escrow_hold',       -- Funds held in escrow
  'escrow_release'     -- Funds released from escrow
);

CREATE TYPE escrow_status_enum AS ENUM (
  'pending',           -- Funds deposited, awaiting giveaway completion
  'held',             -- Funds actively held during giveaway
  'released',         -- Funds released to winner
  'refunded'          -- Funds refunded to depositor
);

CREATE TYPE payout_status_enum AS ENUM (
  'pending',          -- Payout initiated but not processed
  'processing',       -- Being processed by payment provider
  'completed',        -- Successfully paid out
  'failed',          -- Payout failed
  'cancelled'        -- Payout cancelled
);

-- Enhanced giveaways table for monetary giveaways
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS giveaway_type TEXT DEFAULT 'standard';
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN DEFAULT false;
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS entry_price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS total_entry_revenue NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS platform_fee_rate NUMERIC(5,4) DEFAULT 0.05; -- 5% default
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS creator_stripe_account_id TEXT;
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS escrow_account_id TEXT;

-- Add monetary prize fields
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS prize_type TEXT DEFAULT 'item';
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS cash_prize_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS prize_deposited BOOLEAN DEFAULT false;
ALTER TABLE public.giveaways ADD COLUMN IF NOT EXISTS prize_deposit_date TIMESTAMP WITH TIME ZONE;

-- Enhanced payments table for comprehensive transaction tracking
DROP TABLE IF EXISTS public.payments CASCADE;
CREATE TABLE public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES public.entries(id) ON DELETE SET NULL,
  
  -- Transaction details
  transaction_type transaction_type_enum NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status payment_status_enum DEFAULT 'pending',
  
  -- Stripe integration
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_payment_method_id TEXT,
  stripe_transfer_id TEXT,
  stripe_charge_id TEXT,
  stripe_account_id TEXT, -- For Connect accounts
  
  -- Platform fees
  platform_fee_amount NUMERIC(10,2) DEFAULT 0,
  net_amount NUMERIC(12,2), -- Amount after fees
  
  -- Additional metadata
  description TEXT,
  payment_metadata JSONB DEFAULT '{}',
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_net_amount CHECK (net_amount <= amount)
);

-- Escrow accounts for holding funds
CREATE TABLE public.escrow_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Escrow details
  total_amount NUMERIC(12,2) DEFAULT 0,
  available_amount NUMERIC(12,2) DEFAULT 0, -- Amount available for payout
  reserved_amount NUMERIC(12,2) DEFAULT 0,  -- Amount reserved for fees
  currency TEXT DEFAULT 'USD',
  status escrow_status_enum DEFAULT 'pending',
  
  -- Stripe escrow account
  stripe_account_id TEXT,
  stripe_balance_transaction_id TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT positive_total CHECK (total_amount >= 0),
  CONSTRAINT valid_amounts CHECK (available_amount + reserved_amount <= total_amount)
);

-- Transaction ledger for audit trail
CREATE TABLE public.transaction_ledger (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
  escrow_account_id UUID REFERENCES public.escrow_accounts(id) ON DELETE SET NULL,
  
  -- Ledger entry details
  debit_amount NUMERIC(12,2) DEFAULT 0,
  credit_amount NUMERIC(12,2) DEFAULT 0,
  balance_after NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  
  -- Reference data
  reference_type TEXT, -- 'entry_purchase', 'prize_deposit', etc.
  reference_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payouts tracking for winners and creators
CREATE TABLE public.payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE,
  escrow_account_id UUID REFERENCES public.escrow_accounts(id) ON DELETE SET NULL,
  
  -- Payout details
  payout_type TEXT NOT NULL, -- 'winner_prize', 'creator_revenue', 'refund'
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status payout_status_enum DEFAULT 'pending',
  
  -- Stripe payout info
  stripe_transfer_id TEXT UNIQUE,
  stripe_payout_id TEXT,
  stripe_account_id TEXT,
  
  -- Banking details (encrypted)
  bank_account_last4 TEXT,
  bank_account_type TEXT,
  
  -- Processing info
  initiated_by UUID REFERENCES public.users(id),
  processing_fee NUMERIC(10,2) DEFAULT 0,
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Enhanced entries table
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS ticket_count INTEGER DEFAULT 1;
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS purchase_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS refund_eligible BOOLEAN DEFAULT true;
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- Update payment reference in entries
ALTER TABLE public.entries 
ALTER COLUMN payment_id TYPE UUID USING payment_id::UUID,
ADD CONSTRAINT fk_entries_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id);

-- Platform configuration for fees and limits
CREATE TABLE public.platform_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default platform configuration
INSERT INTO public.platform_config (config_key, config_value, description) VALUES
('payment_processing_fee', '{"rate": 0.029, "fixed": 0.30}', 'Stripe processing fees: 2.9% + $0.30'),
('platform_commission', '{"rate": 0.05, "min": 0.50}', 'Platform commission: 5% with $0.50 minimum'),
('minimum_giveaway_value', '{"amount": 10.00}', 'Minimum giveaway prize value'),
('maximum_giveaway_value', '{"amount": 10000.00}', 'Maximum giveaway prize value'),
('minimum_entry_price', '{"amount": 1.00}', 'Minimum entry price'),
('maximum_entry_price', '{"amount": 100.00}', 'Maximum entry price per ticket'),
('escrow_hold_period', '{"days": 7}', 'Days to hold funds after giveaway ends'),
('refund_window', '{"hours": 24}', 'Hours after entry purchase for refund eligibility');

-- Enhanced indexes for performance
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_giveaway_id ON public.payments(giveaway_id);
CREATE INDEX idx_payments_type_status ON public.payments(transaction_type, status);
CREATE INDEX idx_payments_stripe_intent ON public.payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);

CREATE INDEX idx_escrow_giveaway ON public.escrow_accounts(giveaway_id);
CREATE INDEX idx_escrow_status ON public.escrow_accounts(status);
CREATE INDEX idx_escrow_stripe_account ON public.escrow_accounts(stripe_account_id);

CREATE INDEX idx_payouts_recipient ON public.payouts(recipient_id);
CREATE INDEX idx_payouts_giveaway ON public.payouts(giveaway_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_payouts_type ON public.payouts(payout_type);

CREATE INDEX idx_ledger_payment ON public.transaction_ledger(payment_id);
CREATE INDEX idx_ledger_escrow ON public.transaction_ledger(escrow_account_id);
CREATE INDEX idx_ledger_created_at ON public.transaction_ledger(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view escrow for their giveaways
CREATE POLICY "Creators can view giveaway escrow" ON public.escrow_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.giveaways 
      WHERE id = giveaway_id AND creator_id = auth.uid()
    )
  );

-- Users can view their own payouts
CREATE POLICY "Users can view own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = recipient_id);

-- Only admins can view platform config
CREATE POLICY "Admins can view platform config" ON public.platform_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Functions for calculating fees and amounts
CREATE OR REPLACE FUNCTION calculate_platform_fee(amount NUMERIC, giveaway_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  fee_rate NUMERIC;
  min_fee NUMERIC;
  calculated_fee NUMERIC;
BEGIN
  -- Get platform commission rate from giveaway or default
  SELECT COALESCE(platform_fee_rate, 0.05) INTO fee_rate
  FROM public.giveaways WHERE id = giveaway_id;
  
  -- Get minimum fee from config
  SELECT (config_value->>'min')::NUMERIC INTO min_fee
  FROM public.platform_config WHERE config_key = 'platform_commission';
  
  calculated_fee := amount * fee_rate;
  
  -- Return the greater of calculated fee or minimum fee
  RETURN GREATEST(calculated_fee, COALESCE(min_fee, 0.50));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_escrow_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'entry_purchase' AND NEW.status = 'completed' THEN
    -- Add entry payment to escrow (minus platform fee)
    INSERT INTO public.escrow_accounts (giveaway_id, total_amount, available_amount)
    VALUES (NEW.giveaway_id, NEW.net_amount, NEW.net_amount)
    ON CONFLICT (giveaway_id) 
    DO UPDATE SET 
      total_amount = escrow_accounts.total_amount + NEW.net_amount,
      available_amount = escrow_accounts.available_amount + NEW.net_amount,
      updated_at = NOW();
      
  ELSIF NEW.transaction_type = 'prize_deposit' AND NEW.status = 'completed' THEN
    -- Add prize deposit to escrow
    INSERT INTO public.escrow_accounts (giveaway_id, total_amount, available_amount)
    VALUES (NEW.giveaway_id, NEW.amount, NEW.amount)
    ON CONFLICT (giveaway_id)
    DO UPDATE SET
      total_amount = escrow_accounts.total_amount + NEW.amount,
      available_amount = escrow_accounts.available_amount + NEW.amount,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update escrow balances
CREATE TRIGGER trigger_update_escrow_balance
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_escrow_balance();

-- Function to create transaction ledger entries
CREATE OR REPLACE FUNCTION create_ledger_entry()
RETURNS TRIGGER AS $$
DECLARE
  current_balance NUMERIC;
  escrow_id UUID;
BEGIN
  -- Get escrow account ID if applicable
  SELECT ea.id INTO escrow_id
  FROM public.escrow_accounts ea
  WHERE ea.giveaway_id = NEW.giveaway_id;
  
  -- Get current balance
  SELECT COALESCE(MAX(balance_after), 0) INTO current_balance
  FROM public.transaction_ledger
  WHERE escrow_account_id = escrow_id;
  
  -- Create ledger entry based on transaction type
  IF NEW.transaction_type IN ('entry_purchase', 'prize_deposit') AND NEW.status = 'completed' THEN
    INSERT INTO public.transaction_ledger (
      payment_id, escrow_account_id, credit_amount, balance_after, 
      description, reference_type, reference_id
    ) VALUES (
      NEW.id, escrow_id, NEW.net_amount, current_balance + NEW.net_amount,
      'Credit: ' || NEW.description, NEW.transaction_type, NEW.giveaway_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ledger entries
CREATE TRIGGER trigger_create_ledger_entry
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION create_ledger_entry();
