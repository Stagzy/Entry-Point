import { supabase, TABLES, BUCKETS } from '../config/supabase';
import { activityService } from './activityService';

// Enable real Supabase connection now that database is linked
const isRealSupabase = true; // Re-enable for production TestFlight build
console.log('� API services using real Supabase backend for production build');

/**
 * Giveaway Service
 */
export const giveawayService = {
  // Get featured/active giveaways for home screen
  async getFeaturedGiveaways(limit = 10) {
    if (!isRealSupabase) {
      // Return mock data for development
      return {
        data: [
          {
            id: '1',
            title: 'iPhone 15 Pro Giveaway',
            creator: 'TechReviewer',
            prize: 'iPhone 15 Pro 256GB',
            image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
            ticketPrice: 5.00,
            totalTickets: 1000,
            soldTickets: 650,
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            progressPercentage: 65,
            category: 'Electronics'
          },
          {
            id: '2', 
            title: 'Gaming Setup Giveaway',
            creator: 'GameMaster',
            prize: 'Complete Gaming Setup',
            image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
            ticketPrice: 10.00,
            totalTickets: 500,
            soldTickets: 200,
            endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            progressPercentage: 40,
            category: 'Gaming'
          }
        ],
        error: null
      };
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.GIVEAWAYS)
        .select(`
          *,
          creator:profiles!creator_id (
            username,
            display_name,
            is_verified
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Transform data to match UI expectations
      const transformedData = data.map(giveaway => ({
        id: giveaway.id,
        title: giveaway.title,
        creator: giveaway.creator?.username || giveaway.creator?.display_name || 'Unknown',
        prize: giveaway.prize,
        image: giveaway.image_url || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
        ticketPrice: parseFloat(giveaway.ticket_price),
        totalTickets: giveaway.total_tickets,
        soldTickets: giveaway.sold_tickets,
        endDate: giveaway.end_date,
        progressPercentage: Math.round((giveaway.sold_tickets / giveaway.total_tickets) * 100),
        category: giveaway.category || 'General'
      }));

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Error fetching featured giveaways:', error);
      return { data: [], error: error.message };
    }
  },

  // Get recent winners for home screen
  async getRecentWinners(limit = 5) {
    if (!isRealSupabase) {
      return {
        data: [
          {
            id: '1',
            username: 'lucky_winner_1',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2e8d8e3?w=100',
            prize: 'iPhone 15 Pro',
            giveawayTitle: 'iPhone 15 Pro Giveaway',
            wonAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            username: 'winner_2023',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
            prize: 'Gaming PC',
            giveawayTitle: 'Gaming Setup Giveaway',
            wonAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        error: null
      };
    }

    try {
      // Note: This assumes you have a winners table
      // For now, we'll return empty since the table might not exist yet
      return { data: [], error: null };
    } catch (error) {
      console.error('Error fetching recent winners:', error);
      return { data: [], error: error.message };
    }
  },

  // Get trending creators
  async getTrendingCreators(limit = 5) {
    if (!isRealSupabase) {
      return {
        data: [
          {
            id: '1',
            username: 'techreviewer',
            name: 'Tech Reviewer',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
            isVerified: true,
            followers: 15420,
            activeGiveaways: 3,
            totalValue: 25000
          },
          {
            id: '2',
            username: 'gamemaster',
            name: 'Game Master',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
            isVerified: true,
            followers: 8930,
            activeGiveaways: 2,
            totalValue: 15000
          }
        ],
        error: null
      };
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select(`
          id,
          username,
          name,
          avatar_url,
          is_verified
        `)
        .eq('is_creator', true)
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const transformedData = data.map(creator => ({
        id: creator.id,
        username: creator.username,
        name: creator.name,
        avatar: creator.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        isVerified: creator.is_verified,
        followers: Math.floor(Math.random() * 20000) + 1000, // Mock for now
        activeGiveaways: Math.floor(Math.random() * 5) + 1, // Mock for now  
        totalValue: Math.floor(Math.random() * 50000) + 5000 // Mock for now
      }));

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Error fetching trending creators:', error);
      return { data: [], error: error.message };
    }
  },

  // Get single giveaway by ID
  async getGiveawayById(id) {
    if (!isRealSupabase) {
      // Return mock data with comprehensive details matching the screenshot
      return {
        data: {
          id: id,
          title: 'Luxury Fashion Package',
          creator: 'FashionBlogger',
          creatorId: 1,
          description: 'Luxury clothing and accessories package',
          prize: 'Luxury clothing and accessories package',
          image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
          ticketPrice: 2.00,
          totalTickets: 100,
          soldTickets: 23,
          endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Ended 1 day ago
          category: 'Fashion',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          verified: true,
          // Creator social media accounts
          creatorSocial: {
            instagram: '@fashionblogger',
            youtube: 'Fashion Channel',
            twitter: '@fashionblogger',
            tiktok: '@fashionblogger',
            discord: null,
            steam: null,
            reddit: null
          },
          // Delivery options
          deliveryMethod: {
            type: 'shipping',
            usShipping: true,
            internationalShipping: true,
            pickupAvailable: false,
            pickupLocations: [],
            shippingNotes: 'Free worldwide shipping included.',
            estimatedDelivery: '7-14 business days'
          }
        },
        error: null
      };
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.GIVEAWAYS)
        .select(`
          *,
          creator:profiles!creator_id (
            id,
            username,
            name,
            is_verified,
            avatar_url,
            instagram_handle,
            twitter_handle,
            youtube_handle,
            tiktok_handle
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const transformedData = {
        id: data.id,
        title: data.title,
        creator: data.creator?.username || data.creator?.name || 'Unknown',
        creatorId: data.creator_id,
        description: data.description,
        prize: data.prize_value,
        image: data.image_url || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
        ticketPrice: parseFloat(data.entry_cost || 0),
        totalTickets: data.max_entries || 1000,
        soldTickets: data.total_entries || 0,
        endDate: data.ends_at,
        category: data.category || 'General',
        createdAt: data.created_at,
        verified: data.creator?.is_verified || false,
        // Creator social media accounts from database
        creatorSocial: {
          instagram: data.creator?.instagram_handle,
          youtube: data.creator?.youtube_handle,
          twitter: data.creator?.twitter_handle,
          tiktok: data.creator?.tiktok_handle,
          discord: null, // Not in schema yet
          steam: null, // Not in schema yet
          reddit: null // Not in schema yet
        },
        // Delivery options - would come from giveaway metadata in real implementation
        deliveryMethod: {
          type: 'hybrid', // Default for now
          usShipping: true,
          internationalShipping: true,
          pickupAvailable: false,
          pickupLocations: [],
          shippingNotes: 'Shipping details will be provided to winner.',
          estimatedDelivery: '7-14 business days'
        }
      };

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Error fetching giveaway:', error);
      return { data: null, error: error.message };
    }
  },

  // Create new giveaway
  async createGiveaway(giveawayData, creatorId) {
    try {
      console.log('🎯 Creating new giveaway...');
      
      const { data, error } = await supabase
        .from(TABLES.GIVEAWAYS)
        .insert({
          creator_id: creatorId,
          title: giveawayData.title,
          description: giveawayData.description,
          prize: giveawayData.prize,
          image_url: giveawayData.image_url,
          ticket_price: parseFloat(giveawayData.ticketPrice),
          total_tickets: parseInt(giveawayData.totalTickets),
          sold_tickets: 0,
          start_date: giveawayData.startDate || new Date().toISOString(),
          end_date: giveawayData.endDate,
          status: giveawayData.status || 'draft',
          category: giveawayData.category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Giveaway creation failed:', error);
        return { data: null, error };
      }

      // Log activity for giveaway creation
      await activityService.logGiveawayCreated(
        creatorId,
        data.id,
        giveawayData.title,
        giveawayData.prize,
        giveawayData.creator_name || 'Creator'
      );

      console.log('✅ Giveaway created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Create giveaway service error:', error);
      return { data: null, error: { message: error.message || 'Failed to create giveaway' } };
    }
  },

  // Update existing giveaway
  async updateGiveaway(giveawayId, updates, creatorId) {
    try {
      console.log('📝 Updating giveaway...');
      
      const { data, error } = await supabase
        .from(TABLES.GIVEAWAYS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', giveawayId)
        .eq('creator_id', creatorId) // Ensure only creator can update
        .select()
        .single();

      if (error) {
        console.error('❌ Giveaway update failed:', error);
        return { data: null, error };
      }

      console.log('✅ Giveaway updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Update giveaway service error:', error);
      return { data: null, error: { message: error.message || 'Failed to update giveaway' } };
    }
  },

  // Delete giveaway
  async deleteGiveaway(giveawayId, creatorId) {
    try {
      console.log('🗑️ Deleting giveaway...');
      
      const { error } = await supabase
        .from(TABLES.GIVEAWAYS)
        .delete()
        .eq('id', giveawayId)
        .eq('creator_id', creatorId); // Ensure only creator can delete

      if (error) {
        console.error('❌ Giveaway deletion failed:', error);
        return { error };
      }

      console.log('✅ Giveaway deleted successfully');
      return { error: null };
    } catch (error) {
      console.error('Delete giveaway service error:', error);
      return { error: { message: error.message || 'Failed to delete giveaway' } };
    }
  },

  // Get giveaways by creator
  async getCreatorGiveaways(creatorId, filters = {}) {
    if (!isRealSupabase) {
      // Return mock creator giveaways for development
      return { 
        data: [
          {
            id: 'creator-1',
            title: 'My Gaming Setup Giveaway',
            creator_id: creatorId,
            prize: 'Complete Gaming Setup Worth $3000',
            entry_cost: 10,
            max_entries: 500,
            current_entries: 125,
            status: 'active',
            end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            views: 1500
          },
          {
            id: 'creator-2',
            title: 'iPhone 15 Pro Giveaway',
            creator_id: creatorId,
            prize: 'iPhone 15 Pro 256GB',
            entry_cost: 5,
            max_entries: 1000,
            current_entries: 750,
            status: 'active',
            end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            views: 2800
          },
          {
            id: 'creator-3',
            title: 'MacBook Air Giveaway',
            creator_id: creatorId,
            prize: 'MacBook Air M2 13"',
            entry_cost: 15,
            max_entries: 300,
            current_entries: 300,
            status: 'completed',
            end_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            views: 1200
          }
        ], 
        error: null 
      };
    }

    try {
      console.log('👤 Fetching creator giveaways for:', creatorId);
      
      if (!creatorId) {
        console.error('No creator ID provided');
        return { data: [], error: 'Creator ID is required' };
      }
      
      let query = supabase
        .from(TABLES.GIVEAWAYS)
        .select(`
          *
        `)
        .eq('creator_id', creatorId);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Failed to fetch creator giveaways:', error);
        // Return empty array with user-friendly error message
        return { 
          data: [], 
          error: { 
            message: 'Unable to load giveaways. Please check your connection and try again.',
            details: error.message,
            code: error.code
          } 
        };
      }

      if (!data) {
        console.log('📝 No giveaways found for creator:', creatorId);
        return { data: [], error: null };
      }

      // Transform data to match expected format with safe parsing
      const transformedData = data?.map(giveaway => {
        try {
          return {
            id: giveaway.id,
            title: giveaway.title || 'Untitled Giveaway',
            description: giveaway.description || '',
            creator_id: giveaway.creator_id,
            prize: giveaway.prize_value || giveaway.prize || 'Prize',
            entry_cost: parseFloat(giveaway.entry_cost) || 0,
            max_entries: parseInt(giveaway.max_entries) || 0,
            current_entries: parseInt(giveaway.total_entries || 0),
            total_entries: parseInt(giveaway.total_entries || 0),
            status: giveaway.status || 'draft',
            end_date: giveaway.ends_at || giveaway.end_date,
            start_date: giveaway.starts_at || giveaway.start_date,
            created_at: giveaway.created_at,
            image_url: giveaway.image_url || null,
            views: giveaway.view_count || 0,
            category: giveaway.category || '',
            is_featured: giveaway.is_featured || false,
            winner_id: giveaway.winner_id || null,
            winner_selected_at: giveaway.winner_selected_at || null
          };
        } catch (transformError) {
          console.warn('⚠️ Error transforming giveaway data:', transformError, giveaway);
          // Return basic structure even if transformation fails
          return {
            id: giveaway.id || 'unknown',
            title: 'Error Loading Giveaway',
            creator_id: giveaway.creator_id,
            entry_cost: 0,
            current_entries: 0,
            status: 'error'
          };
        }
      }) || [];

      console.log(`✅ Creator giveaways fetched successfully: ${transformedData.length} giveaways`);
      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Get creator giveaways service error:', error);
      return { data: [], error: { message: error.message || 'Failed to fetch creator giveaways' } };
    }
  },

  // Upload giveaway image to Supabase storage
  async uploadGiveawayImage(imageFile, fileName) {
    try {
      console.log('📸 Uploading giveaway image...');
      
      const fileExt = fileName.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(BUCKETS.GIVEAWAY_IMAGES)
        .upload(uniqueFileName, imageFile);

      if (error) {
        console.error('❌ Image upload failed:', error);
        return { data: null, error };
      }

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from(BUCKETS.GIVEAWAY_IMAGES)
        .getPublicUrl(uniqueFileName);

      console.log('✅ Image uploaded successfully');
      return { data: publicUrl.publicUrl, error: null };
    } catch (error) {
      console.error('Upload image service error:', error);
      return { data: null, error: { message: error.message || 'Failed to upload image' } };
    }
  },

  // Get platform statistics for home screen
  async getPlatformStats() {
    if (!isRealSupabase) {
      // Return mock data when not using real Supabase
      return {
        data: {
          totalGiveaways: 157,
          totalWinners: 2834,
          totalPrizesValue: 534750
        },
        error: null
      };
    }

    try {
      console.log('📊 Fetching platform statistics...');
      
      // Get total giveaways (active and ended)
      const { count: totalGiveaways, error: giveawaysError } = await supabase
        .from(TABLES.GIVEAWAYS)
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'ended']);

      if (giveawaysError) {
        console.error('Error fetching giveaways count:', giveawaysError);
      }

      // Get total winners (from entries with winner status)
      const { count: totalWinners, error: winnersError } = await supabase
        .from(TABLES.ENTRIES)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'winner');

      if (winnersError) {
        console.error('Error fetching winners count:', winnersError);
      }

      // Get total prize value from all ended giveaways
      const { data: endedGiveaways, error: prizeError } = await supabase
        .from(TABLES.GIVEAWAYS)
        .select('prize_value')
        .eq('status', 'ended');

      if (prizeError) {
        console.error('Error fetching prize values:', prizeError);
      }

      // Calculate total prize value
      const totalPrizesValue = endedGiveaways?.reduce((sum, giveaway) => {
        const prizeValue = parseFloat(giveaway.prize_value) || 0;
        return sum + prizeValue;
      }, 0) || 0;

      const stats = {
        totalGiveaways: totalGiveaways || 0,
        totalWinners: totalWinners || 0,
        totalPrizesValue: totalPrizesValue
      };

      console.log('✅ Platform statistics fetched:', stats);
      return { data: stats, error: null };

    } catch (error) {
      console.error('Error fetching platform statistics:', error);
      // Return fallback stats on error
      return {
        data: {
          totalGiveaways: 150,
          totalWinners: 2500,
          totalPrizesValue: 500000
        },
        error: error.message
      };
    }
  }
};

