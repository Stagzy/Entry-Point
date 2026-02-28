# Authentication Fixes Guide

This guide addresses the authentication issues you're experiencing:

1. **Supabase RLS Performance Issues**
2. **Google Sign-In not working (hardcoded demo mode)**  
3. **Apple Sign-In failing on user creation**

## 🚀 Quick Fix Steps

### 1. Apply Database Performance Fixes

Run these SQL scripts in your Supabase dashboard:

```bash
# Apply RLS performance optimizations
psql -h your-db-host -U postgres -d your-db-name -f database/fix_rls_performance.sql

# Apply authentication schema fixes
psql -h your-db-host -U postgres -d your-db-name -f database/fix_auth_schema.sql
```

Or in Supabase dashboard SQL editor:
1. Copy contents of `database/fix_rls_performance.sql`
2. Run in SQL editor
3. Copy contents of `database/fix_auth_schema.sql` 
4. Run in SQL editor

### 2. Fix Google Authentication

**Add your real Google Web Client ID:**

1. **Get Google Client ID:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Select your project (or create one)
   - Navigate to "APIs & Services" > "Credentials"
   - Create OAuth 2.0 Client ID for "Web application"
   - Copy the Client ID

2. **Update your `.env` file:**
   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_actual_google_client_id_here.apps.googleusercontent.com
   ```

3. **Configure Supabase:**
   - In Supabase dashboard, go to Authentication > Providers
   - Enable Google provider
   - Add your Google Client ID and Client Secret

### 3. Fix Apple Authentication

**Configure Apple Sign-In:**

1. **Apple Developer Setup:**
   - Go to [Apple Developer Portal](https://developer.apple.com)
   - Navigate to Certificates, IDs & Profiles
   - Create App ID with Sign In with Apple capability
   - Create Service ID for web authentication

2. **Update Supabase:**
   - In Supabase dashboard, go to Authentication > Providers  
   - Enable Apple provider
   - Add your Apple Service ID and Private Key

3. **Update app.json/app.config.js:**
   ```json
   {
     "expo": {
       "ios": {
         "usesAppleSignIn": true
       }
     }
   }
   ```

## 🔧 What the Fixes Do

### RLS Performance Fixes
- **Optimized auth policies** - Reduces `current_setting()` calls
- **Better indexes** - Improves query performance
- **Simplified policy logic** - Removes complex nested queries
- **Efficient user ID function** - Caches auth checks

### Google Authentication Fixes
- **Removed hardcoded demo mode** - No more fake Google users
- **Proper token handling** - Uses `signInWithIdToken()` for Supabase
- **Real authentication flow** - Connects Google SDK to Supabase
- **Error handling** - Clear error messages when not configured

### Apple Authentication Fixes  
- **Unified user tables** - Resolves conflicts between `users` and `profiles`
- **Automatic profile creation** - Triggers create profiles on auth
- **Proper token handling** - Uses Apple identity tokens
- **Database sync** - Keeps both tables in sync

### Database Schema Fixes
- **Unified user management** - `profiles` is source of truth
- **Automatic triggers** - Sync data between tables
- **Foreign key fixes** - Points to correct tables
- **Migration function** - Moves existing data safely

## 🧪 Testing the Fixes

### Test RLS Performance
```sql
-- Check for performance improvements
EXPLAIN ANALYZE SELECT * FROM profiles WHERE id = auth.current_user_id();
```

### Test Google Authentication
1. Add real Google Client ID to `.env`
2. Restart your development server
3. Try Google Sign-In - should work with real Google accounts
4. Check Supabase dashboard for new users

### Test Apple Authentication  
1. Configure Apple Sign-In in developer portal
2. Add credentials to Supabase
3. Test on iOS device (not simulator)
4. Verify user profile creation

## 🚨 Important Notes

### Environment Variables Required
```env
# Required for Google
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_client_id.apps.googleusercontent.com

# Required for RevenueCat (from previous setup)
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your_ios_key
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_your_android_key

# Supabase (existing)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### After Applying Fixes

1. **Restart your app** - Environment variables need to reload
2. **Clear app data** - Remove any cached demo users
3. **Test with real accounts** - Use actual Google/Apple accounts
4. **Monitor Supabase logs** - Check for any remaining errors

### Database Migration Safety

The schema fixes include:
- ✅ **Non-destructive changes** - Won't delete existing data
- ✅ **Backwards compatibility** - Old code will still work
- ✅ **Error handling** - Won't break if migration fails
- ✅ **Rollback friendly** - Can be reversed if needed

### Performance Monitoring

After applying RLS fixes, monitor:
- **Query response times** in Supabase dashboard
- **Auth policy execution** in performance advisor
- **Database connection usage**
- **Error rates** in authentication flows

## 🔄 Rollback Plan

If something breaks:

1. **Revert environment variables** to demo values temporarily
2. **Check Supabase logs** for specific errors  
3. **Run migration rollback** if needed:
   ```sql
   -- Remove triggers if needed
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   DROP TRIGGER IF EXISTS sync_profile_to_users_trigger ON profiles;
   ```

## ✅ Success Indicators

You'll know the fixes worked when:

- ✅ **Performance Advisor** shows fewer/no RLS warnings
- ✅ **Google Sign-In** prompts for real Google account selection
- ✅ **Apple Sign-In** completes without "failed to create user" errors
- ✅ **New users** appear in both Supabase auth and your profiles table
- ✅ **Database queries** run faster (check response times)

## 🆘 Troubleshooting

### Still seeing Google demo mode?
- Check if `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is actually set
- Restart development server after changing `.env`
- Clear Metro cache: `npx expo start --clear`

### Apple Sign-In still failing?
- Ensure you're testing on a real iOS device, not simulator
- Check Apple Developer portal for proper configuration
- Verify Supabase Apple provider is enabled

### RLS performance still slow?
- Check if the SQL scripts ran without errors
- Look for foreign key constraint conflicts
- Consider running `ANALYZE` on your tables

Need help with any of these steps? The fixes are designed to be safe and non-destructive, so you can apply them incrementally.
