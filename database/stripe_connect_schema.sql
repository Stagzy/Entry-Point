-- Add Stripe Connect accounts table for creator payouts
CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  stripe_account_id TEXT UNIQUE NOT NULL,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  details_submitted BOOLEAN DEFAULT FALSE,
  
  -- Account information
  country TEXT DEFAULT 'US',
  default_currency TEXT DEFAULT 'usd',
  
  -- Platform fee settings
  platform_fee_percentage DECIMAL(5,2) DEFAULT 5.00, -- 5% platform fee
  
  -- Status tracking
  requirements_currently_due TEXT[],
  requirements_eventually_due TEXT[],
  requirements_past_due TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Add orders table for tracking all purchases (replaces payments table concept)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Order details
  ticket_count INTEGER NOT NULL DEFAULT 1,
  ticket_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  creator_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  
  -- Stripe information
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_transfer_id TEXT, -- Transfer to creator's Connect account
  
  -- Status tracking
  status payment_status_enum DEFAULT 'pending',
  payment_completed_at TIMESTAMP WITH TIME ZONE,
  transfer_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  payment_method_type TEXT,
  payment_metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_amounts CHECK (
    ticket_count > 0 AND 
    ticket_price >= 0 AND 
    subtotal >= 0 AND 
    platform_fee >= 0 AND 
    creator_amount >= 0 AND 
    total_amount >= 0
  ),
  CONSTRAINT valid_math CHECK (
    subtotal = ticket_count * ticket_price AND
    total_amount = subtotal AND
    creator_amount = subtotal - platform_fee
  )
);

-- Update giveaways table to include ARV and sponsor information
ALTER TABLE public.giveaways 
ADD COLUMN IF NOT EXISTS arv DECIMAL(10,2), -- Approximate Retail Value
ADD COLUMN IF NOT EXISTS sponsor_name TEXT,
ADD COLUMN IF NOT EXISTS sponsor_logo_url TEXT,
ADD COLUMN IF NOT EXISTS official_rules_url TEXT,
ADD COLUMN IF NOT EXISTS requires_kyc BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS minimum_age INTEGER DEFAULT 18;

-- Update entries table to distinguish between paid and free entries
ALTER TABLE public.entries 
ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'purchase', -- 'purchase', 'free', 'referral', 'social'
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS verification_data JSONB; -- Store proof of entry requirements

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_user_id ON stripe_connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_stripe_id ON stripe_connect_accounts(stripe_account_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_giveaway_id ON orders(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_entries_order_id ON entries(order_id);
CREATE INDEX IF NOT EXISTS idx_entries_entry_type ON entries(entry_type);

-- Row Level Security for new tables
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stripe_connect_accounts
CREATE POLICY "Users can view own connect account" ON stripe_connect_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own connect account" ON stripe_connect_accounts
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Creators can view orders for their giveaways" ON orders
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated trigger function for order completion
CREATE OR REPLACE FUNCTION handle_order_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When an order is marked as completed, create the corresponding entries
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Insert or update entries
    INSERT INTO entries (
      user_id,
      giveaway_id,
      entry_count,
      total_cost,
      entry_type,
      order_id,
      payment_id,
      payment_status,
      status
    ) VALUES (
      NEW.user_id,
      NEW.giveaway_id,
      NEW.ticket_count,
      NEW.total_amount,
      'purchase',
      NEW.id,
      NEW.stripe_payment_intent_id,
      'completed',
      'entered'
    )
    ON CONFLICT (user_id, giveaway_id) 
    DO UPDATE SET
      entry_count = entries.entry_count + NEW.ticket_count,
      total_cost = entries.total_cost + NEW.total_amount,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order completion
DROP TRIGGER IF EXISTS trigger_handle_order_completion ON orders;
CREATE TRIGGER trigger_handle_order_completion
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_completion();

-- Add updated_at trigger for new tables
CREATE TRIGGER update_stripe_connect_accounts_updated_at 
  BEFORE UPDATE ON stripe_connect_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add refunds table for tracking all refunds
CREATE TABLE IF NOT EXISTS refunds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  admin_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Refund details
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_type TEXT NOT NULL, -- 'full', 'partial'
  reason TEXT,
  
  -- Stripe information
  stripe_refund_id TEXT UNIQUE,
  stripe_reverse_transfer_id TEXT, -- If we needed to reverse a transfer
  
  -- Status and timing
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT positive_refund_amount CHECK (refund_amount > 0)
);

-- Add receipts table for tracking receipt generation
CREATE TABLE IF NOT EXISTS receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Receipt details
  email_sent_to TEXT,
  receipt_data JSONB NOT NULL,
  email_service_id TEXT, -- ID from email service provider
  
  -- Status tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(order_id) -- One receipt per order
);

-- Add function to decrement giveaway entries (for refunds)
CREATE OR REPLACE FUNCTION decrement_giveaway_entries(giveaway_id UUID, entry_count INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE giveaways 
  SET total_entries = GREATEST(0, total_entries - entry_count)
  WHERE id = giveaway_id;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_stripe_id ON refunds(stripe_refund_id);

CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_email_sent ON receipts(email_sent);

-- Row Level Security for new tables
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for refunds
CREATE POLICY "Users can view own refunds" ON refunds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all refunds" ON refunds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can create refunds" ON refunds
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for receipts
CREATE POLICY "Users can view own receipts" ON receipts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create receipts" ON receipts
  FOR INSERT WITH CHECK (true); -- Service role will handle this

-- Add updated_at triggers for new tables
CREATE TRIGGER update_refunds_updated_at 
  BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add order status enum if not exists
DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partially_refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update orders table status column to use enum
ALTER TABLE orders ALTER COLUMN status TYPE order_status_enum USING status::order_status_enum;
