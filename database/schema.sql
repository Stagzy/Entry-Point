-- Entry Point Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE trust_tier_enum AS ENUM ('bronze', 'silver', 'gold', 'platinum');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE giveaway_status_enum AS ENUM ('draft', 'active', 'paused', 'ended', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE entry_status_enum AS ENUM ('entered', 'winner', 'disqualified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  name text not null,
  email text unique not null,
  avatar_url text,
  bio text,
  website_url text,
  instagram_handle text,
  twitter_handle text,
  youtube_handle text,
  tiktok_handle text,
  
  -- Verification and trust
  is_verified boolean default false,
  is_creator boolean default false,
  is_admin boolean default false,
  trust_tier trust_tier_enum default 'bronze',
  verification_documents jsonb,
  
  -- Social counts
  followers_count integer default 0,
  following_count integer default 0,
  total_giveaways_created integer default 0,
  total_entries integer default 0,
  total_wins integer default 0,
  
  -- Privacy settings
  privacy_settings jsonb default '{
    "allowSearchDiscovery": true,
    "shareWinPublicly": true,
    "showFollowersList": true,
    "showFollowingList": true,
    "allowProfileViewing": true
  }'::jsonb,
  
  -- Analytics
  last_active_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 30),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]+$')
);

-- Create giveaways table
CREATE TABLE IF NOT EXISTS public.giveaways (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.users(id) on delete cascade not null,
  
  -- Basic info
  title text not null,
  description text not null,
  image_url text,
  prize_value numeric(10,2),
  
  -- Entry requirements
  entry_methods jsonb not null default '[]'::jsonb,
  max_entries integer,
  entry_cost numeric(10,2) default 0,
  
  -- Timing
  starts_at timestamp with time zone not null,
  ends_at timestamp with time zone not null,
  winner_selected_at timestamp with time zone,
  
  -- Status and visibility
  status giveaway_status_enum default 'draft',
  is_featured boolean default false,
  is_external boolean default false,
  external_platform text,
  external_url text,
  
  -- Restrictions
  age_restriction integer default 18,
  location_restrictions text[],
  platform_restrictions text[],
  
  -- Analytics
  total_entries integer default 0,
  total_revenue numeric(10,2) default 0,
  view_count integer default 0,
  
  -- Metadata
  tags text[],
  category text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  constraint valid_dates check (ends_at > starts_at),
  constraint positive_prize check (prize_value >= 0),
  constraint positive_cost check (entry_cost >= 0)
);

-- Create entries table
CREATE TABLE IF NOT EXISTS public.entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  giveaway_id uuid references public.giveaways(id) on delete cascade not null,
  
  -- Entry details
  entry_count integer default 1,
  total_cost numeric(10,2) default 0,
  status entry_status_enum default 'entered',
  
  -- Payment info
  payment_id uuid,
  payment_status payment_status_enum default 'completed',
  
  -- Metadata
  entry_data jsonb, -- Store proof of entry requirements completion
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  constraint positive_entries check (entry_count > 0),
  constraint positive_cost check (total_cost >= 0),
  unique(user_id, giveaway_id) -- One entry per user per giveaway
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  entry_id uuid references public.entries(id) on delete cascade,
  
  -- Payment details
  amount numeric(10,2) not null,
  currency text default 'USD',
  status payment_status_enum default 'pending',
  
  -- External payment data
  stripe_payment_intent_id text,
  stripe_payment_method_id text,
  payment_metadata jsonb,
  
  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  constraint positive_amount check (amount > 0)
);

