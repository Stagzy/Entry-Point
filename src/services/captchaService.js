/**
 * captchaService.js - CAPTCHA Protection for AMOE Entries
 * 
 * PURPOSE:
 * Prevent automated abuse of Alternative Method of Entry (AMOE) system.
 * Implements multiple CAPTCHA providers with fallback support.
 * 
 * FEATURES:
 * - Google reCAPTCHA v3 integration
 * - hCaptcha fallback support
 * - Custom mathematical CAPTCHA for offline mode
 * - Rate limiting and abuse detection
 * - Device fingerprinting for suspicious activity
 * 
 * COMPLIANCE:
 * - Required for AMOE legal compliance
 * - Prevents bot farms from gaming free entries
 * - Maintains 1-entry-per-person-per-day rule
 */

import { supabase } from '../config/supabase';

class CaptchaService {
  constructor() {
    this.providers = {
      RECAPTCHA: 'recaptcha',
      HCAPTCHA: 'hcaptcha', 
      MATH: 'math_captcha'
    };
    
    this.currentProvider = this.providers.RECAPTCHA;
    this.failureThreshold = 3;
    this.timeoutMs = 30000; // 30 seconds
  }

  /**
   * Initialize CAPTCHA for AMOE form
   * @param {string} containerId - DOM container for CAPTCHA widget
   * @param {string} provider - CAPTCHA provider to use
   * @returns {Promise<string>} Widget ID for cleanup
   */
  async initializeCaptcha(containerId, provider = this.currentProvider) {
    try {
      switch (provider) {
        case this.providers.RECAPTCHA:
          return await this.initializeRecaptcha(containerId);
        case this.providers.HCAPTCHA:
          return await this.initializeHcaptcha(containerId);
        case this.providers.MATH:
          return await this.initializeMathCaptcha(containerId);
        default:
          throw new Error(`Unsupported CAPTCHA provider: ${provider}`);
      }
    } catch (error) {
      console.error('CAPTCHA initialization failed:', error);
      // Fallback to math CAPTCHA if external providers fail
      if (provider !== this.providers.MATH) {
        return await this.initializeCaptcha(containerId, this.providers.MATH);
      }
      throw error;
    }
  }

  /**
   * Initialize Google reCAPTCHA v3
   * @param {string} containerId - Container element ID
   * @returns {Promise<string>} Widget ID
   */
  async initializeRecaptcha(containerId) {
    return new Promise((resolve, reject) => {
      // Load reCAPTCHA script if not already loaded
      if (!window.grecaptcha) {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;
        
        window.onRecaptchaLoad = () => {
          this.renderRecaptcha(containerId, resolve, reject);
        };
        
        script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
        document.head.appendChild(script);
      } else {
        this.renderRecaptcha(containerId, resolve, reject);
      }
    });
  }

