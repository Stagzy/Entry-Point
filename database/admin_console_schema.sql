-- admin_console_schema.sql - Database Schema for Admin Console & Support
-- 
-- PURPOSE:
-- Complete database schema for admin console operations, support system,
-- dispute handling, and comprehensive audit logging.
-- 
-- FEATURES:
-- Admin audit trails with full action history
-- Support ticket system with message threading
-- FAQ management with search capabilities
-- Canned responses for efficient support
-- Payment dispute tracking and resolution
-- User verification and KYC workflow
-- Refund processing and tracking

-- Enable RLS on all tables
ALTER DATABASE postgres SET row_level_security = on;

-- Admin Audit Log Table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'giveaway', 'user', 'payment', 'entry'
    target_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    type TEXT NOT NULL DEFAULT 'general',
    priority TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'open',
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    resolved_by UUID REFERENCES auth.users(id),
    escalated_by UUID REFERENCES auth.users(id),
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalation_reason TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution TEXT,
    last_response_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    linked_dispute_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Messages Table  
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    message TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'agent', 'system'
    attachments JSONB DEFAULT '[]',
    internal_note BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAQ Items Table
CREATE TABLE IF NOT EXISTS faq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Canned Responses Table
CREATE TABLE IF NOT EXISTS canned_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Canned Response Usage Tracking
CREATE TABLE IF NOT EXISTS canned_response_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES canned_responses(id),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id),
    used_by UUID NOT NULL REFERENCES auth.users(id),
    customizations JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Verifications Table (KYC)
CREATE TABLE IF NOT EXISTS user_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    verification_status TEXT NOT NULL DEFAULT 'pending',
    verification_level INTEGER DEFAULT 1, -- 1=basic, 2=standard, 3=enhanced
    documents_submitted JSONB DEFAULT '[]',
    documents_verified BOOLEAN DEFAULT FALSE,
    identity_verified BOOLEAN DEFAULT FALSE,
    address_verified BOOLEAN DEFAULT FALSE,
    verification_submitted_at TIMESTAMP WITH TIME ZONE,
    verification_completed_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Disputes Table
CREATE TABLE IF NOT EXISTS payment_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id TEXT NOT NULL,
    entry_id UUID REFERENCES entries(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    giveaway_id UUID REFERENCES giveaways(id),
    original_ticket_id UUID REFERENCES support_tickets(id),
    dispute_type TEXT NOT NULL, -- 'chargeback', 'refund_request', 'fraud_claim', 'support_escalation'
    status TEXT NOT NULL DEFAULT 'open',
    amount DECIMAL(10,2),
    description TEXT,
    evidence_provided JSONB DEFAULT '[]',
    handled_by UUID REFERENCES auth.users(id),
    admin_action TEXT,
    admin_notes TEXT,
    stripe_dispute_id TEXT,
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    priority TEXT DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds Table
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES entries(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    giveaway_id UUID NOT NULL REFERENCES giveaways(id),
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    stripe_refund_id TEXT,
    payment_intent_id TEXT,
    initiated_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Agents Table
CREATE TABLE IF NOT EXISTS support_agents (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    specialization TEXT[], -- ['payment', 'technical', 'giveaway', 'account']
    available BOOLEAN DEFAULT TRUE,
    current_load INTEGER DEFAULT 0,
    max_concurrent_tickets INTEGER DEFAULT 10,
    average_response_time INTERVAL,
    total_tickets_handled INTEGER DEFAULT 0,
    satisfaction_rating DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Satisfaction Surveys Table
CREATE TABLE IF NOT EXISTS satisfaction_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    agent_id UUID REFERENCES auth.users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    would_recommend BOOLEAN,
    response_time_rating INTEGER CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
    resolution_rating INTEGER CHECK (resolution_rating >= 1 AND resolution_rating <= 5),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target ON admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_faq_items_category ON faq_items(category);
CREATE INDEX IF NOT EXISTS idx_faq_items_published ON faq_items(published, display_order);

CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_verifications(verification_status);

CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_user_id ON payment_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_created_at ON payment_disputes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON refunds(created_at DESC);

-- Row Level Security Policies

-- Admin Audit Log - Only admins can view
CREATE POLICY "Admins can view all audit logs" ON admin_audit_log
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON admin_audit_log
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

-- Support Tickets - Users can view their own, agents can view assigned
CREATE POLICY "Users can view their own tickets" ON support_tickets
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Agents can view assigned tickets" ON support_tickets
    FOR SELECT TO authenticated
    USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'support_agent')
        )
    );