/**
 * Authentication Service
 */
export const authService = {
  async signUp(email, password, metadata = {}) {
    try {
      console.log('🔐 Creating new user account...');
      
      // Create the auth user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { 
          data: {
            name: metadata.name,
            username: metadata.username
          }
        }
      });
      
      if (authError) {
        console.error('Auth signup error:', authError);
        return { data: null, error: authError };
      }
      
      // If auth user was created successfully, create the profile
      if (authData?.user) {
        console.log('✅ Auth user created, setting up profile...');
        
        const { error: profileError } = await supabase
          .from(TABLES.PROFILES)
          .insert({
            id: authData.user.id,
            email: email,
            username: metadata.username || `user_${Date.now()}`,
            name: metadata.name || email.split('@')[0],
            is_verified: false,
            trust_tier: 'Bronze',
            is_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Profile creation failed, but auth user was created
          // User can complete profile later
        } else {
          console.log('✅ User profile created successfully');
        }
      }
      
      return { data: authData, error: null };
    } catch (error) {
      console.error('Signup service error:', error);
      return { data: null, error: { message: error.message || 'Failed to create account' } };
    }
  },

  async signIn(email, password) {
    try {
      console.log('🔐 Signing in user...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Auth signin error:', error);
        return { data: null, error };
      }
      
      console.log('✅ User signed in successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Signin service error:', error);
      return { data: null, error: { message: error.message || 'Failed to sign in' } };
    }
  },

  async signOut() {
    try {
      console.log('🔐 Signing out user...');
      
      if (!isRealSupabase) {
        // Mock mode - just return success, state will be cleared in AuthContext
        console.log('✅ Mock signout successful');
        return { error: null };
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Auth signout error:', error);
        return { error };
      }

      console.log('✅ User signed out successfully');
      return { error: null };
    } catch (error) {
      console.error('Signout service error:', error);
      return { error: { message: error.message || 'Failed to sign out' } };
    }
  },

  async signInWithApple(appleUserData) {
    try {
      console.log('🍎 Signing in with Apple...');
      
      if (!isRealSupabase) {
        // Mock mode - return success with Apple user data
        const mockUser = {
          id: `apple_${Date.now()}`,
          email: appleUserData.email || 'mock.apple@privaterelay.appleid.com',
          user_metadata: {
            name: appleUserData.fullName || appleUserData.username,
            username: appleUserData.username,
            provider: 'apple',
          },
          app_metadata: {
            provider: 'apple',
            providers: ['apple'],
          }
        };
        
        console.log('✅ Mock Apple sign-in successful');
        return { data: { user: mockUser, session: { user: mockUser } }, error: null };
      }
      
      // Real Supabase Apple authentication with identity token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: appleUserData.identityToken,
        nonce: appleUserData.nonce,
      });
      
      if (error) {
        console.error('Apple sign-in error:', error);
        return { data: null, error };
      }
      
      console.log('✅ Apple sign-in successful');
      return { data, error: null };
    } catch (error) {
      console.error('Apple signin service error:', error);
      return { data: null, error: { message: error.message || 'Failed to sign in with Apple' } };
    }
  },

  async signUpWithApple(appleUserData) {
    try {
      console.log('🍎 Signing up with Apple...');
      
      if (!isRealSupabase) {
        // Mock mode - create new Apple user
        const mockUser = {
          id: `apple_${Date.now()}`,
          email: appleUserData.email || 'mock.apple@privaterelay.appleid.com',
          user_metadata: {
            name: appleUserData.fullName || appleUserData.username,
            username: appleUserData.username,
            provider: 'apple',
          },
          app_metadata: {
            provider: 'apple',
            providers: ['apple'],
          }
        };
        
        // Create profile in mock mode
        const profileData = {
          id: mockUser.id,
          name: appleUserData.fullName || appleUserData.username,
          username: appleUserData.username,
          email: mockUser.email,
          avatar_url: null,
          is_creator: false,
          is_admin: false,
          is_verified: appleUserData.isVerified,
          trust_tier: appleUserData.trustTier,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('✅ Mock Apple sign-up successful');
        return { data: { user: mockUser, session: { user: mockUser } }, error: null };
      }
      
      // Real Supabase would handle Apple OAuth signup
      // This is a placeholder for the real implementation
      const { data, error } = await supabase.auth.signUp({
        email: appleUserData.email || `${appleUserData.username}@privaterelay.appleid.com`,
        password: null, // OAuth doesn't use password
        options: {
          data: {
            name: appleUserData.fullName,
            username: appleUserData.username,
            provider: 'apple',
          }
        }
      });
      
      return { data, error };
    } catch (error) {
      console.error('Apple signup service error:', error);
      return { data: null, error: { message: error.message || 'Failed to sign up with Apple' } };
    }
  },

  async signInWithGoogle(idToken, accessToken) {
    try {
      console.log('🌐 Signing in with Google tokens...');
      
      if (!isRealSupabase) {
        // Mock mode - return success with Google user data
        const mockUser = {
          id: `google_${Date.now()}`,
          email: 'mock.google@example.com',
          user_metadata: {
            name: 'Google User',
            username: 'googleuser',
            provider: 'google',
            avatar_url: null,
          },
          app_metadata: {
            provider: 'google',
            providers: ['google'],
          }
        };
        
        console.log('✅ Mock Google sign-in successful');
        return { data: { user: mockUser, session: { user: mockUser } }, error: null };
      }
      
      // Real Supabase Google authentication with ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        access_token: accessToken,
      });
      
      if (error) {
        console.error('Google sign-in error:', error);
        return { data: null, error };
      }
      
      console.log('✅ Google sign-in successful');
      return { data, error: null };
    } catch (error) {
      console.error('Google signin service error:', error);
      return { data: null, error: { message: error.message || 'Failed to sign in with Google' } };
    }
  },

  async signUpWithGoogle(googleUserData) {
    try {
      console.log('🌐 Signing up with Google...');
      
      if (!isRealSupabase) {
        // Mock mode - create new Google user
        const mockUser = {
          id: `google_${Date.now()}`,
          email: googleUserData.email || 'mock.google@example.com',
          user_metadata: {
            name: googleUserData.fullName,
            username: googleUserData.username,
            provider: 'google',
            avatar_url: googleUserData.avatarUrl,
          },
          app_metadata: {
            provider: 'google',
            providers: ['google'],
          }
        };
        
        // Create profile in mock mode
        const profileData = {
          id: mockUser.id,
          name: googleUserData.fullName,
          username: googleUserData.username,
          email: googleUserData.email,
          avatar_url: googleUserData.avatarUrl,
          is_creator: false,
          is_admin: false,
          is_verified: googleUserData.isVerified,
          trust_tier: googleUserData.trustTier,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('✅ Mock Google sign-up successful');
        return { data: { user: mockUser, session: { user: mockUser } }, error: null };
      }
      
      // Real Supabase would handle Google OAuth signup
      // This is a placeholder for the real implementation
      const { data, error } = await supabase.auth.signUp({
        email: googleUserData.email,
        password: null, // OAuth doesn't use password
        options: {
          data: {
            name: googleUserData.fullName,
            username: googleUserData.username,
            provider: 'google',
            avatar_url: googleUserData.avatarUrl,
          }
        }
      });
      
      return { data, error };
    } catch (error) {
      console.error('Google signup service error:', error);
      return { data: null, error: { message: error.message || 'Failed to sign up with Google' } };
    }
  },

  async getCurrentUser() {
    console.log('🔍 Getting current user, isRealSupabase:', isRealSupabase);
    
    if (!isRealSupabase) {
      // Return no user for development - user must login first
      console.log('📱 Mock mode - no auto-login, user must authenticate');
      return { 
        user: null, 
        error: null 
      };
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Get current user error:', error);
        return { user: null, error };
      }
      
      return { user, error: null };
    } catch (error) {
      console.error('Get current user service error:', error);
      return { user: null, error: { message: error.message || 'Failed to get user' } };
    }
  },

  async resetPassword(email) {
    try {
      console.log('🔐 Sending password reset email...');
      
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        console.error('Password reset error:', error);
        return { error };
      }
      
      console.log('✅ Password reset email sent');
      return { error: null };
    } catch (error) {
      console.error('Password reset service error:', error);
      return { error: { message: error.message || 'Failed to send reset email' } };
    }
  },

  // Set up auth state change listener
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

