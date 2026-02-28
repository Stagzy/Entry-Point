import { supabase, TABLES } from '../config/supabase';

// Enable real Supabase connection now that database is linked
const isRealSupabase = true; // Enable real Supabase
console.log('� Activity services using real Supabase backend');

/**
 * Activity Types
 */
export const ACTIVITY_TYPES = {
  GIVEAWAY_CREATED: 'giveaway_created',
  ENTRY_PURCHASED: 'entry_purchased',
  WINNER_SELECTED: 'winner_selected',
  MILESTONE_REACHED: 'milestone_reached',
  USER_ACHIEVEMENT: 'user_achievement',
  GIVEAWAY_COMMENT: 'giveaway_comment',
  GIVEAWAY_LIKED: 'giveaway_liked',
  USER_FOLLOWED: 'user_followed'
};

/**
 * Activity Service - Handles live activity feeds and social interactions
 */
export const activityService = {
  /**
   * Create a new activity entry
   */
  async createActivity(activityData) {
    if (!isRealSupabase) {
      // Mock success for development
      console.log('📝 Mock activity created:', activityData);
      return { data: { id: Date.now().toString(), ...activityData }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.ACTIVITIES)
        .insert([{
          type: activityData.type,
          user_id: activityData.userId,
          giveaway_id: activityData.giveawayId,
          metadata: activityData.metadata || {},
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create activity:', error);
        return { data: null, error };
      }

      console.log('✅ Activity created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Create activity service error:', error);
      return { data: null, error: { message: error.message || 'Failed to create activity' } };
    }
  },

  /**
   * Get recent activities for the feed
   */
  async getRecentActivities(limit = 50, offset = 0) {
    console.log('🔍 Getting recent activities, isRealSupabase:', isRealSupabase);
    
    if (!isRealSupabase) {
      // Return mock activities for development
      console.log('📱 Using mock activities for development');
      return { 
        data: [
          {
            id: '1',
            type: ACTIVITY_TYPES.GIVEAWAY_CREATED,
            user_id: 'user-123',
            giveaway_id: 'giveaway-1',
            metadata: {
              giveaway_title: 'iPhone 15 Pro Giveaway',
              creator_name: 'TechReviewer',
              prize: 'iPhone 15 Pro 256GB'
            },
            created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
            user: { display_name: 'TechReviewer', avatar_url: null },
            giveaway: { title: 'iPhone 15 Pro Giveaway', prize: 'iPhone 15 Pro 256GB' }
          },
          {
            id: '2',
            type: ACTIVITY_TYPES.ENTRY_PURCHASED,
            user_id: 'user-456',
            giveaway_id: 'giveaway-1',
            metadata: {
              entries_purchased: 5,
              giveaway_title: 'iPhone 15 Pro Giveaway',
              user_name: 'Sarah M.'
            },
            created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
            user: { display_name: 'Sarah M.', avatar_url: null },
            giveaway: { title: 'iPhone 15 Pro Giveaway', prize: 'iPhone 15 Pro 256GB' }
          },
          {
            id: '3',
            type: ACTIVITY_TYPES.MILESTONE_REACHED,
            user_id: 'user-123',
            giveaway_id: 'giveaway-2',
            metadata: {
              milestone: '50% filled',
              giveaway_title: 'Gaming Setup Giveaway',
              current_entries: 250,
              max_entries: 500
            },
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
            user: { display_name: 'GameMaster', avatar_url: null },
            giveaway: { title: 'Gaming Setup Giveaway', prize: 'Complete Gaming Setup' }
          },
          {
            id: '4',
            type: ACTIVITY_TYPES.WINNER_SELECTED,
            user_id: 'user-789',
            giveaway_id: 'giveaway-3',
            metadata: {
              giveaway_title: 'MacBook Air Giveaway',
              winner_name: 'Alex K.',
              prize: 'MacBook Air M2 13"'
            },
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            user: { display_name: 'Alex K.', avatar_url: null },
            giveaway: { title: 'MacBook Air Giveaway', prize: 'MacBook Air M2 13"' }
          },
          {
            id: '5',
            type: ACTIVITY_TYPES.GIVEAWAY_CREATED,
            user_id: 'user-999',
            giveaway_id: 'giveaway-4',
            metadata: {
              giveaway_title: 'AirPods Pro Giveaway',
              creator_name: 'AudioFan',
              prize: 'AirPods Pro 2nd Gen'
            },
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            user: { display_name: 'AudioFan', avatar_url: null },
            giveaway: { title: 'AirPods Pro Giveaway', prize: 'AirPods Pro 2nd Gen' }
          }
        ], 
        error: null 
      };
    }

    try {
      // Use the optimized database function for better performance
      const { data, error } = await supabase
        .rpc('get_recent_activities', {
          limit_count: limit,
          offset_count: offset
        });

      if (error) {
        console.error('❌ Failed to fetch activities:', error);
        return { data: [], error };
      }

      // Transform data to match expected format
      const transformedData = (data || []).map(activity => ({
        ...activity,
        user: {
          display_name: activity.user_display_name,
          username: activity.user_username,
          avatar_url: activity.user_avatar_url
        },
        giveaway: {
          title: activity.giveaway_title,
          prize: activity.giveaway_prize
        }
      }));

      console.log('✅ Activities fetched successfully');
      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Get activities service error:', error);
      return { data: [], error: { message: error.message || 'Failed to fetch activities' } };
    }
  },

  /**
   * Subscribe to real-time activity updates
   */
  subscribeToActivities(callback) {
    if (!isRealSupabase) {
      // Mock real-time updates for development
      const mockInterval = setInterval(() => {
        const mockActivity = {
          id: Date.now().toString(),
          type: ACTIVITY_TYPES.ENTRY_PURCHASED,
          user_id: 'user-' + Math.floor(Math.random() * 1000),
          giveaway_id: 'giveaway-' + Math.floor(Math.random() * 5),
          metadata: {
            entries_purchased: Math.floor(Math.random() * 10) + 1,
            giveaway_title: 'Live Giveaway',
            user_name: 'User ' + Math.floor(Math.random() * 100)
          },
          created_at: new Date().toISOString(),
          user: { display_name: 'Live User', avatar_url: null },
          giveaway: { title: 'Live Giveaway', prize: 'Amazing Prize' }
        };
        callback(mockActivity);
      }, 30000); // New activity every 30 seconds

      return () => clearInterval(mockInterval);
    }

    console.log('🔔 Setting up real-time activity subscription');
    
    const subscription = supabase
      .channel('activities')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.ACTIVITIES
      }, async (payload) => {
        console.log('📡 New activity received:', payload.new);
        
        // Fetch complete activity data with user and giveaway info
        try {
          const { data, error } = await supabase
            .rpc('get_recent_activities', {
              limit_count: 1,
              offset_count: 0
            })
            .eq('id', payload.new.id);

          if (!error && data && data.length > 0) {
            const activity = data[0];
            const transformedActivity = {
              ...activity,
              user: {
                display_name: activity.user_display_name,
                username: activity.user_username,
                avatar_url: activity.user_avatar_url
              },
              giveaway: {
                title: activity.giveaway_title,
                prize: activity.giveaway_prize
              }
            };
            callback(transformedActivity);
          }
        } catch (error) {
          console.error('Error fetching new activity details:', error);
        }
      })
      .subscribe();

    return () => subscription.unsubscribe();
  },

  /**
   * Like a giveaway
   */
  async likeGiveaway(giveawayId, userId) {
    try {
      // Create like activity
      await this.createActivity({
        type: ACTIVITY_TYPES.GIVEAWAY_LIKED,
        userId,
        giveawayId,
        metadata: {
          action: 'liked'
        }
      });

      return { success: true, error: null };
    } catch (error) {
      console.error('Like giveaway service error:', error);
      return { success: false, error: { message: error.message || 'Failed to like giveaway' } };
    }
  },

  /**
   * Comment on a giveaway
   */
  async commentOnGiveaway(giveawayId, userId, comment) {
    try {
      // Create comment activity
      await this.createActivity({
        type: ACTIVITY_TYPES.GIVEAWAY_COMMENT,
        userId,
        giveawayId,
        metadata: {
          comment,
          timestamp: new Date().toISOString()
        }
      });

      return { success: true, error: null };
    } catch (error) {
      console.error('Comment on giveaway service error:', error);
      return { success: false, error: { message: error.message || 'Failed to comment on giveaway' } };
    }
  },

  /**
   * Log when user purchases entries (called from entry service)
   */
  async logEntryPurchase(userId, giveawayId, entriesCount, giveawayTitle, userName) {
    return await this.createActivity({
      type: ACTIVITY_TYPES.ENTRY_PURCHASED,
      userId,
      giveawayId,
      metadata: {
        entries_purchased: entriesCount,
        giveaway_title: giveawayTitle,
        user_name: userName
      }
    });
  },

  /**
   * Log when giveaway is created
   */
  async logGiveawayCreated(userId, giveawayId, giveawayTitle, prize, creatorName) {
    return await this.createActivity({
      type: ACTIVITY_TYPES.GIVEAWAY_CREATED,
      userId,
      giveawayId,
      metadata: {
        giveaway_title: giveawayTitle,
        creator_name: creatorName,
        prize
      }
    });
  },

  /**
   * Log when winner is selected
   */
  async logWinnerSelected(winnerId, giveawayId, giveawayTitle, winnerName, prize) {
    return await this.createActivity({
      type: ACTIVITY_TYPES.WINNER_SELECTED,
      userId: winnerId,
      giveawayId,
      metadata: {
        giveaway_title: giveawayTitle,
        winner_name: winnerName,
        prize
      }
    });
  },

  /**
   * Log milestone achievements
   */
  async logMilestone(creatorId, giveawayId, milestone, giveawayTitle, currentEntries, maxEntries) {
    return await this.createActivity({
      type: ACTIVITY_TYPES.MILESTONE_REACHED,
      userId: creatorId,
      giveawayId,
      metadata: {
        milestone,
        giveaway_title: giveawayTitle,
        current_entries: currentEntries,
        max_entries: maxEntries
      }
    });
  }
};

export default activityService;
