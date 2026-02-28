-- =======================================================
-- OBSERVABILITY & RATE LIMITING SCHEMA
-- =======================================================
-- Database schema for production monitoring, rate limiting, 
-- and security tracking.
--
-- FEATURES:
-- - Rate limiting with sliding windows
-- - Security event logging
-- - Webhook replay for reliability
-- - Performance monitoring
-- - Audit trails for compliance
-- =======================================================

-- Rate limiting usage tracking
CREATE TABLE IF NOT EXISTS rate_limit_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    action text NOT NULL,                    -- 'purchase', 'auth', 'api', etc.
    identifier text NOT NULL,               -- user_id, ip_address, email, etc.
    identifier_type text NOT NULL CHECK (identifier_type IN ('user', 'ip', 'email', 'admin')),
    window_start timestamptz NOT NULL,      -- Start of rate limit window
    count integer DEFAULT 1,                -- Number of actions in window
    last_used timestamptz DEFAULT now(),    -- Last time action was performed
    metadata jsonb DEFAULT '{}',            -- Additional context
    created_at timestamptz DEFAULT now(),
    
    -- Composite unique constraint for upserts
    UNIQUE(action, identifier, identifier_type, window_start)
);

-- Blocked identifiers for severe abuse
CREATE TABLE IF NOT EXISTS blocked_identifiers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier text NOT NULL,
    identifier_type text NOT NULL CHECK (identifier_type IN ('user', 'ip', 'email', 'device')),
    blocked_until timestamptz NOT NULL,
    reason text NOT NULL,
    created_by text DEFAULT 'system',       -- admin_id or 'system'
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(identifier, identifier_type)
);

-- Security events log
CREATE TABLE IF NOT EXISTS security_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type text NOT NULL,               -- 'rate_limit_exceeded', 'auth_failed', etc.
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address inet,
    user_agent text,
    endpoint text,                          -- API endpoint or action
    severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    details jsonb DEFAULT '{}',
    resolved boolean DEFAULT false,
    resolved_at timestamptz,
    resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- Webhook delivery tracking for reliability
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_id text NOT NULL,               -- Stripe webhook ID or internal ID
    event_type text NOT NULL,               -- 'payment_intent.succeeded', etc.
    payload jsonb NOT NULL,                 -- Full webhook payload
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'retrying')),
    attempt_count integer DEFAULT 0,
    last_attempt_at timestamptz,
    next_retry_at timestamptz,
    error_message text,
    processed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    
    -- Prevent duplicate processing
    UNIQUE(webhook_id, event_type)
);

-- Performance monitoring
CREATE TABLE IF NOT EXISTS performance_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type text NOT NULL,              -- 'api_response_time', 'db_query_time', etc.
    metric_name text NOT NULL,              -- Specific metric identifier
    value numeric NOT NULL,                 -- Metric value (ms, count, etc.)
    unit text DEFAULT 'ms',                 -- Unit of measurement
    tags jsonb DEFAULT '{}',                -- Additional tags for filtering
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id text,
    timestamp timestamptz DEFAULT now()
);

-- Audit trail for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    action text NOT NULL,                   -- 'approve_giveaway', 'ban_user', etc.
    target_type text NOT NULL,              -- 'giveaway', 'user', 'setting', etc.
    target_id text NOT NULL,                -- ID of the affected entity
    old_values jsonb,                       -- Previous state
    new_values jsonb,                       -- New state
    ip_address inet,
    user_agent text,
    reason text,                            -- Admin's reason for action
    created_at timestamptz DEFAULT now()
);

-- Business metrics for KPI tracking
CREATE TABLE IF NOT EXISTS business_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name text NOT NULL,              -- 'daily_revenue', 'new_users', etc.
    metric_value numeric NOT NULL,
    metric_date date NOT NULL,              -- Date this metric applies to
    metadata jsonb DEFAULT '{}',
    calculated_at timestamptz DEFAULT now(),
    
    UNIQUE(metric_name, metric_date)
);

-- =======================================================
-- INDEXES for Performance
-- =======================================================

