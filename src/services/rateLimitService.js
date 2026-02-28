/**
 * rateLimitService.js - Production Rate Limiting & DDoS Protection
 * 
 * PURPOSE:
 * Implement comprehensive rate limiting for all sensitive endpoints.
 * Prevents abuse, DDoS attacks, and maintains platform stability.
 * 
 * RATE LIMITS:
 * - Purchases: 10/min/IP, 5/min/user
 * - AMOE entries: 1/day/giveaway/user, 3/day/giveaway/IP
 * - Auth attempts: 5/min/IP, 3/min/email
 * - API calls: 100/min/user, 1000/min/IP
 * - Admin actions: 50/min/admin
 */

import { supabase } from '../config/supabase';
import observabilityService from './observabilityService';

class RateLimitService {
  constructor() {
    this.limits = {
      // Purchase rate limits
      purchase_user: { window: 60, max: 5 },      // 5 purchases per minute per user
      purchase_ip: { window: 60, max: 10 },       // 10 purchases per minute per IP
      
      // Authentication rate limits
      auth_ip: { window: 60, max: 5 },            // 5 auth attempts per minute per IP
      auth_email: { window: 60, max: 3 },         // 3 auth attempts per minute per email
      
      // AMOE rate limits (already implemented in ipGeoService)
      amoe_user_daily: { window: 86400, max: 1 }, // 1 AMOE entry per day per user per giveaway
      amoe_ip_daily: { window: 86400, max: 3 },   // 3 AMOE entries per day per IP per giveaway
      
      // API rate limits
      api_user: { window: 60, max: 100 },         // 100 API calls per minute per user
      api_ip: { window: 60, max: 1000 },          // 1000 API calls per minute per IP
      
      // Admin rate limits
      admin_actions: { window: 60, max: 50 },     // 50 admin actions per minute
      
      // Content uploads
      upload_user: { window: 300, max: 10 },      // 10 uploads per 5 minutes per user
      upload_ip: { window: 300, max: 50 },        // 50 uploads per 5 minutes per IP
      
      // Comment/interaction limits
      comment_user: { window: 60, max: 5 },       // 5 comments per minute per user
      follow_user: { window: 300, max: 20 },      // 20 follows per 5 minutes per user
    };
  }

  /**
   * Check if action is allowed under rate limits
   */
  async checkRateLimit(action, identifier, identifierType = 'user', metadata = {}) {
    try {
      const limit = this.limits[`${action}_${identifierType}`];
      if (!limit) {
        // No limit defined for this action - allow it
        return { allowed: true };
      }

      const windowStart = new Date(Date.now() - limit.window * 1000);
      
      // Check current usage in time window
      const { data: usageData, error } = await supabase
        .from('rate_limit_usage')
        .select('count')
        .eq('action', action)
        .eq('identifier', identifier)
        .eq('identifier_type', identifierType)
        .gte('window_start', windowStart.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Rate limit check error:', error);
        // Fail open - don't block if we can't check
        return { allowed: true };
      }

      const currentUsage = usageData?.count || 0;
      const remaining = Math.max(0, limit.max - currentUsage);
      const resetTime = new Date(Date.now() + limit.window * 1000);

      if (currentUsage >= limit.max) {
        // Rate limit exceeded
        observabilityService.trackSecurity('rate_limit_exceeded', {
          action,
          identifier,
          identifierType,
          currentUsage,
          limit: limit.max,
          ...metadata
        });

        return {
          allowed: false,
          reason: 'rate_limit_exceeded',
          limit: limit.max,
          used: currentUsage,
          remaining: 0,
          resetTime: resetTime.toISOString(),
          retryAfter: limit.window
        };
      }

      return {
        allowed: true,
        limit: limit.max,
        used: currentUsage,
        remaining,
        resetTime: resetTime.toISOString()
      };

    } catch (error) {
      console.error('Rate limit check failed:', error);
      observabilityService.trackError(error, { action, identifier, identifierType });
      // Fail open for availability
      return { allowed: true };
    }
  }

  /**
   * Record usage of rate-limited action
   */
  async recordUsage(action, identifier, identifierType = 'user', metadata = {}) {
    try {
      const windowStart = this.getWindowStart(action, identifierType);
      
      // Upsert usage record
      const { error } = await supabase
        .from('rate_limit_usage')
        .upsert({
          action,
          identifier,
          identifier_type: identifierType,
          window_start: windowStart.toISOString(),
          count: 1,
          last_used: new Date().toISOString(),
          metadata
        }, {
          onConflict: 'action,identifier,identifier_type,window_start'
        });

      if (error) {
        console.error('Failed to record rate limit usage:', error);
      }
    } catch (error) {
      console.error('Rate limit recording failed:', error);
    }
  }

  /**
   * Comprehensive rate limit check for purchases
   */
  async checkPurchaseRateLimit(userId, ipAddress, metadata = {}) {
    // Check both user and IP limits
    const [userCheck, ipCheck] = await Promise.all([
      this.checkRateLimit('purchase', userId, 'user', metadata),
      this.checkRateLimit('purchase', ipAddress, 'ip', metadata)
    ]);

    if (!userCheck.allowed) {
      return {
        allowed: false,
        reason: 'user_rate_limit',
        details: userCheck
      };
    }

    if (!ipCheck.allowed) {
      return {
        allowed: false,
        reason: 'ip_rate_limit',
        details: ipCheck
      };
    }

    return { allowed: true, userLimit: userCheck, ipLimit: ipCheck };
  }

