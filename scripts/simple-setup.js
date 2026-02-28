import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up Entry Point database...');
  
  try {
    // Test connection
    const { data, error } = await supabase.from('').select('*').limit(1);
    console.log('✅ Connected to Supabase');

    // Create the profiles table that the app expects
    console.log('📊 Creating profiles table...');
    
    const { error: profilesError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          username TEXT UNIQUE,
          name TEXT,
          email TEXT,
          avatar_url TEXT,
          bio TEXT,
          is_verified BOOLEAN DEFAULT false,
          is_creator BOOLEAN DEFAULT false,
          is_admin BOOLEAN DEFAULT false,
          trust_tier TEXT DEFAULT 'Bronze' CHECK (trust_tier IN ('Bronze', 'Silver', 'Gold', 'Diamond')),
          followers_count INTEGER DEFAULT 0,
          following_count INTEGER DEFAULT 0,
          stats JSONB DEFAULT '{}',
          privacy_settings JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for profiles
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
          FOR SELECT USING (true);
          
        CREATE POLICY "Users can update own profile" ON public.profiles
          FOR UPDATE USING (auth.uid() = id);
      `
    });

    if (profilesError) {
      console.log('⚠️  Note: profiles table may already exist or need manual setup');
    } else {
      console.log('✅ Profiles table created');
    }

    // Create giveaways table
    console.log('📊 Creating giveaways table...');
    
    const { error: giveawaysError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.giveaways (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          image_url TEXT,
          prize_value DECIMAL,
          entry_cost DECIMAL DEFAULT 0,
          starts_at TIMESTAMPTZ NOT NULL,
          ends_at TIMESTAMPTZ NOT NULL,
          status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended', 'cancelled')),
          total_entries INTEGER DEFAULT 0,
          max_entries INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can view active giveaways" ON public.giveaways
          FOR SELECT USING (status = 'active');
      `
    });

    console.log('✅ Database setup completed');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Manual setup required:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Run the contents of database/schema.sql');
  }
}

setupDatabase();