-- Create followers table
CREATE TABLE IF NOT EXISTS public.followers (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.users(id) on delete cascade not null,
  following_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  
  unique(follower_id, following_id),
  constraint no_self_follow check (follower_id != following_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.users(id) on delete cascade not null,
  recipient_id uuid references public.users(id) on delete cascade not null,
  
  -- Message content
  content text not null,
  message_type text default 'text',
  
  -- Status
  is_read boolean default false,
  is_deleted_by_sender boolean default false,
  is_deleted_by_recipient boolean default false,
  
  -- Timestamps
  created_at timestamp with time zone default now(),
  read_at timestamp with time zone,
  
  constraint no_self_message check (sender_id != recipient_id)
);

-- Create winners table
CREATE TABLE IF NOT EXISTS public.winners (
  id uuid default uuid_generate_v4() primary key,
  giveaway_id uuid references public.giveaways(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  entry_id uuid references public.entries(id) on delete cascade not null,
  
  -- Winner details
  position integer default 1, -- For multiple winners
  prize_description text,
  is_claimed boolean default false,
  claimed_at timestamp with time zone,
  
  -- Timestamps
  selected_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  
  unique(giveaway_id, position)
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade unique not null,
  
  -- Email notifications
  email_new_giveaways boolean default true,
  email_giveaway_updates boolean default true,
  email_entry_confirmations boolean default true,
  email_winner_announcements boolean default true,
  email_messages boolean default true,
  email_followers boolean default true,
  
  -- Push notifications
  push_new_giveaways boolean default true,
  push_giveaway_updates boolean default true,
  push_entry_confirmations boolean default true,
  push_winner_announcements boolean default true,
  push_messages boolean default true,
  push_followers boolean default true,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_trust_tier ON public.users(trust_tier);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON public.users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_is_creator ON public.users(is_creator);

CREATE INDEX IF NOT EXISTS idx_giveaways_creator ON public.giveaways(creator_id);
CREATE INDEX IF NOT EXISTS idx_giveaways_status ON public.giveaways(status);
CREATE INDEX IF NOT EXISTS idx_giveaways_featured ON public.giveaways(is_featured);
CREATE INDEX IF NOT EXISTS idx_giveaways_starts_at ON public.giveaways(starts_at);
CREATE INDEX IF NOT EXISTS idx_giveaways_ends_at ON public.giveaways(ends_at);
CREATE INDEX IF NOT EXISTS idx_giveaways_category ON public.giveaways(category);

CREATE INDEX IF NOT EXISTS idx_entries_user ON public.entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_giveaway ON public.entries(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_entries_status ON public.entries(status);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_followers_follower ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON public.followers(following_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(recipient_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_winners_giveaway ON public.winners(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_winners_user ON public.winners(user_id);

-- Create text search indexes
CREATE INDEX IF NOT EXISTS idx_users_search ON public.users USING gin (
  (setweight(to_tsvector('english', coalesce(username, '')), 'A') ||
   setweight(to_tsvector('english', coalesce(name, '')), 'B'))
);

CREATE INDEX IF NOT EXISTS idx_giveaways_search ON public.giveaways USING gin (
  (setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
   setweight(to_tsvector('english', coalesce(description, '')), 'B'))
);

-- Create functions for updating counts
create or replace function update_user_followers_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    -- Increase following count for follower
    update public.users 
    set following_count = following_count + 1 
    where id = new.follower_id;
    
    -- Increase followers count for followed user
    update public.users 
    set followers_count = followers_count + 1 
    where id = new.following_id;
    
    return new;
  elsif tg_op = 'DELETE' then
    -- Decrease following count for follower
    update public.users 
    set following_count = greatest(0, following_count - 1) 
    where id = old.follower_id;
    
    -- Decrease followers count for followed user
    update public.users 
    set followers_count = greatest(0, followers_count - 1) 
    where id = old.following_id;
    
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

create or replace function update_giveaway_entries_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.giveaways 
    set total_entries = total_entries + new.entry_count 
    where id = new.giveaway_id;
    
    update public.users 
    set total_entries = total_entries + new.entry_count 
    where id = new.user_id;
    
    return new;
  elsif tg_op = 'UPDATE' then
    update public.giveaways 
    set total_entries = total_entries + (new.entry_count - old.entry_count) 
    where id = new.giveaway_id;
    
    update public.users 
    set total_entries = total_entries + (new.entry_count - old.entry_count) 
    where id = new.user_id;
    
    return new;
  elsif tg_op = 'DELETE' then
    update public.giveaways 
    set total_entries = greatest(0, total_entries - old.entry_count) 
    where id = old.giveaway_id;
    
    update public.users 
    set total_entries = greatest(0, total_entries - old.entry_count) 
    where id = old.user_id;
    
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_followers_count ON public.followers;
CREATE TRIGGER trigger_update_followers_count
  AFTER INSERT OR DELETE ON public.followers
  FOR EACH ROW EXECUTE FUNCTION update_user_followers_count();

DROP TRIGGER IF EXISTS trigger_update_entries_count ON public.entries;
CREATE TRIGGER trigger_update_entries_count
  AFTER INSERT OR UPDATE OR DELETE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION update_giveaway_entries_count();

-- Create updated_at triggers
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_giveaways_updated_at ON public.giveaways;
CREATE TRIGGER update_giveaways_updated_at BEFORE UPDATE ON public.giveaways
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entries_updated_at ON public.entries;
CREATE TRIGGER update_entries_updated_at BEFORE UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view public profiles" ON public.users;
CREATE POLICY "Users can view public profiles" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for giveaways table
DROP POLICY IF EXISTS "Anyone can view active giveaways" ON public.giveaways;
CREATE POLICY "Anyone can view active giveaways" ON public.giveaways
  FOR SELECT USING (status = 'active' OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can manage own giveaways" ON public.giveaways;
CREATE POLICY "Creators can manage own giveaways" ON public.giveaways
  FOR ALL USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Anyone can insert giveaways" ON public.giveaways;
CREATE POLICY "Anyone can insert giveaways" ON public.giveaways
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- RLS Policies for entries table
DROP POLICY IF EXISTS "Users can view own entries" ON public.entries;
CREATE POLICY "Users can view own entries" ON public.entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Giveaway creators can view entries" ON public.entries;
CREATE POLICY "Giveaway creators can view entries" ON public.entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.giveaways 
      WHERE id = giveaway_id AND creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own entries" ON public.entries;
CREATE POLICY "Users can insert own entries" ON public.entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own entries" ON public.entries;
CREATE POLICY "Users can update own entries" ON public.entries
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for payments table
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for followers table
DROP POLICY IF EXISTS "Users can view all follows" ON public.followers;
CREATE POLICY "Users can view all follows" ON public.followers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own follows" ON public.followers;
CREATE POLICY "Users can manage own follows" ON public.followers
  FOR ALL USING (auth.uid() = follower_id);

-- RLS Policies for messages table
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- RLS Policies for winners table
DROP POLICY IF EXISTS "Anyone can view winners" ON public.winners;
CREATE POLICY "Anyone can view winners" ON public.winners
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Giveaway creators can manage winners" ON public.winners;
CREATE POLICY "Giveaway creators can manage winners" ON public.winners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.giveaways 
      WHERE id = giveaway_id AND creator_id = auth.uid()
    )
  );

-- RLS Policies for notification preferences
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create storage buckets (run these in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('giveaway-images', 'giveaway-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false);

-- Storage policies for avatars bucket
-- create policy "Avatar images are publicly accessible" on storage.objects
--   for select using (bucket_id = 'avatars');

-- create policy "Users can upload own avatar" on storage.objects
--   for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- create policy "Users can update own avatar" on storage.objects
--   for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- create policy "Users can delete own avatar" on storage.objects
--   for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