-- Rate limiting indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_usage_lookup 
ON rate_limit_usage(action, identifier, identifier_type, window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limit_usage_cleanup 
ON rate_limit_usage(window_start);

-- Blocked identifiers indexes
CREATE INDEX IF NOT EXISTS idx_blocked_identifiers_lookup 
ON blocked_identifiers(identifier, identifier_type, blocked_until);

CREATE INDEX IF NOT EXISTS idx_blocked_identifiers_cleanup 
ON blocked_identifiers(blocked_until);

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_security_events_type 
ON security_events(event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_security_events_user 
ON security_events(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_security_events_ip 
ON security_events(ip_address, created_at);

CREATE INDEX IF NOT EXISTS idx_security_events_unresolved 
ON security_events(resolved, severity, created_at) WHERE resolved = false;

-- Webhook delivery indexes
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status 
ON webhook_deliveries(status, next_retry_at);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_lookup 
ON webhook_deliveries(webhook_id, event_type);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type 
ON performance_metrics(metric_type, metric_name, timestamp);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_user 
ON performance_metrics(user_id, timestamp);

-- Admin audit indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin 
ON admin_audit_log(admin_id, created_at);

CREATE INDEX IF NOT EXISTS idx_admin_audit_target 
ON admin_audit_log(target_type, target_id, created_at);

-- Business metrics indexes
CREATE INDEX IF NOT EXISTS idx_business_metrics_name_date 
ON business_metrics(metric_name, metric_date);

-- =======================================================
-- FUNCTIONS for Business Logic
-- =======================================================

-- Function to increment rate limit usage with atomic upsert
CREATE OR REPLACE FUNCTION increment_rate_limit_usage(
    p_action text,
    p_identifier text,
    p_identifier_type text,
    p_window_start timestamptz,
    p_metadata jsonb DEFAULT '{}'
) RETURNS integer AS $$
DECLARE
    current_count integer;
BEGIN
    INSERT INTO rate_limit_usage (
        action, identifier, identifier_type, window_start, count, last_used, metadata
    ) VALUES (
        p_action, p_identifier, p_identifier_type, p_window_start, 1, now(), p_metadata
    )
    ON CONFLICT (action, identifier, identifier_type, window_start)
    DO UPDATE SET 
        count = rate_limit_usage.count + 1,
        last_used = now(),
        metadata = p_metadata
    RETURNING count INTO current_count;
    
    RETURN current_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if identifier is blocked
CREATE OR REPLACE FUNCTION is_identifier_blocked(
    p_identifier text,
    p_identifier_type text
) RETURNS boolean AS $$
DECLARE
    blocked_until timestamptz;
BEGIN
    SELECT b.blocked_until INTO blocked_until
    FROM blocked_identifiers b
    WHERE b.identifier = p_identifier 
    AND b.identifier_type = p_identifier_type
    AND b.blocked_until > now();
    
    RETURN blocked_until IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type text,
    p_user_id uuid DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_details jsonb DEFAULT '{}',
    p_severity text DEFAULT 'medium'
) RETURNS uuid AS $$
DECLARE
    event_id uuid;
BEGIN
    INSERT INTO security_events (
        event_type, user_id, ip_address, details, severity
    ) VALUES (
        p_event_type, p_user_id, p_ip_address, p_details, p_severity
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record webhook delivery
CREATE OR REPLACE FUNCTION record_webhook_delivery(
    p_webhook_id text,
    p_event_type text,
    p_payload jsonb,
    p_status text DEFAULT 'pending'
) RETURNS uuid AS $$
DECLARE
    delivery_id uuid;
BEGIN
    INSERT INTO webhook_deliveries (
        webhook_id, event_type, payload, status
    ) VALUES (
        p_webhook_id, p_event_type, p_payload, p_status
    )
    ON CONFLICT (webhook_id, event_type)
    DO UPDATE SET
        payload = p_payload,
        status = p_status,
        attempt_count = webhook_deliveries.attempt_count + 1,
        last_attempt_at = now()
    RETURNING id INTO delivery_id;
    
    RETURN delivery_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update webhook delivery status
CREATE OR REPLACE FUNCTION update_webhook_delivery_status(
    p_webhook_id text,
    p_event_type text,
    p_status text,
    p_error_message text DEFAULT NULL
) RETURNS void AS $$
BEGIN
    UPDATE webhook_deliveries 
    SET 
        status = p_status,
        error_message = p_error_message,
        last_attempt_at = now(),
        processed_at = CASE WHEN p_status = 'succeeded' THEN now() ELSE processed_at END,
        next_retry_at = CASE 
            WHEN p_status = 'failed' THEN now() + interval '5 minutes'
            ELSE NULL 
        END
    WHERE webhook_id = p_webhook_id AND event_type = p_event_type;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- ROW LEVEL SECURITY
-- =======================================================

-- Enable RLS on all tables
ALTER TABLE rate_limit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;

-- Rate limit usage - service role only
CREATE POLICY "Service role can manage rate limits" ON rate_limit_usage
    FOR ALL USING (auth.role() = 'service_role');

-- Blocked identifiers - service role and admins
CREATE POLICY "Service role can manage blocked identifiers" ON blocked_identifiers
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view blocked identifiers" ON blocked_identifiers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Security events - admins can view
CREATE POLICY "Admins can view security events" ON security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Service role can manage security events" ON security_events
    FOR ALL USING (auth.role() = 'service_role');

-- Webhook deliveries - service role only
CREATE POLICY "Service role can manage webhook deliveries" ON webhook_deliveries
    FOR ALL USING (auth.role() = 'service_role');

-- Performance metrics - service role only
CREATE POLICY "Service role can manage performance metrics" ON performance_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- Admin audit log - admins can view
CREATE POLICY "Admins can view audit log" ON admin_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Service role can insert audit log" ON admin_audit_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Business metrics - admins can view
CREATE POLICY "Admins can view business metrics" ON business_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Service role can manage business metrics" ON business_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- =======================================================
-- CLEANUP FUNCTIONS for Data Retention
-- =======================================================

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limit_usage() RETURNS void AS $$
BEGIN
    DELETE FROM rate_limit_usage 
    WHERE window_start < now() - interval '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO performance_metrics (metric_type, metric_name, value, unit)
    VALUES ('cleanup', 'rate_limit_records_deleted', deleted_count, 'count');
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old security events
CREATE OR REPLACE FUNCTION cleanup_security_events() RETURNS void AS $$
BEGIN
    DELETE FROM security_events 
    WHERE created_at < now() - interval '90 days'
    AND resolved = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    INSERT INTO performance_metrics (metric_type, metric_name, value, unit)
    VALUES ('cleanup', 'security_events_deleted', deleted_count, 'count');
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old performance metrics
CREATE OR REPLACE FUNCTION cleanup_performance_metrics() RETURNS void AS $$
BEGIN
    DELETE FROM performance_metrics 
    WHERE timestamp < now() - interval '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Cleaned up % old performance metrics', deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- SAMPLE DATA for Testing
-- =======================================================

-- Insert sample rate limit configurations
INSERT INTO rate_limit_usage (action, identifier, identifier_type, window_start, count)
VALUES 
    ('purchase', 'test-user-123', 'user', date_trunc('minute', now()), 0),
    ('api', '192.168.1.1', 'ip', date_trunc('minute', now()), 0)
ON CONFLICT DO NOTHING;

-- =======================================================
-- COMMENTS and Documentation
-- =======================================================

COMMENT ON TABLE rate_limit_usage IS 'Tracks rate limit usage across different actions and identifiers';
COMMENT ON TABLE blocked_identifiers IS 'Stores temporarily or permanently blocked identifiers';
COMMENT ON TABLE security_events IS 'Logs security-related events for monitoring and alerting';
COMMENT ON TABLE webhook_deliveries IS 'Tracks webhook delivery status for reliability and replay';
COMMENT ON TABLE performance_metrics IS 'Stores performance and monitoring metrics';
COMMENT ON TABLE admin_audit_log IS 'Audit trail for all administrative actions';
COMMENT ON TABLE business_metrics IS 'Daily business KPI metrics for reporting';

COMMENT ON FUNCTION increment_rate_limit_usage IS 'Atomically increment rate limit usage counter';
COMMENT ON FUNCTION is_identifier_blocked IS 'Check if an identifier is currently blocked';
COMMENT ON FUNCTION log_security_event IS 'Log a security event with proper categorization';
COMMENT ON FUNCTION record_webhook_delivery IS 'Record webhook delivery attempt with idempotency';
COMMENT ON FUNCTION update_webhook_delivery_status IS 'Update webhook delivery status and retry logic';
