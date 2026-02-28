-- =====================================================================
-- CAPTCHA Protection Schema for AMOE Compliance
-- =====================================================================
-- PURPOSE: Support CAPTCHA verification system for Alternative Method 
--          of Entry (AMOE) to prevent automated abuse and maintain 
--          legal compliance for sweepstakes operations.
--
-- FEATURES:
-- - Track CAPTCHA verification attempts and failures
-- - Rate limiting for suspicious users  
-- - Provider performance monitoring
-- - Audit trail for compliance reporting
-- - Device fingerprinting for abuse detection
-- =====================================================================

-- CAPTCHA verification logs table
-- Tracks all CAPTCHA verification attempts for monitoring and debugging
CREATE TABLE captcha_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider text NOT NULL CHECK (provider IN ('recaptcha', 'hcaptcha', 'math_captcha')),
    type text NOT NULL CHECK (type IN ('token', 'math')),
    success boolean DEFAULT false,
    score numeric(3,2), -- For reCAPTCHA v3 score (0.0 to 1.0)
    ip_address inet,
    user_agent text,
    session_id text,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_ts timestamptz,
    response_time_ms integer,
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- CAPTCHA failure tracking for rate limiting
-- Prevents users from excessive failed attempts
CREATE TABLE captcha_failures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier text NOT NULL, -- IP address, device ID, or user ID
    identifier_type text NOT NULL CHECK (identifier_type IN ('ip', 'device', 'user')),
    failure_count integer DEFAULT 1,
    first_failure timestamptz DEFAULT now(),
    last_failure timestamptz DEFAULT now(),
    blocked_until timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- CAPTCHA provider statistics
-- Track performance and reliability of different CAPTCHA providers
CREATE TABLE captcha_provider_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider text NOT NULL,
    date date DEFAULT CURRENT_DATE,
    total_attempts integer DEFAULT 0,
    successful_attempts integer DEFAULT 0,
    failed_attempts integer DEFAULT 0,
    average_response_time_ms numeric(8,2),
    uptime_percentage numeric(5,2),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(provider, date)
);

-- Device fingerprints for enhanced fraud detection
-- Track device characteristics to identify suspicious patterns
CREATE TABLE device_fingerprints (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fingerprint_hash text NOT NULL UNIQUE,
    user_agent text,
    screen_resolution text,
    timezone text,
    language text,
    plugins text[], -- Array of browser plugins
    canvas_hash text, -- Canvas fingerprinting hash
    webgl_hash text, -- WebGL fingerprinting hash
    first_seen timestamptz DEFAULT now(),
    last_seen timestamptz DEFAULT now(),
    usage_count integer DEFAULT 1,
    is_suspicious boolean DEFAULT false,
    risk_score integer DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- AMOE entries with CAPTCHA verification
-- Links AMOE entries to their CAPTCHA verification
CREATE TABLE amoe_captcha_verifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    amoe_entry_id uuid NOT NULL, -- References amoe_entries.id
    captcha_log_id uuid REFERENCES captcha_logs(id) ON DELETE CASCADE,
    provider text NOT NULL,
    verification_token text, -- Store verification token hash
    verified_at timestamptz DEFAULT now(),
    expires_at timestamptz, -- When verification expires
    created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- INDEXES for Performance
-- =====================================================================

-- Captcha logs indexes
CREATE INDEX idx_captcha_logs_provider ON captcha_logs(provider);
CREATE INDEX idx_captcha_logs_created_at ON captcha_logs(created_at);
CREATE INDEX idx_captcha_logs_ip_address ON captcha_logs(ip_address);
CREATE INDEX idx_captcha_logs_user_id ON captcha_logs(user_id);
CREATE INDEX idx_captcha_logs_success ON captcha_logs(success);

-- Failure tracking indexes
CREATE INDEX idx_captcha_failures_identifier ON captcha_failures(identifier);
CREATE INDEX idx_captcha_failures_last_failure ON captcha_failures(last_failure);
CREATE INDEX idx_captcha_failures_blocked_until ON captcha_failures(blocked_until);

-- Provider stats indexes
CREATE INDEX idx_captcha_provider_stats_provider_date ON captcha_provider_stats(provider, date);

-- Device fingerprint indexes
CREATE INDEX idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);
CREATE INDEX idx_device_fingerprints_suspicious ON device_fingerprints(is_suspicious);
CREATE INDEX idx_device_fingerprints_risk_score ON device_fingerprints(risk_score);

-- AMOE verification indexes
CREATE INDEX idx_amoe_captcha_amoe_entry ON amoe_captcha_verifications(amoe_entry_id);
CREATE INDEX idx_amoe_captcha_verified_at ON amoe_captcha_verifications(verified_at);