  renderRecaptcha(containerId, resolve, reject) {
    try {
      const widgetId = window.grecaptcha.render(containerId, {
        sitekey: process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY,
        callback: (token) => {
          console.log('reCAPTCHA completed:', token.substring(0, 20) + '...');
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired');
        },
        'error-callback': () => {
          console.error('reCAPTCHA error');
        }
      });
      resolve(widgetId);
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Initialize hCaptcha as fallback
   * @param {string} containerId - Container element ID
   * @returns {Promise<string>} Widget ID
   */
  async initializeHcaptcha(containerId) {
    return new Promise((resolve, reject) => {
      if (!window.hcaptcha) {
        const script = document.createElement('script');
        script.src = 'https://hcaptcha.com/1/api.js?onload=onHcaptchaLoad&render=explicit';
        script.async = true;
        script.defer = true;
        
        window.onHcaptchaLoad = () => {
          this.renderHcaptcha(containerId, resolve, reject);
        };
        
        script.onerror = () => reject(new Error('Failed to load hCaptcha'));
        document.head.appendChild(script);
      } else {
        this.renderHcaptcha(containerId, resolve, reject);
      }
    });
  }

  renderHcaptcha(containerId, resolve, reject) {
    try {
      const widgetId = window.hcaptcha.render(containerId, {
        sitekey: process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY,
        callback: (token) => {
          console.log('hCaptcha completed:', token.substring(0, 20) + '...');
        },
        'expired-callback': () => {
          console.warn('hCaptcha expired');
        },
        'error-callback': () => {
          console.error('hCaptcha error');
        }
      });
      resolve(widgetId);
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Initialize custom math CAPTCHA for offline/fallback
   * @param {string} containerId - Container element ID
   * @returns {Promise<string>} Widget ID
   */
  async initializeMathCaptcha(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }

    const challenge = this.generateMathChallenge();
    const widgetId = `math_captcha_${Date.now()}`;

    container.innerHTML = `
      <div id="${widgetId}" class="math-captcha">
        <div class="captcha-question">
          <label>Please solve: ${challenge.question}</label>
          <input 
            type="number" 
            id="${widgetId}_input" 
            placeholder="Enter answer"
            required
          />
        </div>
        <div class="captcha-refresh">
          <button type="button" onclick="window.refreshMathCaptcha('${widgetId}')">
            🔄 New Question
          </button>
        </div>
      </div>
    `;

    // Store challenge for verification
    window.mathChallenges = window.mathChallenges || {};
    window.mathChallenges[widgetId] = challenge;

    // Setup refresh function
    window.refreshMathCaptcha = (id) => {
      const newChallenge = this.generateMathChallenge();
      window.mathChallenges[id] = newChallenge;
      document.querySelector(`#${id} label`).textContent = `Please solve: ${newChallenge.question}`;
      document.querySelector(`#${id}_input`).value = '';
    };

    return Promise.resolve(widgetId);
  }

  /**
   * Generate mathematical challenge for custom CAPTCHA
   * @returns {Object} Challenge object with question and answer
   */
  generateMathChallenge() {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1, num2, answer, question;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 50) + 25; // Ensure positive result
        num2 = Math.floor(Math.random() * 25) + 1;
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;
    }

    return { question, answer };
  }

  /**
   * Verify CAPTCHA response
   * @param {string} provider - CAPTCHA provider used
   * @param {string} token - CAPTCHA response token
   * @param {string} widgetId - Widget ID for math CAPTCHA
   * @param {string} userInput - User input for math CAPTCHA
   * @returns {Promise<Object>} Verification result
   */
  async verifyCaptcha(provider, token, widgetId = null, userInput = null) {
    try {
      // Log verification attempt
      await this.logVerificationAttempt(provider, token ? 'token' : 'math');

      switch (provider) {
        case this.providers.RECAPTCHA:
          return await this.verifyRecaptcha(token);
        case this.providers.HCAPTCHA:
          return await this.verifyHcaptcha(token);
        case this.providers.MATH:
          return this.verifyMathCaptcha(widgetId, userInput);
        default:
          throw new Error(`Unsupported CAPTCHA provider: ${provider}`);
      }
    } catch (error) {
      console.error('CAPTCHA verification failed:', error);
      return {
        success: false,
        error: error.message,
        provider
      };
    }
  }

  /**
   * Verify Google reCAPTCHA response
   * @param {string} token - reCAPTCHA response token
   * @returns {Promise<Object>} Verification result
   */
  async verifyRecaptcha(token) {
    const response = await fetch('/api/verify-recaptcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        action: 'amoe_entry'
      })
    });

    const result = await response.json();
    
    return {
      success: result.success && result.score >= 0.5, // Minimum score threshold
      score: result.score,
      action: result.action,
      provider: this.providers.RECAPTCHA,
      challenge_ts: result.challenge_ts
    };
  }

  /**
   * Verify hCaptcha response
   * @param {string} token - hCaptcha response token
   * @returns {Promise<Object>} Verification result
   */
  async verifyHcaptcha(token) {
    const response = await fetch('/api/verify-hcaptcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    });

    const result = await response.json();
    
    return {
      success: result.success,
      provider: this.providers.HCAPTCHA,
      challenge_ts: result.challenge_ts
    };
  }

  /**
   * Verify math CAPTCHA response
   * @param {string} widgetId - Widget ID
   * @param {string} userInput - User's answer
   * @returns {Object} Verification result
   */
  verifyMathCaptcha(widgetId, userInput) {
    const challenge = window.mathChallenges?.[widgetId];
    
    if (!challenge) {
      return {
        success: false,
        error: 'Challenge not found',
        provider: this.providers.MATH
      };
    }

    const userAnswer = parseInt(userInput, 10);
    const isCorrect = userAnswer === challenge.answer;

    // Clean up challenge after verification
    if (window.mathChallenges) {
      delete window.mathChallenges[widgetId];
    }

    return {
      success: isCorrect,
      provider: this.providers.MATH,
      challenge_ts: new Date().toISOString()
    };
  }

  /**
   * Log CAPTCHA verification attempt for monitoring
   * @param {string} provider - CAPTCHA provider
   * @param {string} type - Type of verification
   */
  async logVerificationAttempt(provider, type) {
    try {
      const { error } = await supabase
        .from('captcha_logs')
        .insert({
          provider,
          type,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.warn('Failed to log CAPTCHA attempt:', error);
      }
    } catch (error) {
      console.warn('Logging error:', error);
    }
  }

  /**
   * Get client IP address for logging
   * @returns {Promise<string>} Client IP address
   */
  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if user has exceeded CAPTCHA failure threshold
   * @param {string} identifier - User identifier (IP, device ID, etc.)
   * @returns {Promise<boolean>} True if user is blocked
   */
  async isUserBlocked(identifier) {
    try {
      const { data, error } = await supabase
        .from('captcha_failures')
        .select('failure_count, last_failure')
        .eq('identifier', identifier)
        .single();

      if (error || !data) return false;

      // Check if user has exceeded threshold in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const lastFailure = new Date(data.last_failure);

      return data.failure_count >= this.failureThreshold && 
             lastFailure > oneHourAgo;
    } catch (error) {
      console.error('Error checking user block status:', error);
      return false;
    }
  }

  /**
   * Record CAPTCHA failure for rate limiting
   * @param {string} identifier - User identifier
   */
  async recordFailure(identifier) {
    try {
      const { error } = await supabase
        .rpc('increment_captcha_failures', {
          user_identifier: identifier,
          max_failures: this.failureThreshold
        });

      if (error) {
        console.warn('Failed to record CAPTCHA failure:', error);
      }
    } catch (error) {
      console.warn('Error recording failure:', error);
    }
  }

  /**
   * Reset CAPTCHA failures for user
   * @param {string} identifier - User identifier
   */
  async resetFailures(identifier) {
    try {
      const { error } = await supabase
        .from('captcha_failures')
        .delete()
        .eq('identifier', identifier);

      if (error) {
        console.warn('Failed to reset CAPTCHA failures:', error);
      }
    } catch (error) {
      console.warn('Error resetting failures:', error);
    }
  }

  /**
   * Clean up CAPTCHA widget
   * @param {string} provider - CAPTCHA provider
   * @param {string} widgetId - Widget ID to clean up
   */
  cleanup(provider, widgetId) {
    try {
      switch (provider) {
        case this.providers.RECAPTCHA:
          if (window.grecaptcha && widgetId) {
            window.grecaptcha.reset(widgetId);
          }
          break;
        case this.providers.HCAPTCHA:
          if (window.hcaptcha && widgetId) {
            window.hcaptcha.reset(widgetId);
          }
          break;
        case this.providers.MATH:
          if (window.mathChallenges && widgetId) {
            delete window.mathChallenges[widgetId];
          }
          const element = document.getElementById(widgetId);
          if (element) {
            element.innerHTML = '';
          }
          break;
      }
    } catch (error) {
      console.warn('CAPTCHA cleanup error:', error);
    }
  }
}

export default new CaptchaService();
