/**
 * contentModerationService.js - NSFW/Violence Image Scanning
 * 
 * PURPOSE:
 * Scans prize images for NSFW content and violence before giveaway publication.
 * Integrates with cloud AI services for automated content moderation.
 * 
 * FEATURES:
 * - NSFW detection for inappropriate content
 * - Violence/weapon detection for safety
 * - Text extraction and profanity scanning
 * - Manual review queue for edge cases
 * - Automated approval/rejection workflow
 */

import { supabase } from '../config/supabase';

// Mock AI service - replace with actual service (Google Vision, AWS Rekognition, etc.)
const mockAIModeration = async (imageUrl) => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock results - replace with actual API calls
  const mockResults = {
    nsfw: {
      detected: Math.random() < 0.05, // 5% chance of NSFW
      confidence: Math.random(),
      categories: ['adult', 'explicit', 'suggestive', 'medical', 'violence']
    },
    violence: {
      detected: Math.random() < 0.02, // 2% chance of violence
      confidence: Math.random(),
      categories: ['weapons', 'blood', 'fighting', 'disturbing']
    },
    text: {
      detected: Math.random() < 0.3, // 30% chance of text
      extractedText: '',
      profanityDetected: false
    },
    overall: {
      safe: Math.random() > 0.1, // 90% safe rate
      confidence: Math.random()
    }
  };
  
  return mockResults;
};

export const contentModerationService = {

  /**
   * Scan giveaway image for inappropriate content
   */
  async scanGiveawayImage(imageUrl, giveawayId, userId) {
    try {
      console.log('🔍 Scanning image for content violations...');
      
      // Call AI moderation service
      const aiResults = await mockAIModeration(imageUrl);
      
      // Determine if content should be flagged
      const flagged = 
        (aiResults.nsfw.detected && aiResults.nsfw.confidence > 0.7) ||
        (aiResults.violence.detected && aiResults.violence.confidence > 0.8) ||
        aiResults.text.profanityDetected;
      
      const flaggedCategories = [];
      if (aiResults.nsfw.detected) flaggedCategories.push('nsfw');
      if (aiResults.violence.detected) flaggedCategories.push('violence');
      if (aiResults.text.profanityDetected) flaggedCategories.push('profanity');
      
      // Store moderation record
      const moderationRecord = {
        content_type: 'giveaway_image',
        content_id: giveawayId,
        user_id: userId,
        status: flagged ? 'flagged' : 'approved',
        ai_confidence: aiResults.overall.confidence,
        flagged_categories: flaggedCategories,
        ai_results: aiResults,
        image_url: imageUrl
      };
      
      const { data, error } = await supabase
        .from('content_moderation')
        .insert(moderationRecord)
        .select()
        .single();
      
      if (error) {
        console.error('Failed to store moderation record:', error);
        // Don't fail the whole process if logging fails
      }
      
      // Update giveaway moderation status
      await supabase
        .from('giveaways')
        .update({
          moderation_status: flagged ? 'flagged' : 'approved'
        })
        .eq('id', giveawayId);
      
      console.log(flagged ? '⚠️ Content flagged for review' : '✅ Content approved');
      
      return {
        data: {
          approved: !flagged,
          flagged: flagged,
          categories: flaggedCategories,
          confidence: aiResults.overall.confidence,
          moderationId: data?.id
        },
        error: null
      };
      
    } catch (error) {
      console.error('Content moderation error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get moderation status for giveaway
   */
  async getModerationStatus(giveawayId) {
    try {
      const { data, error } = await supabase
        .from('content_moderation')
        .select('*')
        .eq('content_type', 'giveaway_image')
        .eq('content_id', giveawayId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // Not found is OK
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Manual review by admin
   */
  async reviewContent(moderationId, adminUserId, decision, notes = '') {
    try {
      const { data, error } = await supabase
        .from('content_moderation')
        .update({
          status: decision, // 'approved' or 'rejected'
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes
        })
        .eq('id', moderationId)
        .select()
        .single();
      
      if (error) {
        return { data: null, error };
      }
      
      // Update giveaway status based on review
      await supabase
        .from('giveaways')
        .update({
          moderation_status: decision
        })
        .eq('id', data.content_id);
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Get pending moderation items for admin review
   */
  async getPendingModeration(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('content_moderation')
        .select(`
          *,
          user:users(username, email),
          giveaway:giveaways(title, prize_description)
        `)
        .eq('status', 'flagged')
        .is('reviewed_by', null)
        .order('created_at', { ascending: true })
        .limit(limit);
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Moderate text content (comments, descriptions)
   */
  moderateText(text) {
    const cleanText = text.toLowerCase().trim();
    
    // Comprehensive profanity list
    const profanity = [
      'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 'piss',
      'dickhead', 'moron', 'idiot', 'stupid', 'dumb', 'retard', 'loser',
      'whore', 'slut', 'cunt', 'cock', 'penis', 'vagina', 'pussy'
    ];
    
    // Hate speech keywords
    const hateWords = [
      'nazi', 'hitler', 'terrorist', 'kill yourself', 'die', 'suicide',
      'racial slurs', 'homophobic slurs', 'transphobic', 'sexist'
    ];
    
    // Scam/fraud keywords
    const scamWords = [
      'scam', 'fake', 'fraud', 'rigged', 'cheat', 'steal', 'money back',
      'refund', 'lawsuit', 'sue', 'lawyer', 'police', 'report', 'bitcoin',
      'crypto', 'investment', 'guaranteed', 'get rich', 'make money fast'
    ];
    
    // Spam/promotional keywords
    const spamWords = [
      'check my profile', 'follow me', 'dm me', 'my link', 'visit my',
      'subscribe', 'like and share', 'comment below', 'click here',
      'limited time', 'act now', 'exclusive offer'
    ];
    
    // Check for violations
    const hasProfanity = profanity.some(word => cleanText.includes(word));
    const hasHateSpeech = hateWords.some(word => cleanText.includes(word));
    const hasScamContent = scamWords.some(word => cleanText.includes(word));
    const hasSpamContent = spamWords.some(word => cleanText.includes(word));
    
    // Check for excessive patterns
    const hasExcessiveCaps = (text.match(/[A-Z]/g) || []).length > text.length * 0.5;
    const hasExcessiveRepeats = /(.)\1{4,}/.test(text);
    const hasUrls = /https?:\/\/|www\.|\.com|\.net|\.org/i.test(text);
    
    const violations = [];
    if (hasProfanity) violations.push('profanity');
    if (hasHateSpeech) violations.push('hate_speech');
    if (hasScamContent) violations.push('scam');
    if (hasSpamContent) violations.push('spam');
    if (hasExcessiveCaps) violations.push('excessive_caps');
    if (hasExcessiveRepeats) violations.push('excessive_repeats');
    if (hasUrls) violations.push('urls');
    
    return {
      approved: violations.length === 0,
      violations: violations,
      severity: violations.includes('hate_speech') || violations.includes('scam') ? 'high' : 
                violations.length > 2 ? 'medium' : 'low'
    };
  },

  /**
   * Check if user should be rate limited
   */
  async checkRateLimit(userId, action = 'comment', windowMinutes = 5, maxActions = 10) {
    try {
      const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
      
      // In a real implementation, you'd track user actions in a separate table
      // For now, this is a placeholder for rate limiting logic
      
      return {
        allowed: true,
        actionsRemaining: maxActions,
        resetTime: new Date(Date.now() + windowMinutes * 60 * 1000)
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true }; // Fail open for availability
    }
  }
};

export default contentModerationService;