CREATE POLICY "Users can create tickets" ON support_tickets
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Agents can update tickets" ON support_tickets
    FOR UPDATE TO authenticated
    USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'support_agent')
        )
    );

-- Support Messages - Linked to ticket access
CREATE POLICY "Users can view messages for their tickets" ON support_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE support_tickets.id = support_messages.ticket_id 
            AND (support_tickets.user_id = auth.uid() OR support_tickets.assigned_to = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'support_agent')
        )
    );

CREATE POLICY "Users can add messages to their tickets" ON support_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE support_tickets.id = support_messages.ticket_id 
            AND (support_tickets.user_id = auth.uid() OR support_tickets.assigned_to = auth.uid())
        ) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'support_agent')
        )
    );

-- FAQ Items - Public read, admin write
CREATE POLICY "Anyone can view published FAQs" ON faq_items
    FOR SELECT TO authenticated
    USING (published = TRUE);

CREATE POLICY "Admins can manage FAQs" ON faq_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Canned Responses - Support agents and admins only
CREATE POLICY "Support staff can view canned responses" ON canned_responses
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'support_agent')
        )
    );

CREATE POLICY "Admins can manage canned responses" ON canned_responses
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- User Verifications - Users can view their own, admins can view all
CREATE POLICY "Users can view their own verification" ON user_verifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all verifications" ON user_verifications
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can create their own verification" ON user_verifications
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update verifications" ON user_verifications
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Payment Disputes - Users can view their own, admins can view all
CREATE POLICY "Users can view their own disputes" ON payment_disputes
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all disputes" ON payment_disputes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System can create disputes" ON payment_disputes
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

CREATE POLICY "Admins can update disputes" ON payment_disputes
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Refunds - Users can view their own, admins can view all
CREATE POLICY "Users can view their own refunds" ON refunds
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all refunds" ON refunds
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage refunds" ON refunds
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Enable RLS on all tables
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_response_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE satisfaction_surveys ENABLE ROW LEVEL SECURITY;

-- Functions for automated operations

-- Function to update ticket timestamp on message
CREATE OR REPLACE FUNCTION update_ticket_last_response()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE support_tickets 
    SET last_response_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.ticket_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating ticket timestamps
DROP TRIGGER IF EXISTS update_ticket_last_response_trigger ON support_messages;
CREATE TRIGGER update_ticket_last_response_trigger
    AFTER INSERT ON support_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_last_response();

-- Function to increment canned response usage
CREATE OR REPLACE FUNCTION increment_canned_response_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE canned_responses 
    SET usage_count = usage_count + 1
    WHERE id = NEW.response_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for canned response usage tracking
DROP TRIGGER IF EXISTS increment_canned_response_usage_trigger ON canned_response_usage;
CREATE TRIGGER increment_canned_response_usage_trigger
    AFTER INSERT ON canned_response_usage
    FOR EACH ROW
    EXECUTE FUNCTION increment_canned_response_usage();

-- Function to auto-assign support tickets
CREATE OR REPLACE FUNCTION auto_assign_ticket()
RETURNS TRIGGER AS $$
DECLARE
    available_agent_id UUID;
BEGIN
    -- Find available agent with lowest current load
    SELECT id INTO available_agent_id
    FROM support_agents
    WHERE available = TRUE 
    AND (specialization IS NULL OR NEW.type = ANY(specialization))
    AND current_load < max_concurrent_tickets
    ORDER BY current_load ASC, random()
    LIMIT 1;
    
    IF available_agent_id IS NOT NULL THEN
        NEW.assigned_to := available_agent_id;
        
        -- Update agent load
        UPDATE support_agents 
        SET current_load = current_load + 1
        WHERE id = available_agent_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-assignment
DROP TRIGGER IF EXISTS auto_assign_ticket_trigger ON support_tickets;
CREATE TRIGGER auto_assign_ticket_trigger
    BEFORE INSERT ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_ticket();

