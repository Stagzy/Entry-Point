/**
 * ipGeoService.js - IP-based Geographic Blocking and Rate Limiting
 * 
 * PURPOSE:
 * Block users by IP location and implement rate limiting for AMOE entries.
 * Provides additional layer of geographic compliance enforcement.
 * 
 * FEATURES:
 * - IP geolocation for country/state detection
 * - Automatic blocking of restricted regions
 * - Rate limiting for AMOE entries (IP + user)
 * - CAPTCHA integration for bot protection
 */

// Mock IP geolocation - replace with actual service (MaxMind, IPinfo, etc.)
const mockIPGeolocation = async (ipAddress) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock geographic data based on common IP patterns
  const mockLocations = [
    { country: 'US', region: 'CA', city: 'Los Angeles', allowed: true },
    { country: 'US', region: 'NY', city: 'New York', allowed: false }, // NY blocked
    { country: 'US', region: 'FL', city: 'Miami', allowed: false },     // FL blocked
    { country: 'US', region: 'TX', city: 'Houston', allowed: true },
    { country: 'CA', region: 'ON', city: 'Toronto', allowed: false },   // Canada blocked
    { country: 'GB', region: 'ENG', city: 'London', allowed: false },   // UK blocked
  ];
  
  // Return random location for testing
  const location = mockLocations[Math.floor(Math.random() * mockLocations.length)];
  
  return {
    ip: ipAddress,
    country: location.country,
    region: location.region,
    city: location.city,
    timezone: 'America/New_York',
    allowed: location.allowed
  };
};

export const ipGeoService = {

  /**
   * Get IP geolocation and check if allowed
   */
  async checkIPEligibility(ipAddress) {
    try {
      const geoData = await mockIPGeolocation(ipAddress);
      
      // Check against restricted countries
      const restrictedCountries = ['CA', 'GB', 'FR', 'DE', 'AU', 'JP', 'CN', 'IN'];
      const restrictedStates = ['NY', 'FL', 'RI'];
      
      const countryBlocked = restrictedCountries.includes(geoData.country);
      const stateBlocked = geoData.country === 'US' && restrictedStates.includes(geoData.region);
      
      const isAllowed = !countryBlocked && !stateBlocked;
      
      return {
        data: {
          ...geoData,
          allowed: isAllowed,
          blockReason: countryBlocked ? 'country_blocked' : 
                      stateBlocked ? 'state_blocked' : null
        },
        error: null
      };
    } catch (error) {
      console.error('IP geolocation error:', error);
      // Fail open - don't block if geolocation fails
      return {
        data: {
          ip: ipAddress,
          country: 'US',
          region: 'CA',
          allowed: true
        },
        error: null
      };
    }
  },

  /**
   * Check AMOE rate limits (IP + user based)
   */
  async checkAMOERateLimit(giveawayId, userId, ipAddress) {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Check user daily limit (1 per day per giveaway)
      const { data: userEntries, error: userError } = await supabase
        .from('amoe_entries')
        .select('id')
        .eq('giveaway_id', giveawayId)
        .eq('user_id', userId)
        .eq('entry_date', today);
      
      if (userError) {
        console.error('User rate limit check error:', userError);
        return { allowed: false, error: userError };
      }
      
      if (userEntries.length > 0) {
        return {
          allowed: false,
          reason: 'daily_limit_reached',
          message: 'You have already submitted your free entry for today'
        };
      }
      
      // Check IP daily limit (max 3 per day to prevent abuse)
      const { data: ipEntries, error: ipError } = await supabase
        .from('amoe_entries')
        .select('id')
        .eq('giveaway_id', giveawayId)
        .eq('ip_address', ipAddress)
        .eq('entry_date', today);
      
      if (ipError) {
        console.error('IP rate limit check error:', ipError);
        return { allowed: false, error: ipError };
      }
      
      if (ipEntries.length >= 3) {
        return {
          allowed: false,
          reason: 'ip_limit_reached',
          message: 'Too many entries from this location today'
        };
      }
      
      return { allowed: true };
      
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: false, error };
    }
  },

  /**
   * Record AMOE entry with IP tracking
   */
  async recordAMOEEntry(giveawayId, userId, ipAddress, userAgent, verificationData) {
    try {
      const entryData = {
        giveaway_id: giveawayId,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        verification_data: verificationData,
        entry_date: new Date().toISOString().split('T')[0]
      };
      
      const { data, error } = await supabase
        .from('amoe_entries')
        .insert(entryData)
        .select()
        .single();
      
      if (error) {
        return { data: null, error };
      }
      
      // Also create entry in main entries table
      const mainEntry = {
        giveaway_id: giveawayId,
        user_id: userId,
        entry_count: 1,
        total_cost: 0,
        entry_type: 'amoe',
        payment_status: 'not_required',
        status: 'active',
        verification_data: verificationData
      };
      
      const { error: mainEntryError } = await supabase
        .from('entries')
        .insert(mainEntry);
      
      if (mainEntryError) {
        console.error('Failed to create main entry:', mainEntryError);
        // Don't fail the whole process
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('AMOE entry recording error:', error);
      return { data: null, error };
    }
  },

  /**
   * Generate simple CAPTCHA challenge
   */
  generateCaptcha() {
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let num1, num2, answer;
    
    switch (operator) {
      case '+':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 20) + 10;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 - num2;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        break;
    }
    
    return {
      challenge: `${num1} ${operator} ${num2} = ?`,
      answer: answer,
      id: Date.now() + Math.random()
    };
  },

  /**
   * Verify CAPTCHA response
   */
  verifyCaptcha(challengeId, userAnswer, correctAnswer) {
    return parseInt(userAnswer) === correctAnswer;
  },

  /**
   * Get user's approximate location for display
   */
  async getUserLocation(ipAddress) {
    try {
      const geoData = await mockIPGeolocation(ipAddress);
      
      // Return safe, non-precise location info
      return {
        country: geoData.country,
        region: geoData.region,
        displayLocation: `${geoData.city}, ${geoData.region}`
      };
    } catch (error) {
      return {
        country: 'Unknown',
        region: 'Unknown',
        displayLocation: 'Unknown Location'
      };
    }
  },

  /**
   * Check for suspicious activity patterns
   */
  async detectSuspiciousActivity(userId, ipAddress, action = 'entry') {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Check for rapid-fire entries from same IP
      const { data: recentEntries } = await supabase
        .from('amoe_entries')
        .select('id, created_at')
        .eq('ip_address', ipAddress)
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false });
      
      // Check for multiple accounts from same IP
      const { data: uniqueUsers } = await supabase
        .from('amoe_entries')
        .select('user_id')
        .eq('ip_address', ipAddress)
        .gte('created_at', oneDayAgo);
      
      const uniqueUserCount = new Set(uniqueUsers?.map(u => u.user_id)).size;
      
      const suspicious = {
        rapidEntries: recentEntries?.length > 10,
        multipleAccounts: uniqueUserCount > 5,
        riskScore: Math.min(100, (recentEntries?.length || 0) * 5 + uniqueUserCount * 10)
      };
      
      return {
        suspicious: suspicious.rapidEntries || suspicious.multipleAccounts,
        details: suspicious
      };
    } catch (error) {
      console.error('Suspicious activity detection error:', error);
      return { suspicious: false };
    }
  }
};

export default ipGeoService;