  /**
   * Record purchase rate limit usage
   */
  async recordPurchaseUsage(userId, ipAddress, metadata = {}) {
    await Promise.all([
      this.recordUsage('purchase', userId, 'user', metadata),
      this.recordUsage('purchase', ipAddress, 'ip', metadata)
    ]);
  }

  /**
   * Check authentication rate limits
   */
  async checkAuthRateLimit(email, ipAddress, metadata = {}) {
    const [emailCheck, ipCheck] = await Promise.all([
      this.checkRateLimit('auth', email, 'email', metadata),
      this.checkRateLimit('auth', ipAddress, 'ip', metadata)
    ]);

    if (!emailCheck.allowed) {
      return {
        allowed: false,
        reason: 'email_rate_limit',
        details: emailCheck
      };
    }

    if (!ipCheck.allowed) {
      return {
        allowed: false,
        reason: 'ip_rate_limit',
        details: ipCheck
      };
    }

    return { allowed: true, emailLimit: emailCheck, ipLimit: ipCheck };
  }

  /**
   * Record auth attempt
   */
  async recordAuthUsage(email, ipAddress, success, metadata = {}) {
    await Promise.all([
      this.recordUsage('auth', email, 'email', { success, ...metadata }),
      this.recordUsage('auth', ipAddress, 'ip', { success, ...metadata })
    ]);

    // Track security event
    if (!success) {
      observabilityService.trackSecurity('auth_failed', {
        email,
        ipAddress,
        ...metadata
      });
    }
  }

  /**
   * Check API rate limits
   */
  async checkAPIRateLimit(userId, ipAddress, endpoint, metadata = {}) {
    const [userCheck, ipCheck] = await Promise.all([
      this.checkRateLimit('api', userId, 'user', { endpoint, ...metadata }),
      this.checkRateLimit('api', ipAddress, 'ip', { endpoint, ...metadata })
    ]);

    if (!userCheck.allowed) {
      return {
        allowed: false,
        reason: 'user_api_limit',
        details: userCheck
      };
    }

    if (!ipCheck.allowed) {
      return {
        allowed: false,
        reason: 'ip_api_limit',
        details: ipCheck
      };
    }

    return { allowed: true, userLimit: userCheck, ipLimit: ipCheck };
  }

  /**
   * Check admin action rate limits
   */
  async checkAdminRateLimit(adminId, action, metadata = {}) {
    return await this.checkRateLimit('admin_actions', adminId, 'admin', {
      action,
      ...metadata
    });
  }

  /**
   * Get window start time for action
   */
  getWindowStart(action, identifierType) {
    const limit = this.limits[`${action}_${identifierType}`];
    if (!limit) return new Date();

    const windowMs = limit.window * 1000;
    const now = Date.now();
    const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
    
    return windowStart;
  }

  /**
   * Clean up old rate limit records
   */
  async cleanupOldRecords() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const { error } = await supabase
        .from('rate_limit_usage')
        .delete()
        .lt('window_start', oneDayAgo.toISOString());

      if (error) {
        console.error('Failed to cleanup old rate limit records:', error);
      } else {
        console.log('✅ Cleaned up old rate limit records');
      }
    } catch (error) {
      console.error('Rate limit cleanup error:', error);
    }
  }

  /**
   * Get current rate limit status for user
   */
  async getRateLimitStatus(userId, ipAddress) {
    try {
      const checks = await Promise.all([
        this.checkRateLimit('purchase', userId, 'user'),
        this.checkRateLimit('api', userId, 'user'),
        this.checkRateLimit('upload', userId, 'user'),
        this.checkRateLimit('comment', userId, 'user'),
        this.checkRateLimit('api', ipAddress, 'ip')
      ]);

      return {
        purchase: checks[0],
        api: checks[1],
        upload: checks[2],
        comment: checks[3],
        ipAPI: checks[4]
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return {};
    }
  }

  /**
   * Temporarily block identifier for severe abuse
   */
  async blockIdentifier(identifier, identifierType, duration = 3600, reason = 'abuse') {
    try {
      const blockedUntil = new Date(Date.now() + duration * 1000);
      
      const { error } = await supabase
        .from('blocked_identifiers')
        .upsert({
          identifier,
          identifier_type: identifierType,
          blocked_until: blockedUntil.toISOString(),
          reason,
          created_by: 'system'
        });

      if (error) {
        console.error('Failed to block identifier:', error);
      } else {
        observabilityService.trackSecurity('identifier_blocked', {
          identifier,
          identifierType,
          duration,
          reason
        });
      }
    } catch (error) {
      console.error('Block identifier error:', error);
    }
  }

  /**
   * Check if identifier is currently blocked
   */
  async isBlocked(identifier, identifierType) {
    try {
      const { data, error } = await supabase
        .from('blocked_identifiers')
        .select('blocked_until, reason')
        .eq('identifier', identifier)
        .eq('identifier_type', identifierType)
        .gt('blocked_until', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Block check error:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Block check failed:', error);
      return false;
    }
  }
}

export default new RateLimitService();
