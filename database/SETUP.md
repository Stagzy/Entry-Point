# Entry Point - Supabase Setup Guide

This guide will help you set up the Supabase backend for your Entry Point app.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in your Supabase dashboard

## Setup Steps

### 1. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy your `Project URL` and `anon public` key
4. Update the `src/config/supabase.js` file with your credentials:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

### 2. Set up Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `database/schema.sql`
3. Run the SQL script to create all tables, indexes, and policies

### 3. Add Sample Data (Optional)

1. In the SQL Editor, copy and paste the contents of `database/sample_data.sql`
2. Run the script to populate your database with sample giveaways and users

### 4. Set up Storage Buckets

1. Go to Storage in your Supabase dashboard
2. Create the following buckets:
   - `avatars` (public) - for user profile pictures
   - `giveaway-images` (public) - for giveaway images
   - `verification-docs` (private) - for user verification documents

### 5. Configure Storage Policies

Run these commands in the SQL Editor to set up storage policies:

```sql
-- Storage policies for avatars bucket
create policy "Avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Users can upload own avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own avatar" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for giveaway-images bucket
create policy "Giveaway images are publicly accessible" on storage.objects
  for select using (bucket_id = 'giveaway-images');

create policy "Users can upload giveaway images" on storage.objects
  for insert with check (bucket_id = 'giveaway-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own giveaway images" on storage.objects
  for update using (bucket_id = 'giveaway-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own giveaway images" on storage.objects
  for delete using (bucket_id = 'giveaway-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for verification-docs bucket (private)
create policy "Users can access own verification docs" on storage.objects
  for select using (bucket_id = 'verification-docs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload own verification docs" on storage.objects
  for insert with check (bucket_id = 'verification-docs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own verification docs" on storage.objects
  for update using (bucket_id = 'verification-docs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own verification docs" on storage.objects
  for delete using (bucket_id = 'verification-docs' and auth.uid()::text = (storage.foldername(name))[1]);
```

### 6. Configure Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Enable the authentication providers you want to use (Email, Google, etc.)
3. Set up your app's redirect URLs for social authentication

### 7. Environment Variables

Create a `.env` file in your project root (don't commit this to git):

```env
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Testing the Setup

1. Start your React Native app
2. Set up Supabase with your own credentials:
   - Configure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in your environment
   - Create your own test user account
3. Test creating a new user account
4. Verify that giveaways are loading properly

## Features Enabled

✅ User Authentication & Profiles  
✅ Giveaway Management  
✅ Entry System  
✅ Social Features (Following/Followers)  
✅ Messaging System  
✅ File Upload (Avatars, Images)  
✅ Real-time Updates  
✅ Admin Panel Support  
✅ Privacy Controls  
✅ Search Functionality  

## Next Steps

1. **Payment Integration**: Set up Stripe for paid entries
2. **Push Notifications**: Configure Firebase for mobile notifications
3. **Email Service**: Set up SendGrid or similar for email notifications
4. **Analytics**: Add analytics tracking for user behavior
5. **Content Moderation**: Implement content review system

## Support

If you encounter any issues during setup, check:
1. Supabase project status and quotas
2. RLS policies are correctly configured
3. Storage buckets have proper permissions
4. Your API keys are correctly copied

## Security Notes

- Never commit your Supabase keys to version control
- Use environment variables for all sensitive data
- Regularly rotate your API keys
- Monitor your Supabase usage and set up alerts
- Review RLS policies before going to production
