import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if we're using real Supabase credentials
const isUsingRealSupabase = true; // Enable real Supabase connection

const createMockClient = () => ({
  auth: {
    signUp: async () => ({ data: null, error: { message: 'Mock mode - Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables' } }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Mock mode - Set up your Supabase project first' } }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ 
      data: { 
        user: {
          id: 'demo-user-123',
          email: 'demo@example.com',
          user_metadata: {
            display_name: 'Demo User'
          }
        } 
      }, 
      error: null 
    }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
  }),
  storage: {
    from: () => ({
      upload: () => ({ data: null, error: null }),
      download: () => ({ data: null, error: null }),
      remove: () => ({ data: null, error: null }),
    }),
  },
  // Add missing realtime functionality
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
});

// Create the Supabase client
export const supabase = isUsingRealSupabase 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : createMockClient();

// Log the current mode
console.log(isUsingRealSupabase ? '🚀 Using real Supabase backend' : '🛠️ Using mock backend - Set up Supabase credentials');

// Database table names for easy reference
export const TABLES = {
  USERS: 'users', // Using users table as defined in schema
  PROFILES: 'users', // Alias for clarity
  GIVEAWAYS: 'giveaways',
  ENTRIES: 'entries', 
  PAYMENTS: 'payments',
  FOLLOWERS: 'followers',
  WINNERS: 'winners',
  ACTIVITIES: 'activities',
  COMMENTS: 'comments',
  LIKES: 'likes',
};

// Storage bucket names
export const BUCKETS = {
  AVATARS: 'avatars',
  GIVEAWAY_IMAGES: 'giveaway-images',
  VERIFICATION_DOCS: 'verification-docs',
};
