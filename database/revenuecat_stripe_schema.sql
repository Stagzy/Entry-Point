-- Creator Payouts Table
-- Tracks payouts from RevenueCat revenue to creators via Stripe Connect

CREATE TABLE IF NOT EXISTS creator_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    giveaway_id UUID NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Revenue breakdown
    total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Total from RevenueCat
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- Our platform fee (15%)
    creator_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Amount paid to creator
    entry_count INTEGER NOT NULL DEFAULT 0,             -- Number of entries sold
    
    -- Stripe Connect details
    stripe_transfer_id TEXT, -- Stripe transfer ID
    stripe_account_id TEXT,  -- Creator's Connect account
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(giveaway_id), -- One payout per giveaway
    CHECK (total_revenue >= 0),
    CHECK (platform_fee >= 0),
    CHECK (creator_amount >= 0),
    CHECK (entry_count >= 0),
    CHECK (total_revenue = platform_fee + creator_amount)
);

-- Add RLS policies
ALTER TABLE creator_payouts ENABLE ROW LEVEL SECURITY;

-- Creators can view their own payouts
CREATE POLICY "Creators can view own payouts" ON creator_payouts
    FOR SELECT USING (auth.uid() = creator_id);

-- Admins can view all payouts
CREATE POLICY "Admins can view all payouts" ON creator_payouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Only system can insert/update payouts (via service role)
CREATE POLICY "System can manage payouts" ON creator_payouts
    FOR ALL USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX idx_creator_payouts_creator_id ON creator_payouts(creator_id);
CREATE INDEX idx_creator_payouts_giveaway_id ON creator_payouts(giveaway_id);
CREATE INDEX idx_creator_payouts_status ON creator_payouts(status);
CREATE INDEX idx_creator_payouts_processed_at ON creator_payouts(processed_at);

-- Update trigger
CREATE TRIGGER update_creator_payouts_updated_at
    BEFORE UPDATE ON creator_payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add payment_method column to orders table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'revenuecat'));
    END IF;
END $$;

-- Add entry_count column to orders table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'entry_count'
    ) THEN
        ALTER TABLE orders ADD COLUMN entry_count INTEGER DEFAULT 1;
    END IF;
END $$;

-- Add transaction_id column to orders table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'transaction_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN transaction_id TEXT;
    END IF;
END $$;

-- Add metadata column to orders table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE orders ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Revenue Analytics View
-- Provides aggregated revenue data for analytics
CREATE OR REPLACE VIEW revenue_analytics AS
SELECT 
    DATE_TRUNC('day', o.created_at) as date,
    COUNT(*) as transaction_count,
    SUM(o.total_amount) as total_revenue,
    SUM(o.entry_count) as total_entries_sold,
    AVG(o.total_amount) as avg_transaction_value,
    
    -- Breakdown by payment method
    SUM(CASE WHEN o.payment_method = 'revenuecat' THEN o.total_amount ELSE 0 END) as revenuecat_revenue,
    SUM(CASE WHEN o.payment_method = 'stripe' THEN o.total_amount ELSE 0 END) as stripe_revenue,
    
    -- Creator payout data (from completed payouts)
    COALESCE(payout_data.platform_fees, 0) as platform_fees_paid,
    COALESCE(payout_data.creator_amounts, 0) as creator_amounts_paid,
    COALESCE(payout_data.payout_count, 0) as payouts_processed
    
FROM orders o
LEFT JOIN (
    SELECT 
        DATE_TRUNC('day', processed_at) as date,
        SUM(platform_fee) as platform_fees,
        SUM(creator_amount) as creator_amounts,
        COUNT(*) as payout_count
    FROM creator_payouts 
    WHERE status = 'completed' 
    GROUP BY DATE_TRUNC('day', processed_at)
) payout_data ON DATE_TRUNC('day', o.created_at) = payout_data.date

WHERE o.status = 'completed'
GROUP BY DATE_TRUNC('day', o.created_at), payout_data.platform_fees, payout_data.creator_amounts, payout_data.payout_count
ORDER BY date DESC;

-- Grant access to the view
GRANT SELECT ON revenue_analytics TO authenticated;

-- Creator earnings view
CREATE OR REPLACE VIEW creator_earnings AS
SELECT 
    p.id as creator_id,
    p.username as creator_name,
    COUNT(cp.id) as total_payouts,
    COALESCE(SUM(cp.creator_amount), 0) as total_earnings,
    COALESCE(SUM(cp.total_revenue), 0) as total_revenue_generated,
    COALESCE(SUM(cp.platform_fee), 0) as total_platform_fees,
    COALESCE(SUM(cp.entry_count), 0) as total_entries_sold,
    MAX(cp.processed_at) as last_payout_date,
    
    -- Current month earnings
    COALESCE(
        SUM(CASE 
            WHEN DATE_TRUNC('month', cp.processed_at) = DATE_TRUNC('month', NOW()) 
            THEN cp.creator_amount ELSE 0 
        END), 0
    ) as current_month_earnings
    
FROM profiles p
LEFT JOIN creator_payouts cp ON p.id = cp.creator_id AND cp.status = 'completed'
WHERE p.role = 'creator'
GROUP BY p.id, p.username
ORDER BY total_earnings DESC;

-- Grant access to the view
GRANT SELECT ON creator_earnings TO authenticated;

-- Add RLS policy for creator earnings view
CREATE POLICY "Users can view creator earnings" ON creator_earnings
    FOR SELECT USING (
        -- Creators can see their own data
        auth.uid() = creator_id 
        OR 
        -- Admins can see all data
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
        OR
        -- Public can see aggregated data (earnings only, not personal info)
        TRUE
    );

COMMENT ON TABLE creator_payouts IS 'Tracks payouts from RevenueCat revenue to creators via Stripe Connect';
COMMENT ON VIEW revenue_analytics IS 'Aggregated revenue data for platform analytics';
COMMENT ON VIEW creator_earnings IS 'Creator earnings summary and statistics';
