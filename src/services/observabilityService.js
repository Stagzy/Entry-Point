/**
 * observabilityService.js - Monitoring, Error Tracking & Analytics
 * 
 * PURPOSE:
 * Centralized observability for production monitoring and user analytics.
 * Tracks errors, user events, performance metrics, and business metrics.
 * 
 * FEATURES:
 * - Sentry integration for error tracking
 * - PostHog/Mixpanel for user analytics
 * - Custom business metrics tracking
 * - Performance monitoring
 * - Real-time dashboard feeds
 */

// Note: Install these packages in production
// npm install @sentry/react-native posthog-react-native

class ObservabilityService {
  constructor() {
    this.isInitialized = false;
    this.isDevelopment = __DEV__;
    this.userId = null;
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize monitoring services
   */
  async initialize(config = {}) {
    try {
      if (this.isInitialized) return;

      // Initialize Sentry for error tracking
      await this.initializeSentry(config);
      
      // Initialize analytics
      await this.initializeAnalytics(config);
      
      this.isInitialized = true;
      console.log('📊 Observability services initialized');
    } catch (error) {
      console.error('Observability initialization failed:', error);
    }
  }

  /**
   * Initialize Sentry error tracking
   */
  async initializeSentry(config) {
    if (this.isDevelopment && !config.forceInDev) return;

    try {
      // Mock Sentry initialization - replace with actual Sentry
      this.sentry = {
        captureException: (error, context) => {
          console.error('🚨 Sentry:', error, context);
          // In production: Sentry.captureException(error, context);
        },
        captureMessage: (message, level = 'info') => {
          console.log(`📝 Sentry [${level}]:`, message);
          // In production: Sentry.captureMessage(message, level);
        },
        addBreadcrumb: (breadcrumb) => {
          console.log('🍞 Breadcrumb:', breadcrumb);
          // In production: Sentry.addBreadcrumb(breadcrumb);
        },
        setUser: (user) => {
          this.userId = user.id;
          console.log('👤 Sentry user:', user);
          // In production: Sentry.setUser(user);
        },
        setContext: (key, context) => {
          console.log(`🔧 Context [${key}]:`, context);
          // In production: Sentry.setContext(key, context);
        }
      };
    } catch (error) {
      console.error('Sentry initialization failed:', error);
    }
  }

  /**
   * Initialize analytics tracking
   */
  async initializeAnalytics(config) {
    try {
      // Mock PostHog/Mixpanel - replace with actual analytics
      this.analytics = {
        identify: (userId, traits) => {
          console.log('🆔 Analytics identify:', userId, traits);
          // In production: posthog.identify(userId, traits);
        },
        track: (event, properties) => {
          console.log('📈 Analytics track:', event, properties);
          // In production: posthog.capture(event, properties);
        },
        screen: (screenName, properties) => {
          console.log('📱 Screen view:', screenName, properties);
          // In production: posthog.screen(screenName, properties);
        },
        group: (groupType, groupKey, traits) => {
          console.log('👥 Group:', groupType, groupKey, traits);
          // In production: posthog.group(groupType, groupKey, traits);
        }
      };
    } catch (error) {
      console.error('Analytics initialization failed:', error);
    }
  }

  /**
   * Track user authentication events
   */
  trackAuth(event, userId, metadata = {}) {
    this.analytics?.identify(userId, {
      userId,
      lastSeen: new Date().toISOString(),
      ...metadata
    });

    this.analytics?.track(`auth_${event}`, {
      userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    this.sentry?.setUser({
      id: userId,
      ...metadata
    });
  }

  /**
   * Track giveaway business events
   */
  trackGiveaway(event, giveawayId, metadata = {}) {
    this.analytics?.track(`giveaway_${event}`, {
      giveawayId,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    // Add business context for debugging
    this.sentry?.setContext('giveaway', {
      id: giveawayId,
      event,
      ...metadata
    });
  }

  /**
   * Track payment events
   */
  trackPayment(event, orderId, metadata = {}) {
    this.analytics?.track(`payment_${event}`, {
      orderId,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    // Critical business event - always log
    console.log(`💰 Payment ${event}:`, { orderId, ...metadata });
  }

  /**
   * Track AMOE compliance events
   */
  trackAMOE(event, giveawayId, metadata = {}) {
    this.analytics?.track(`amoe_${event}`, {
      giveawayId,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    // Compliance tracking is critical
    this.sentry?.addBreadcrumb({
      category: 'compliance',
      message: `AMOE ${event}`,
      data: { giveawayId, ...metadata },
      level: 'info'
    });
  }

  /**
   * Track admin actions for audit trail
   */
  trackAdmin(action, targetId, metadata = {}) {
    this.analytics?.track(`admin_${action}`, {
      targetId,
      adminId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    // Admin actions need high visibility
    this.sentry?.captureMessage(`Admin action: ${action}`, {
      level: 'info',
      extra: { targetId, adminId: this.userId, ...metadata }
    });
  }

  /**
   * Track security events
   */
  trackSecurity(event, metadata = {}) {
    // Security events go to both systems
    this.analytics?.track(`security_${event}`, {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    this.sentry?.captureMessage(`Security event: ${event}`, {
      level: 'warning',
      extra: metadata
    });
  }

  /**
   * Track screen navigation
   */
  trackScreen(screenName, metadata = {}) {
    this.analytics?.screen(screenName, {
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Track errors with context
   */
  trackError(error, context = {}) {
    this.sentry?.captureException(error, {
      extra: {
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        ...context
      }
    });

    // Also track error events in analytics for funnel analysis
    this.analytics?.track('error_occurred', {
      errorType: error.name,
      errorMessage: error.message,
      userId: this.userId,
      sessionId: this.sessionId,
      ...context
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric, value, metadata = {}) {
    this.analytics?.track('performance_metric', {
      metric,
      value,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Track business KPIs
   */
  trackKPI(kpi, value, metadata = {}) {
    this.analytics?.track('business_kpi', {
      kpi,
      value,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    // KPIs are important for business monitoring
    console.log(`📊 KPI [${kpi}]:`, value, metadata);
  }

  /**
   * Add debugging breadcrumb
   */
  addBreadcrumb(category, message, data = {}) {
    this.sentry?.addBreadcrumb({
      category,
      message,
      data,
      timestamp: Date.now() / 1000,
      level: 'info'
    });
  }

  /**
   * Set user context
   */
  setUser(user) {
    this.userId = user.id;
    this.sentry?.setUser(user);
    this.analytics?.identify(user.id, user);
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Flush events (useful before app close)
   */
  async flush() {
    try {
      // In production, flush both Sentry and analytics
      console.log('📤 Flushing observability events...');
      // await Sentry.flush();
      // await posthog.flush();
    } catch (error) {
      console.error('Failed to flush events:', error);
    }
  }
}

export default new ObservabilityService();