-- =====================================================================
-- FUNCTIONS for Business Logic
-- =====================================================================

-- Function to increment CAPTCHA failures with automatic blocking
CREATE OR REPLACE FUNCTION increment_captcha_failures(
    user_identifier text,
    max_failures integer DEFAULT 3
) RETURNS void AS $$
DECLARE
    current_count integer;
    block_duration interval := '1 hour';
BEGIN
    -- Insert or update failure count
    INSERT INTO captcha_failures (identifier, identifier_type, failure_count, last_failure)
    VALUES (
        user_identifier, 
        CASE 
            WHEN user_identifier ~ '^[0-9.]+$' THEN 'ip'
            WHEN user_identifier ~ '^[a-f0-9-]{36}$' THEN 'user'
            ELSE 'device'
        END,
        1, 
        now()
    )
    ON CONFLICT (identifier) 
    DO UPDATE SET 
        failure_count = captcha_failures.failure_count + 1,
        last_failure = now(),
        updated_at = now();

    -- Get current failure count
    SELECT failure_count INTO current_count
    FROM captcha_failures 
    WHERE identifier = user_identifier;

    -- Block user if threshold exceeded
    IF current_count >= max_failures THEN
        UPDATE captcha_failures 
        SET blocked_until = now() + block_duration
        WHERE identifier = user_identifier;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is currently blocked
CREATE OR REPLACE FUNCTION is_user_blocked(user_identifier text) 
RETURNS boolean AS $$
DECLARE
    block_time timestamptz;
BEGIN
    SELECT blocked_until INTO block_time
    FROM captcha_failures 
    WHERE identifier = user_identifier;

    RETURN block_time IS NOT NULL AND block_time > now();
END;
$$ LANGUAGE plpgsql;

-- Function to reset CAPTCHA failures (for successful verification)
CREATE OR REPLACE FUNCTION reset_captcha_failures(user_identifier text) 
RETURNS void AS $$
BEGIN
    DELETE FROM captcha_failures 
    WHERE identifier = user_identifier;
END;
$$ LANGUAGE plpgsql;

