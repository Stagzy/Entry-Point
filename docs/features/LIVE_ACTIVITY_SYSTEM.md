# Live Activity System - Implementation Guide

## Overview
The Entry Point app features a comprehensive live activity system that provides real-time updates of platform activities to create social engagement and community building.

## System Components

### 1. Database Schema
**File**: `database/activities_schema.sql`

#### Activities Table Structure:
```sql
CREATE TABLE public.activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type activity_type_enum NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    giveaway_id UUID REFERENCES public.giveaways(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    interactions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Activity Types:
- `giveaway_created` - New giveaway launched
- `entry_purchased` - User bought tickets/entries  
- `winner_selected` - Winner announced
- `milestone_reached` - Entry milestones (25%, 50%, 75%, 100% filled)
- `user_achievement` - User badges, milestones
- `giveaway_comment` - Comments on giveaways
- `giveaway_liked` - Likes on giveaways
- `user_followed` - User follows another user
- `giveaway_shared` - Giveaway shared on social media
- `creator_verified` - Creator gets verified status

#### Optimized Function:
```sql
CREATE OR REPLACE FUNCTION get_recent_activities(
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
```
Returns activities with joined user and giveaway data for optimal performance.

### 2. Service Layer

#### ActivityService (`src/services/activityService.js`)
**Status**: ✅ Real database enabled (`isRealSupabase = true`)

**Key Methods**:
- `createActivity(activityData)` - Create new activity records
- `getRecentActivities(limit, offset)` - Fetch activities for feed
- `subscribeToActivities(callback)` - Real-time activity subscription
- `logEntryPurchase()` - Log when users purchase entries
- `logGiveawayCreated()` - Log when giveaways are created
- `logWinnerSelected()` - Log when winners are announced
- `logMilestone()` - Log milestone achievements

#### RealtimeService (`src/services/realtimeService.js`)
**Status**: ✅ Real database enabled (`isRealBackend = true`)

**Key Methods**:
- `subscribeToGiveawayEntries(giveawayId, callback)` - Subscribe to entry updates
- `getLiveEntryCount(giveawayId)` - Get current entry count
- `getRecentEntries(giveawayId, limit)` - Get recent entries for live feed
- `subscribeToWinners(callback)` - Subscribe to winner announcements

### 3. UI Components

#### LiveActivityFeed (`src/components/LiveActivityFeed.js`)
**Features**:
- Real-time activity stream with smooth animations
- Activity type icons and color coding
- Time formatting (just now, 2m ago, 1h ago, etc.)
- User avatars and profile links
- Entry count indicators
- Empty state handling

#### LiveStatsBar (also in `LiveActivityFeed.js`)
**Features**:
- Live entry count with progress bar
- Animated updates when new entries arrive
- Change indicators (+5 entries)
- Progress percentage display

#### LiveActivityFeedScreen (`src/screens/activity/LiveActivityFeedScreen.js`)
**Features**:
- Comprehensive activity feed screen
- Pull-to-refresh functionality
- Real-time subscription management
- Activity type filtering and icons
- Navigation to source content (giveaways, profiles)

### 4. Integration Points

#### GiveawayDetailScreen
- Displays LiveActivityFeed component
- Shows recent entries with real-time updates
- Uses useRealtimeGiveaway hook for live data

#### API Service Integration
**Automatic Activity Logging**:
- `createGiveaway()` → logs `giveaway_created` activity
- `createEntry()` → logs `entry_purchased` activity
- Winner selection → logs `winner_selected` activity

#### Navigation Integration
- Bottom tab "Activity" leads to LiveActivityFeedScreen
- Deep linking support for activity notifications
- Profile and giveaway navigation from activity items

### 5. Real-time Features

#### Subscription Management
- Automatic subscription setup on component mount
- Proper cleanup on component unmount
- Error handling for connection issues
- Throttled updates for performance

#### Live Updates
- New activities appear instantly in feed
- Entry counts update in real-time
- Winner announcements with special styling
- Milestone notifications

### 6. Performance Optimizations

#### Database
- Optimized indexes for activity queries
- Composite index for live feed performance
- RLS policies for security
- Efficient join queries with get_recent_activities function

#### Frontend
- Virtual scrolling for large activity feeds
- Efficient FlatList rendering
- Memory management with proper cleanup
- Optimized real-time subscription frequency

### 7. Setup Instructions

#### Database Setup
1. Run `database/activities_schema.sql` in Supabase SQL editor
2. Verify indexes and RLS policies are created
3. Test with sample activity records

#### Service Configuration
1. Ensure `isRealSupabase = true` in activityService.js
2. Ensure `isRealBackend = true` in realtimeService.js  
3. Verify TABLES.ACTIVITIES is defined in supabase config

#### Testing
1. Create a giveaway → should log `giveaway_created` activity
2. Purchase entries → should log `entry_purchased` activity
3. Check LiveActivityFeedScreen for real-time updates
4. Verify activities appear in GiveawayDetailScreen live feed

### 8. Monitoring & Analytics

#### Activity Tracking
- View counts for each activity
- Interaction tracking (clicks, shares)
- User engagement metrics
- Popular activity types

#### Performance Metrics
- Real-time subscription health
- Activity feed load times
- Database query performance
- Memory usage monitoring

### 9. Future Enhancements

#### Planned Features
- Push notifications for activities
- Activity filtering by type/user
- Social features (like/comment on activities)
- Activity search functionality
- Trending activities algorithm

#### Technical Improvements
- Activity caching for performance
- Offline activity queue
- Activity compression for storage
- Advanced real-time throttling

## Current Status: ✅ FULLY FUNCTIONAL

The live activity system is now completely integrated with the real Supabase database and ready for production use. All components are connected and working together to provide a rich, real-time social experience for users.
