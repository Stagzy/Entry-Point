-- Activities Table Schema for Live Activity Feed
-- Tracks all platform activities for the live feed and social features

-- Create activity type enum
DO $$ BEGIN
    CREATE TYPE activity_type_enum AS ENUM (
        'giveaway_created',     -- New giveaway launched
        'entry_purchased',      -- User bought tickets/entries
        'winner_selected',      -- Winner announced
        'milestone_reached',    -- Entry milestones (25%, 50%, 75%, 100% filled)
        'user_achievement',     -- User badges, milestones
        'giveaway_comment',     -- Comments on giveaways
        'giveaway_liked',       -- Likes on giveaways
        'user_followed',        -- User follows another user
        'giveaway_shared',      -- Giveaway shared on social media
        'creator_verified'      -- Creator gets verified status
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Core activity data
    type activity_type_enum NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- For follow actions
    
    -- Activity metadata (flexible JSON for different activity types)
    metadata JSONB DEFAULT '{}',
    
    -- Visibility and moderation
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false, -- For highlighting special activities
    is_archived BOOLEAN DEFAULT false, -- For hiding old activities
    
    -- Engagement tracking
    views_count INTEGER DEFAULT 0,
    interactions_count INTEGER DEFAULT 0, -- Clicks, shares, etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_giveaway_id ON public.activities(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_public ON public.activities(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_featured ON public.activities(is_featured, created_at DESC) WHERE is_featured = true;

-- Composite index for live feed queries
CREATE INDEX IF NOT EXISTS idx_activities_live_feed ON public.activities(is_public, is_archived, created_at DESC) 
WHERE is_public = true AND is_archived = false;

-- Enable Row Level Security
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public read access to public activities
CREATE POLICY "Public activities are viewable by everyone" ON public.activities
    FOR SELECT USING (is_public = true AND is_archived = false);

-- Users can create activities for themselves
CREATE POLICY "Users can create their own activities" ON public.activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own activities
CREATE POLICY "Users can update their own activities" ON public.activities
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage all activities
CREATE POLICY "Admins can manage all activities" ON public.activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activities_updated_at
    BEFORE UPDATE ON public.activities
    FOR EACH ROW
    EXECUTE FUNCTION update_activities_updated_at();

-- Create function to get recent activities for live feed
CREATE OR REPLACE FUNCTION get_recent_activities(
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    type activity_type_enum,
    user_id UUID,
    giveaway_id UUID,
    target_user_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    user_display_name TEXT,
    user_username TEXT,
    user_avatar_url TEXT,
    giveaway_title TEXT,
    giveaway_prize TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.type,
        a.user_id,
        a.giveaway_id,
        a.target_user_id,
        a.metadata,
        a.created_at,
        u.name as user_display_name,
        u.username as user_username,
        u.avatar_url as user_avatar_url,
        g.title as giveaway_title,
        COALESCE(g.prize_value::TEXT, 'Prize') as giveaway_prize
    FROM public.activities a
    LEFT JOIN public.users u ON a.user_id = u.id
    LEFT JOIN public.giveaways g ON a.giveaway_id = g.id
    WHERE a.is_public = true 
      AND a.is_archived = false
    ORDER BY a.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON public.activities TO anon, authenticated;
GRANT INSERT ON public.activities TO authenticated;
GRANT UPDATE ON public.activities TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activities TO anon, authenticated;

-- Example activity records for testing
INSERT INTO public.activities (type, user_id, giveaway_id, metadata) VALUES
(
    'giveaway_created',
    (SELECT id FROM public.users LIMIT 1),
    (SELECT id FROM public.giveaways LIMIT 1),
    jsonb_build_object(
        'giveaway_title', 'iPhone 15 Pro Giveaway',
        'creator_name', 'TechReviewer',
        'prize', 'iPhone 15 Pro 256GB',
        'entry_price', 5.00
    )
),
(
    'entry_purchased',
    (SELECT id FROM public.users LIMIT 1),
    (SELECT id FROM public.giveaways LIMIT 1),
    jsonb_build_object(
        'entries_purchased', 3,
        'giveaway_title', 'iPhone 15 Pro Giveaway',
        'user_name', 'Alex Gamer',
        'total_cost', 15.00
    )
)
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE public.activities IS 'Tracks all platform activities for live feed, notifications, and social features';
COMMENT ON COLUMN public.activities.type IS 'Type of activity (giveaway_created, entry_purchased, etc.)';
COMMENT ON COLUMN public.activities.metadata IS 'Flexible JSON storage for activity-specific data';
COMMENT ON COLUMN public.activities.is_featured IS 'Whether this activity should be highlighted in feeds';
COMMENT ON FUNCTION get_recent_activities IS 'Optimized function to fetch recent activities with joined user/giveaway data';