-- Function to update provider statistics
CREATE OR REPLACE FUNCTION update_captcha_provider_stats(
    provider_name text,
    was_successful boolean,
    response_time_ms integer DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO captcha_provider_stats (
        provider, 
        date, 
        total_attempts, 
        successful_attempts, 
        failed_attempts,
        average_response_time_ms
    )
    VALUES (
        provider_name,
        CURRENT_DATE,
        1,
        CASE WHEN was_successful THEN 1 ELSE 0 END,
        CASE WHEN was_successful THEN 0 ELSE 1 END,
        response_time_ms
    )
    ON CONFLICT (provider, date)
    DO UPDATE SET
        total_attempts = captcha_provider_stats.total_attempts + 1,
        successful_attempts = captcha_provider_stats.successful_attempts + 
            CASE WHEN was_successful THEN 1 ELSE 0 END,
        failed_attempts = captcha_provider_stats.failed_attempts + 
            CASE WHEN was_successful THEN 0 ELSE 1 END,
        average_response_time_ms = CASE 
            WHEN response_time_ms IS NOT NULL THEN
                (COALESCE(captcha_provider_stats.average_response_time_ms, 0) + response_time_ms) / 2
            ELSE captcha_provider_stats.average_response_time_ms
        END,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate device fingerprint risk score
CREATE OR REPLACE FUNCTION calculate_device_risk_score(fingerprint_id uuid)
RETURNS integer AS $$
DECLARE
    risk_score integer := 0;
    usage_count integer;
    creation_age interval;
    failed_captchas integer;
BEGIN
    -- Get device usage data
    SELECT d.usage_count, now() - d.created_at
    INTO usage_count, creation_age
    FROM device_fingerprints d
    WHERE d.id = fingerprint_id;

    -- Risk factors:
    
    -- High usage from new device (bot-like behavior)
    IF creation_age < interval '1 day' AND usage_count > 10 THEN
        risk_score := risk_score + 30;
    END IF;

    -- Very high usage overall
    IF usage_count > 100 THEN
        risk_score := risk_score + 20;
    END IF;

    -- Count failed CAPTCHA attempts from this device
    SELECT COUNT(*) INTO failed_captchas
    FROM captcha_logs cl
    JOIN device_fingerprints df ON cl.ip_address::text = df.fingerprint_hash
    WHERE df.id = fingerprint_id 
    AND cl.success = false 
    AND cl.created_at > now() - interval '24 hours';

    -- High CAPTCHA failure rate
    IF failed_captchas > 5 THEN
        risk_score := risk_score + 25;
    END IF;

    -- Cap at 100
    risk_score := LEAST(risk_score, 100);

    -- Update the device record
    UPDATE device_fingerprints 
    SET 
        risk_score = calculate_device_risk_score.risk_score,
        is_suspicious = (calculate_device_risk_score.risk_score > 50),
        updated_at = now()
    WHERE id = fingerprint_id;

    RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- TRIGGERS for Automatic Updates
-- =====================================================================

-- Trigger to update device fingerprint last_seen and usage_count
CREATE OR REPLACE FUNCTION update_device_fingerprint_usage()
RETURNS trigger AS $$
BEGIN
    UPDATE device_fingerprints 
    SET 
        last_seen = now(),
        usage_count = usage_count + 1,
        updated_at = now()
    WHERE fingerprint_hash = NEW.ip_address::text;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_device_usage
    AFTER INSERT ON captcha_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_device_fingerprint_usage();

-- Trigger to automatically update provider statistics
CREATE OR REPLACE FUNCTION auto_update_provider_stats()
RETURNS trigger AS $$
BEGIN
    PERFORM update_captcha_provider_stats(
        NEW.provider,
        NEW.success,
        NEW.response_time_ms
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_provider_stats
    AFTER INSERT ON captcha_logs
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_provider_stats();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE captcha_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE captcha_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE captcha_provider_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE amoe_captcha_verifications ENABLE ROW LEVEL SECURITY;

-- Policies for captcha_logs (users can only see their own logs)
CREATE POLICY "Users can view own captcha logs" ON captcha_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert captcha logs" ON captcha_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Policies for captcha_failures (internal use only)
CREATE POLICY "Service role can manage captcha failures" ON captcha_failures
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for provider stats (read-only for authenticated users)
CREATE POLICY "Authenticated users can view provider stats" ON captcha_provider_stats
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage provider stats" ON captcha_provider_stats
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for device fingerprints (internal use only)
CREATE POLICY "Service role can manage device fingerprints" ON device_fingerprints
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for AMOE CAPTCHA verifications
CREATE POLICY "Users can view own AMOE verifications" ON amoe_captcha_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM amoe_entries ae 
            WHERE ae.id = amoe_entry_id 
            AND ae.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage AMOE verifications" ON amoe_captcha_verifications
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================================
-- CLEANUP FUNCTIONS for Data Retention
-- =====================================================================

-- Function to clean up old CAPTCHA logs (retain 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_captcha_logs() RETURNS void AS $$
BEGIN
    DELETE FROM captcha_logs 
    WHERE created_at < now() - interval '90 days';
    
    -- Log cleanup action
    INSERT INTO captcha_logs (provider, type, success, created_at)
    VALUES ('system', 'cleanup', true, now());
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired failure records
CREATE OR REPLACE FUNCTION cleanup_expired_failures() RETURNS void AS $$
BEGIN
    DELETE FROM captcha_failures 
    WHERE blocked_until < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- SAMPLE DATA for Testing
-- =====================================================================

-- Insert sample CAPTCHA providers
INSERT INTO captcha_provider_stats (provider, date, total_attempts, successful_attempts, failed_attempts)
VALUES 
    ('recaptcha', CURRENT_DATE, 0, 0, 0),
    ('hcaptcha', CURRENT_DATE, 0, 0, 0),
    ('math_captcha', CURRENT_DATE, 0, 0, 0);

-- =====================================================================
-- COMMENTS and Documentation
-- =====================================================================

COMMENT ON TABLE captcha_logs IS 'Comprehensive log of all CAPTCHA verification attempts for monitoring and debugging';
COMMENT ON TABLE captcha_failures IS 'Track failed CAPTCHA attempts for rate limiting and abuse prevention';
COMMENT ON TABLE captcha_provider_stats IS 'Performance statistics for different CAPTCHA providers';
COMMENT ON TABLE device_fingerprints IS 'Device fingerprinting data for enhanced fraud detection';
COMMENT ON TABLE amoe_captcha_verifications IS 'Links AMOE entries to their CAPTCHA verifications';

COMMENT ON FUNCTION increment_captcha_failures IS 'Safely increment failure count and apply blocking rules';
COMMENT ON FUNCTION is_user_blocked IS 'Check if a user identifier is currently blocked from CAPTCHA attempts';
COMMENT ON FUNCTION reset_captcha_failures IS 'Reset failure count after successful verification';
COMMENT ON FUNCTION update_captcha_provider_stats IS 'Update provider performance statistics';
COMMENT ON FUNCTION calculate_device_risk_score IS 'Calculate risk score for device fingerprint based on behavior patterns';