-- Sample FAQ data
INSERT INTO faq_items (category, question, answer, tags, display_order) VALUES
('general', 'How do giveaways work on Entry-Point?', 'Entry-Point uses a verifiable fair system where winners are selected using cryptographic proofs. Every entry has an equal chance of winning, and the selection process is transparent and auditable.', ARRAY['giveaway', 'fairness', 'how-to'], 1),
('general', 'Is Entry-Point safe to use?', 'Yes! Entry-Point uses enterprise-grade security including encryption, fraud detection, and compliance with data protection regulations. All payments are processed securely through Stripe.', ARRAY['safety', 'security', 'payments'], 2),
('payment', 'How do refunds work?', 'Refunds are processed within 5-7 business days back to your original payment method. If a giveaway is cancelled before completion, all entries are automatically refunded.', ARRAY['refund', 'payment', 'cancellation'], 1),
('payment', 'What payment methods do you accept?', 'We accept all major credit cards, debit cards, and digital wallets through our secure Stripe integration. PayPal and bank transfers are coming soon.', ARRAY['payment', 'methods', 'stripe'], 2),
('giveaway', 'How are winners selected?', 'Winners are selected using a cryptographically secure random number generator with publicly verifiable proofs. The process is completely fair and transparent.', ARRAY['winner', 'selection', 'fairness'], 1),
('giveaway', 'Can I cancel my entry?', 'Entries can be cancelled within 24 hours of purchase for a full refund. After 24 hours, entries are locked in to ensure fairness for all participants.', ARRAY['cancel', 'entry', 'refund'], 2),
('account', 'How do I verify my account?', 'Account verification requires a government-issued ID and proof of address. This helps us maintain platform security and comply with regulations.', ARRAY['verification', 'kyc', 'identity'], 1),
('account', 'Why was my account suspended?', 'Accounts may be suspended for violating terms of service, suspicious activity, or fraud prevention. Contact support for specific details about your account.', ARRAY['suspension', 'account', 'violation'], 2);

-- Sample canned responses
INSERT INTO canned_responses (title, content, category, tags) VALUES
('Welcome New User', 'Hi {{user_name}},

Welcome to Entry-Point! Thanks for reaching out. I''m here to help you with any questions about your account or our giveaway platform.

Your ticket number is {{ticket_number}} for reference.

How can I assist you today?

Best regards,
Entry-Point Support Team', 'general', ARRAY['welcome', 'greeting']),

('Payment Issue Standard', 'Hi {{user_name}},

I understand you''re experiencing a payment issue with ticket {{ticket_number}}. I''m here to help resolve this quickly.

To better assist you, could you please provide:
- The last 4 digits of the card used
- The approximate date and time of the transaction
- Any error messages you received

We''ll investigate this immediately and get back to you within 2 hours.

Best regards,
Entry-Point Support Team', 'payment', ARRAY['payment', 'issue', 'investigation']),

('Refund Approved', 'Hi {{user_name}},

Good news! Your refund request for ticket {{ticket_number}} has been approved.

Refund Details:
- Amount: ${{amount}}
- Processing time: 5-7 business days
- Refund method: Original payment method

You''ll receive an email confirmation shortly. The refund will appear on your statement as "Entry-Point Refund".

Is there anything else I can help you with?

Best regards,
Entry-Point Support Team', 'refund', ARRAY['refund', 'approved', 'confirmation']),

('Account Verification Help', 'Hi {{user_name}},

I''m here to help you complete your account verification for ticket {{ticket_number}}.

Required documents:
1. Government-issued photo ID (driver''s license, passport, or national ID)
2. Proof of address (utility bill, bank statement, or lease agreement - dated within 90 days)

Upload guidelines:
- Clear, high-resolution photos
- All four corners visible
- No glare or shadows
- Documents must be current and valid

Upload your documents in your account settings under "Verification". The review process typically takes 24-48 hours.

Let me know if you need any assistance!

Best regards,
Entry-Point Support Team', 'verification', ARRAY['verification', 'kyc', 'documents']),

('Dispute Resolution', 'Hi {{user_name}},

Thank you for bringing this dispute to our attention via ticket {{ticket_number}}. We take all concerns seriously and will investigate thoroughly.

Next steps:
1. We''re freezing the related giveaway pending investigation
2. Our admin team will review all transaction logs
3. We''ll contact the giveaway creator for their response
4. You''ll receive updates within 24 hours

If this involves a chargeback, please provide:
- Your bank''s dispute reference number
- Date you filed the dispute
- Reason for the dispute

We''re committed to resolving this fairly for all parties involved.

Best regards,
Entry-Point Support Team', 'dispute', ARRAY['dispute', 'investigation', 'chargeback']);

-- Update profiles table to include support roles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create admin user check function
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql;