/**
 * User Service
 */
export const userService = {
  async getUserProfile(userId) {
    if (!isRealSupabase) {
      return { data: null, error: { message: 'Using mock data - set up Supabase for real profiles' } };
    }
    
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  async updateUserProfile(userId, updates) {
    if (!isRealSupabase) {
      return { data: null, error: null };
    }
    
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  async createUserProfile(profileData) {
    if (!isRealSupabase) {
      return { data: profileData, error: null };
    }
    
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .insert([profileData])
      .select()
      .single();
    
    return { data, error };
  },

  async searchUsers(query, limit = 10) {
    if (!isRealSupabase) {
      return { data: [], error: null };
    }
    
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('id, username, name, avatar_url, is_verified, trust_tier')
      .or(`username.ilike.%${query}%, name.ilike.%${query}%`)
      .limit(limit);
    
    return { data, error };
  },

  async checkUsernameAvailable(username) {
    if (!isRealSupabase) {
      return { available: true, error: null };
    }
    
    const { data, error } = await supabase
      .from(TABLES.PROFILES)
      .select('username')
      .eq('username', username)
      .limit(1);
    
    if (error) return { available: false, error };
    
    return { available: data.length === 0, error: null };
  }
};

/**
 * Entry Service
 */
export const entryService = {
  async createEntry(entryData) {
    if (!isRealSupabase) {
      // Log mock activity for development
      await activityService.logEntryPurchase(
        entryData.user_id,
        entryData.giveaway_id,
        entryData.entries_count || 1,
        entryData.giveaway_title || 'Demo Giveaway',
        entryData.user_name || 'Demo User'
      );
      return { data: { id: Date.now().toString(), ...entryData }, error: null };
    }
    
    try {
      const { data, error } = await supabase
        .from(TABLES.ENTRIES)
        .insert(entryData)
        .select()
        .single();
      
      if (error) {
        return { data: null, error };
      }
      
      // Log activity for successful entry creation
      await activityService.logEntryPurchase(
        entryData.user_id,
        entryData.giveaway_id,
        entryData.entries_count || 1,
        entryData.giveaway_title,
        entryData.user_name
      );
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: error.message || 'Failed to create entry' } };
    }
  },

  async getUserEntries(userId, limit = 20) {
    if (!isRealSupabase) {
      // Return mock user entries for development
      return { 
        data: [
          {
            id: 'entry-1',
            user_id: userId,
            title: 'Tesla Model 3 Giveaway',
            creator: 'CarEnthusiast',
            prize: 'Tesla Model 3 Standard Range',
            entry_cost: 25,
            max_entries: 2000,
            current_entries: 1650,
            end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            user_entries: 12,
            entry_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'entry-2',
            user_id: userId,
            title: 'MacBook Pro Giveaway',
            creator: 'TechGuru',
            prize: 'MacBook Pro 16" M3 Max',
            entry_cost: 15,
            max_entries: 1000,
            current_entries: 890,
            end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            user_entries: 8,
            entry_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'entry-3',
            user_id: userId,
            title: 'Gaming Chair Giveaway',
            creator: 'GamerStreamer',
            prize: 'Herman Miller Gaming Chair',
            entry_cost: 8,
            max_entries: 600,
            current_entries: 600,
            end_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            user_entries: 5,
            result: 'won',
            entry_date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'entry-4',
            user_id: userId,
            title: '$500 Cash Giveaway',
            creator: 'MoneyMaker',
            prize: '$500 PayPal Cash',
            entry_cost: 2,
            max_entries: 1500,
            current_entries: 1500,
            end_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            user_entries: 25,
            result: 'lost',
            winner: 'Mike R.',
            entry_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
          }
        ], 
        error: null 
      };
    }
    
    const { data, error } = await supabase
      .from(TABLES.ENTRIES)
      .select(`
        *,
        giveaway:giveaways(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  async getGiveawayEntries(giveawayId, limit = 100) {
    if (!isRealSupabase) {
      return { data: [], error: null };
    }
    
    const { data, error } = await supabase
      .from(TABLES.ENTRIES)
      .select(`
        *,
        user:profiles(username, name, avatar_url)
      `)
      .eq('giveaway_id', giveawayId)
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },

  async getEntryCount(giveawayId) {
    if (!isRealSupabase) {
      return { data: 0, error: null };
    }
    
    const { count, error } = await supabase
      .from(TABLES.ENTRIES)
      .select('*', { count: 'exact', head: true })
      .eq('giveaway_id', giveawayId)
      .eq('payment_status', 'completed');
    
    return { data: count || 0, error };
  },

  async selectRandomWinner(giveawayId) {
    if (!isRealSupabase) {
      return { data: null, error: { message: 'Set up Supabase for winner selection' } };
    }
    
    try {
      // Get all valid entries for this giveaway
      const { data: entries, error: entriesError } = await supabase
        .from(TABLES.ENTRIES)
        .select(`
          id,
          user_id,
          created_at,
          user:profiles(username, name, avatar_url)
        `)
        .eq('giveaway_id', giveawayId)
        .eq('payment_status', 'completed');
      
      if (entriesError || !entries || entries.length === 0) {
        return { data: null, error: { message: 'No valid entries found' } };
      }
      
      // Select random winner
      const randomIndex = Math.floor(Math.random() * entries.length);
      const winner = entries[randomIndex];
      
      // Update giveaway with winner
      const { error: updateError } = await supabase
        .from(TABLES.GIVEAWAYS)
        .update({
          winner_id: winner.user_id,
          winner_selected_at: new Date().toISOString(),
          status: 'ended'
        })
        .eq('id', giveawayId);
      
      if (updateError) {
        return { data: null, error: updateError };
      }
      
      return { data: winner, error: null };
      
    } catch (error) {
      return { data: null, error };
    }
  }
};

/**
 * File Upload Service
 */
export const fileService = {
  async uploadGiveawayImage(file, giveawayId) {
    if (!isRealSupabase) {
      return { data: null, error: { message: 'Set up Supabase for image uploads' } };
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${giveawayId}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKETS.GIVEAWAY_IMAGES)
      .upload(fileName, file);
    
    if (error) return { data: null, error };
    
    const { data: urlData } = supabase.storage
      .from(BUCKETS.GIVEAWAY_IMAGES)
      .getPublicUrl(fileName);
    
    return { data: { ...data, publicUrl: urlData.publicUrl }, error: null };
  },

  async uploadAvatar(file, userId) {
    if (!isRealSupabase) {
      return { data: null, error: { message: 'Set up Supabase for avatar uploads' } };
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKETS.AVATARS)
      .upload(fileName, file);
    
    if (error) return { data: null, error };
    
    const { data: urlData } = supabase.storage
      .from(BUCKETS.AVATARS)
      .getPublicUrl(fileName);
    
    return { data: { ...data, publicUrl: urlData.publicUrl }, error: null };
  }
};

/**
 * Real-time Service
 */
export const realtimeService = {
  subscribeToGiveaways(callback) {
    if (!isRealSupabase) {
      return { unsubscribe: () => {} };
    }
    
    const subscription = supabase
      .channel('giveaways')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: TABLES.GIVEAWAYS },
        callback
      )
      .subscribe();
    
    return {
      unsubscribe: () => subscription.unsubscribe()
    };
  },

  subscribeToUserEntries(userId, callback) {
    if (!isRealSupabase) {
      return { unsubscribe: () => {} };
    }
    
    const subscription = supabase
      .channel('user-entries')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: TABLES.ENTRIES,
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
    
    return {
      unsubscribe: () => subscription.unsubscribe()
    };
  }
};

/**
 * Analytics Service
 */
export const analyticsService = {
  /**
   * Get creator analytics data
   */
  async getCreatorAnalytics(creatorId, period = '30d') {
    if (!isRealSupabase) {
      console.log('📊 Mock: Returning empty analytics data');
      return {
        data: {
          totalRevenue: 0,
          totalGiveaways: 0,
          activeGiveaways: 0,
          completedGiveaways: 0,
          totalTicketsSold: 0,
          totalParticipants: 0,
          averageTicketPrice: 0,
          conversionRate: 0,
          revenueChange: 0,
          participantsChange: 0,
          profitMargin: 0,
          roi: 0,
          averageSessionDuration: 0,
          bounceRate: 0,
          customerLifetimeValue: 0,
          revenueBreakdown: [],
          topGiveaways: [],
          audienceInsights: {
            topAgeGroup: 'N/A',
            topLocation: 'N/A',
            peakEngagementTime: 'N/A',
            repeatParticipants: 0,
          }
        },
        error: null
      };
    }

    try {
      console.log('📊 Fetching creator analytics for:', creatorId);

      // Get date range based on period
      const endDate = new Date();
      const startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case 'all':
          startDate.setFullYear(2020); // Far back enough
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get creator's giveaways
      const { data: giveaways, error: giveawaysError } = await supabase
        .from(TABLES.GIVEAWAYS)
        .select('*')
        .eq('creator_id', creatorId);

      if (giveawaysError) throw giveawaysError;

      // Get entries for creator's giveaways
      const giveawayIds = giveaways.map(g => g.id);
      const { data: entries, error: entriesError } = await supabase
        .from(TABLES.ENTRIES)
        .select('*')
        .in('giveaway_id', giveawayIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (entriesError) throw entriesError;

      // Calculate metrics
      const totalRevenue = entries.reduce((sum, entry) => sum + (entry.total_cost || 0), 0);
      const totalGiveaways = giveaways.length;
      const activeGiveaways = giveaways.filter(g => g.status === 'active').length;
      const completedGiveaways = giveaways.filter(g => g.status === 'ended' || g.status === 'completed').length;
      const totalTicketsSold = entries.reduce((sum, entry) => sum + (entry.ticket_count || 0), 0);
      const uniqueParticipants = new Set(entries.map(e => e.user_id)).size;
      const averageTicketPrice = totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;

      // Calculate revenue breakdown (weekly for last 5 weeks)
      const revenueBreakdown = [];
      for (let i = 4; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(endDate.getDate() - (i * 7 + 7));
        const weekEnd = new Date();
        weekEnd.setDate(endDate.getDate() - (i * 7));

        const weekEntries = entries.filter(e => {
          const entryDate = new Date(e.created_at);
          return entryDate >= weekStart && entryDate < weekEnd;
        });

        const weekRevenue = weekEntries.reduce((sum, entry) => sum + (entry.total_cost || 0), 0);
        revenueBreakdown.push({
          date: weekStart.toISOString().split('T')[0],
          amount: weekRevenue
        });
      }

      // Top performing giveaways
      const giveawayStats = giveaways.map(giveaway => {
        const giveawayEntries = entries.filter(e => e.giveaway_id === giveaway.id);
        const revenue = giveawayEntries.reduce((sum, entry) => sum + (entry.total_cost || 0), 0);
        const tickets = giveawayEntries.reduce((sum, entry) => sum + (entry.ticket_count || 0), 0);
        
        return {
          title: giveaway.title,
          revenue,
          tickets,
          status: giveaway.status
        };
      }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      const analyticsData = {
        totalRevenue,
        totalGiveaways,
        activeGiveaways,
        completedGiveaways,
        totalTicketsSold,
        totalParticipants: uniqueParticipants,
        averageTicketPrice,
        conversionRate: 0, // Would need more data to calculate
        revenueChange: 0, // Would need previous period data
        participantsChange: 0, // Would need previous period data
        profitMargin: 0, // Would need cost data
        roi: 0, // Would need investment data
        averageSessionDuration: 0, // Would need session tracking
        bounceRate: 0, // Would need engagement tracking
        customerLifetimeValue: uniqueParticipants > 0 ? totalRevenue / uniqueParticipants : 0,
        revenueBreakdown,
        topGiveaways: giveawayStats,
        audienceInsights: {
          topAgeGroup: 'N/A', // Would need user demographics
          topLocation: 'N/A', // Would need location data
          peakEngagementTime: 'N/A', // Would need time-based analytics
          repeatParticipants: 0, // Would need to calculate repeat users
        }
      };

      console.log('✅ Creator analytics calculated successfully');
      return { data: analyticsData, error: null };

    } catch (error) {
      console.error('❌ Creator analytics error:', error);
      return { data: null, error };
    }
  },

  /**
   * Get admin analytics/metrics
   */
  async getAdminAnalytics() {
    if (!isRealSupabase) {
      console.log('� Mock: Returning empty admin analytics');
      return {
        data: {
          stats: {
            pendingGiveaways: 0,
            pendingVerifications: 0,
            openReports: 0,
            pendingPayouts: 0,
            totalRevenue: 0,
            totalUsers: 0
          },
          giveaways: { total: 0, active: 0, pending: 0, completed: 0 },
          creators: { total: 0, verified: 0, pending: 0 },
          users: { total: 0, active: 0, reported: 0 }
        },
        error: null
      };
    }

    try {
      console.log('📊 Fetching admin analytics...');

      // Get basic counts
      const [
        { count: totalGiveaways },
        { count: activeGiveaways },
        { count: pendingGiveaways },
        { count: totalUsers },
        { count: verifiedCreators }
      ] = await Promise.all([
        supabase.from(TABLES.GIVEAWAYS).select('*', { count: 'exact', head: true }),
        supabase.from(TABLES.GIVEAWAYS).select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from(TABLES.GIVEAWAYS).select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from(TABLES.USERS).select('*', { count: 'exact', head: true }),
        supabase.from(TABLES.USERS).select('*', { count: 'exact', head: true }).eq('is_verified', true)
      ]);

      // Calculate total revenue from all entries
      const { data: entries } = await supabase
        .from(TABLES.ENTRIES)
        .select('total_cost');

      const totalRevenue = entries?.reduce((sum, entry) => sum + (entry.total_cost || 0), 0) || 0;

      const adminData = {
        stats: {
          pendingGiveaways: pendingGiveaways || 0,
          pendingVerifications: 0, // Would need verification requests table
          openReports: 0, // Would need reports table
          pendingPayouts: 0, // Would need payouts table
          totalRevenue,
          totalUsers: totalUsers || 0
        },
        giveaways: {
          total: totalGiveaways || 0,
          active: activeGiveaways || 0,
          pending: pendingGiveaways || 0,
          completed: (totalGiveaways || 0) - (activeGiveaways || 0) - (pendingGiveaways || 0)
        },
        creators: {
          total: verifiedCreators || 0,
          verified: verifiedCreators || 0,
          pending: 0 // Would need pending verification data
        },
        users: {
          total: totalUsers || 0,
          active: totalUsers || 0, // Would need last_active_at calculation
          reported: 0 // Would need reports data
        }
      };

      console.log('✅ Admin analytics calculated successfully');
      return { data: adminData, error: null };

    } catch (error) {
      console.error('❌ Admin analytics error:', error);
      return { data: null, error };
    }
  }
};

/**
 * Comment Service
 */
export const commentService = {
  // Get comments for a giveaway
  async getGiveawayComments(giveawayId) {
    if (!isRealSupabase) {
      // Return mock comments for development
      return {
        data: [
          {
            id: 1,
            user: {
              id: 2,
              name: 'Sarah Miller',
              avatar: null,
              isCreator: false,
              isVerified: false,
              trustTier: 'silver'
            },
            text: 'Is this giveaway worldwide or US only?',
            timestamp: '2 hours ago',
            replies: [
              {
                id: 2,
                user: {
                  id: 1,
                  name: 'TechReviewer',
                  avatar: null,
                  isCreator: true,
                  isVerified: true,
                  trustTier: 'gold'
                },
                text: 'This giveaway is open worldwide! Shipping is included.',
                timestamp: '1 hour ago',
                isCreatorReply: true
              }
            ]
          },
          {
            id: 3,
            user: {
              id: 4,
              name: 'Mike Johnson',
              avatar: null,
              isCreator: false,
              isVerified: true,
              trustTier: 'bronze'
            },
            text: 'Amazing giveaway! Thanks for the opportunity 🙏',
            timestamp: '3 hours ago',
            replies: []
          }
        ],
        error: null
      };
    }

    try {
      // Note: Would need to create comments table with structure like:
      // comments (id, giveaway_id, user_id, parent_comment_id, content, created_at, is_deleted, is_reported)
      
      console.log('📝 Comments service would fetch from database here');
      return { data: [], error: null };
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { data: [], error: error.message };
    }
  },

  // Create a new comment
  async createComment(giveawayId, userId, content, parentCommentId = null) {
    if (!isRealSupabase) {
      // Mock comment creation
      return {
        data: {
          id: Date.now(),
          user: {
            id: userId,
            name: 'Current User',
            avatar: null,
            isCreator: false,
            isVerified: false,
            trustTier: 'bronze'
          },
          text: content,
          timestamp: 'Just now',
          replies: []
        },
        error: null
      };
    }

    try {
      // Would insert into comments table
      console.log('💬 Comment creation would save to database here');
      return { data: null, error: null };
    } catch (error) {
      console.error('Error creating comment:', error);
      return { data: null, error: error.message };
    }
  },

  // Report a comment
  async reportComment(commentId, reporterId, reason) {
    if (!isRealSupabase) {
      return { error: null };
    }

    try {
      // Would insert into comment_reports table
      console.log('🚨 Comment report would save to database here');
      return { error: null };
    } catch (error) {
      console.error('Error reporting comment:', error);
      return { error: error.message };
    }
  }
};

/**
 * Social Media Service
 */
export const socialMediaService = {
  // Get creator's social media accounts
  async getCreatorSocialAccounts(creatorId) {
    if (!isRealSupabase) {
      // Return mock social accounts
      return {
        data: {
          instagram: '@techreviewer',
          youtube: 'TechReviewer Channel',
          twitter: '@techreviewer',
          tiktok: '@techreviewer',
          discord: 'TechReviewer#1234',
          steam: 'techreviewer',
          reddit: 'u/techreviewer'
        },
        error: null
      };
    }

    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select(`
          instagram_handle,
          twitter_handle,
          youtube_handle,
          tiktok_handle
        `)
        .eq('id', creatorId)
        .single();

      if (error) throw error;

      const socialAccounts = {
        instagram: data.instagram_handle,
        youtube: data.youtube_handle,
        twitter: data.twitter_handle,
        tiktok: data.tiktok_handle,
        discord: null, // Not in schema yet
        steam: null, // Not in schema yet
        reddit: null // Not in schema yet
      };

      return { data: socialAccounts, error: null };
    } catch (error) {
      console.error('Error fetching social accounts:', error);
      return { data: null, error: error.message };
    }
  },

  // Verify social media follow
  async verifySocialFollow(userId, platform, handle) {
    // In a real implementation, this would integrate with social media APIs
    // For now, we'll just simulate the verification process
    try {
      console.log(`🔍 Verifying ${platform} follow for ${handle}`);
      
      // Would integrate with social media APIs here
      // For now, return success after a delay to simulate verification
      
      return { data: { verified: true }, error: null };
    } catch (error) {
      console.error('Error verifying social follow:', error);
      return { data: { verified: false }, error: error.message };
    }
  }
};

/**
 * Trust Tier Service
 */
export const trustTierService = {
  // Get tier privileges for a specific tier
  async getTierPrivileges(tier) {
    if (!isRealSupabase) {
      // Return mock privileges based on tier
      const mockPrivileges = {
        'bronze': {
          max_giveaways_per_month: 1,
          max_giveaway_value: 100,
          requires_approval: true,
          can_create_paid_giveaways: false,
          featured_placement: 0,
          priority_support: false,
          custom_branding: false,
          analytics_access: false
        },
        'silver': {
          max_giveaways_per_month: 3,
          max_giveaway_value: 500,
          requires_approval: true,
          can_create_paid_giveaways: true,
          featured_placement: 1,
          priority_support: false,
          custom_branding: true,
          analytics_access: true
        },
        'gold': {
          max_giveaways_per_month: 10,
          max_giveaway_value: 2000,
          requires_approval: false,
          can_create_paid_giveaways: true,
          featured_placement: 3,
          priority_support: true,
          custom_branding: true,
          analytics_access: true
        },
        'platinum': {
          max_giveaways_per_month: 25,
          max_giveaway_value: 5000,
          requires_approval: false,
          can_create_paid_giveaways: true,
          featured_placement: 5,
          priority_support: true,
          custom_branding: true,
          analytics_access: true
        },
        'diamond': {
          max_giveaways_per_month: -1,
          max_giveaway_value: -1,
          requires_approval: false,
          can_create_paid_giveaways: true,
          featured_placement: 10,
          priority_support: true,
          custom_branding: true,
          analytics_access: true
        }
      };
      
      return { data: mockPrivileges[tier] || mockPrivileges['bronze'], error: null };
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_tier_privileges', { user_trust_tier: tier });

      if (error) throw error;

      return { data: data[0] || null, error: null };
    } catch (error) {
      console.error('Error fetching tier privileges:', error);
      return { data: null, error: error.message };
    }
  },

  // Check if user can create a giveaway
  async canUserCreateGiveaway(userId, giveawayValue = 0) {
    if (!isRealSupabase) {
      // Mock validation
      return {
        data: {
          can_create: true,
          reason: 'Giveaway creation allowed',
          monthly_remaining: 1,
          value_allowed: true
        },
        error: null
      };
    }

    try {
      const { data, error } = await supabase
        .rpc('can_user_create_giveaway', {
          user_id_param: userId,
          giveaway_value: giveawayValue
        });

      if (error) throw error;

      return { data: data[0] || null, error: null };
    } catch (error) {
      console.error('Error checking giveaway creation permission:', error);
      return { data: null, error: error.message };
    }
  },

  // Upgrade user tier
  async upgradeUserTier(userId, newTier, reason = '', promotedBy = null) {
    if (!isRealSupabase) {
      return { data: { success: true }, error: null };
    }

    try {
      // Update user tier
      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .update({ trust_tier: newTier })
        .eq('id', userId)
        .select()
        .single();

      if (userError) throw userError;

      return { data: { success: true, user: userData }, error: null };
    } catch (error) {
      console.error('Error upgrading user tier:', error);
      return { data: null, error: error.message };
    }
  },

  // Get user tier history
  async getUserTierHistory(userId) {
    if (!isRealSupabase) {
      return { data: [], error: null };
    }

    try {
      const { data, error } = await supabase
        .from('trust_tier_history')
        .select(`
          *,
          promoted_by_user:users!promoted_by(name, username)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching tier history:', error);
      return { data: [], error: error.message };
    }
  },

  // Get user tier summary
  async getUserTierSummary(userId) {
    if (!isRealSupabase) {
      return {
        data: {
          trust_tier: 'bronze',
          giveaways_this_month: 0,
          remaining_giveaways_this_month: 1,
          max_giveaway_value: 100,
          requires_approval: true
        },
        error: null
      };
    }

    try {
      const { data, error } = await supabase
        .from('user_tier_summary')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user tier summary:', error);
      return { data: null, error: error.message };
    }
  }
};

// Log current mode
console.log(isRealSupabase ? '�🔥 API services using real Supabase' : '🛠️ API services in mock mode');

export default {
  auth: authService,
  users: userService,
  giveaways: giveawayService,
  entries: entryService,
  files: fileService,
  realtime: realtimeService,
  analytics: analyticsService,
  comments: commentService,
  socialMedia: socialMediaService,
  trustTier: trustTierService
};
