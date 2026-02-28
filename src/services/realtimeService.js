import { supabase } from '../config/supabase';

// Enable real Supabase connection now that database is linked
const isRealBackend = true; // Enable real Supabase
// Development/Mock Mode Configuration
const MOCK_MODE = false;

console.log('🔥 Realtime services using real Supabase backend');

/**
 * Real-time Service for live updates using Supabase Realtime
 */
export const realtimeService = {
  
  /**
   * Subscribe to giveaway entry updates
   */
  subscribeToGiveawayEntries(giveawayId, callback) {
    if (!isRealBackend) {
      console.log('📡 Mock mode: Real-time subscriptions disabled');
      return null;
    }

    const subscription = supabase
      .channel(`giveaway-${giveawayId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'entries',
          filter: `giveaway_id=eq.${giveawayId}`
        },
        (payload) => {
          console.log('📡 Real-time entry update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  },

  /**
   * Subscribe to all giveaway updates (for general stats)
   */
  subscribeToGiveawayUpdates(callback) {
    if (!isRealBackend) {
      console.log('📡 Mock mode: Real-time subscriptions disabled');
      return null;
    }

    const subscription = supabase
      .channel('all-giveaways')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'giveaways'
        },
        (payload) => {
          console.log('📡 Real-time giveaway update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  },

  /**
   * Subscribe to user entries (for personal activity)
   */
  subscribeToUserEntries(userId, callback) {
    if (!isRealBackend) {
      console.log('📡 Mock mode: Real-time subscriptions disabled');
      return null;
    }

    const subscription = supabase
      .channel(`user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entries',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('📡 Real-time user entry update:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  },

  /**
   * Subscribe to winners announcements
   */
  subscribeToWinners(callback) {
    if (!isRealBackend) {
      console.log('📡 Mock mode: Real-time subscriptions disabled');
      return null;
    }

    const subscription = supabase
      .channel('winners')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'winners' // We'll create this table
        },
        (payload) => {
          console.log('🎉 New winner announced:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  },

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  },

  /**
   * Get live entry count for a giveaway
   */
  async getLiveEntryCount(giveawayId) {
    if (!isRealBackend) {
      // Return mock count for development
      return Math.floor(Math.random() * 50) + 10; // Random count between 10-60
    }

    try {
      // Validate giveaway ID format
      if (!giveawayId || typeof giveawayId !== 'string') {
        console.warn('Invalid giveaway ID:', giveawayId);
        return 0;
      }

      // For now, since we're using mock data with numeric IDs, return a mock count
      // This will be replaced with real queries once the database is properly set up
      if (giveawayId.length < 10) { // Likely a mock ID
        return Math.floor(Math.random() * 50) + 10;
      }

      const { data, error } = await supabase
        .from('entries')
        .select('ticket_count')
        .eq('giveaway_id', giveawayId);

      if (error) {
        console.error('Error fetching entry count:', error);
        return 0;
      }

      // Sum up all ticket counts
      const totalTickets = (data || []).reduce((sum, entry) => sum + (entry.ticket_count || 0), 0);
      return totalTickets;
    } catch (error) {
      console.error('Error calculating live entry count:', error);
      return 0;
    }
  },

  /**
   * Get recent entries for a giveaway (for live activity feed)
   */
  async getRecentEntries(giveawayId, limit = 10) {
    if (!isRealBackend) {
      // Return mock data for development
      return [
        {
          id: 'mock_entry_1',
          ticket_count: 2,
          created_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
          user: {
            id: 'mock_user_1',
            username: 'alex_gamer',
            display_name: 'Alex Gamer', 
            avatar_url: null
          }
        },
        {
          id: 'mock_entry_2',
          ticket_count: 1,
          created_at: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
          user: {
            id: 'mock_user_2',
            username: 'sarah_tech',
            display_name: 'Sarah Tech',
            avatar_url: null
          }
        },
        {
          id: 'mock_entry_3',
          ticket_count: 3,
          created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          user: {
            id: 'mock_user_3',
            username: 'mike_wins',
            display_name: 'Mike Wins',
            avatar_url: null
          }
        }
      ];
    }

    try {
      // Validate giveaway ID
      if (!giveawayId || typeof giveawayId !== 'string') {
        console.warn('Invalid giveaway ID for recent entries:', giveawayId);
        return [];
      }

      // For mock IDs (short numeric strings), return mock data
      if (giveawayId.length < 10) {
        return [
          {
            id: `entry_${giveawayId}_1`,
            ticket_count: 2,
            created_at: new Date(Date.now() - 120000).toISOString(),
            user: {
              id: 'demo_user_1',
              username: 'crypto_king',
              display_name: 'Crypto King',
              avatar_url: null
            }
          }
        ];
      }

      const { data, error } = await supabase
        .from('entries')
        .select(`
          id,
          ticket_count,
          created_at,
          users!inner (
            id,
            username,
            avatar_url
          )
        `)
        .eq('giveaway_id', giveawayId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent entries:', error);
        return [];
      }

      // Transform the data to match our expected format
      const transformedData = (data || []).map(entry => ({
        ...entry,
        user: {
          id: entry.users.id,
          username: entry.users.username,
          display_name: entry.users.username, // Use username as display_name fallback
          avatar_url: entry.users.avatar_url
        }
      }));

      return transformedData;
    } catch (error) {
      console.error('Error getting recent entries:', error);
      return [];
    }
  },

  /**
   * Broadcast a custom event (for notifications)
   */
  async broadcastEvent(channel, event, payload) {
    try {
      const subscription = supabase.channel(channel);
      await subscription.send({
        type: 'broadcast',
        event: event,
        payload: payload
      });
    } catch (error) {
      console.error('Error broadcasting event:', error);
    }
  }
};
