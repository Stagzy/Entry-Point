# Environment Setup Guide

This guide explains how to configure all necessary environment variables to run Entry Point locally or deploy it.

## Prerequisites

Before you begin, ensure you have:
- A [Supabase](https://supabase.com) project created
- A [Google Cloud Console](https://console.cloud.google.com) project with OAuth configured (for Android/web Google Sign-In)
- An [Apple Developer Account](https://developer.apple.com) (for iOS Apple Sign-In)
- A [Stripe](https://stripe.com) account for payment processing
- An [Expo](https://expo.dev) account for EAS builds

---

## Environment Variables

### Root Directory (`.env` or `.env.local`)

Create a `.env.local` file in the project root with these variables:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google OAuth (iOS)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### Supabase Directory (`supabase/.env`)

Create a `supabase/.env` file for backend functions:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

---

## Configuration Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project dashboard:
   - **Get URL**: Project Settings → API → Project URL
   - **Get ANON_KEY**: Project Settings → API → Project anon key
   - **Get SERVICE_ROLE_KEY**: Project Settings → API → Service role key

3. Set up your database:
   ```bash
   # This will apply all schema files to your Supabase database
   psql -h your-project-id.supabase.co -U postgres -d postgres -f database/schema.sql
   ```

### 2. Google OAuth Setup (iOS)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the "Google+ API"
4. Create OAuth 2.0 credentials:
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Choose "iOS" as the application type
   - Note your **Client ID**
5. For the `app.json`, find this line and replace with your actual URL scheme:
   ```json
   "iosUrlScheme": "YOUR_GOOGLE_OAUTH_URL_SCHEME_HERE"
   ```
   Get this from your OAuth consent screen configuration

### 3. Apple Sign-In Setup (iOS)

1. Go to [Apple Developer Account](https://developer.apple.com)
2. Create an App ID with "Sign In with Apple" capability enabled
3. Configure in App Store Connect:
   - Create app record with Bundle ID: `com.giveaways.app`
   - Enable "Sign In with Apple" under Capabilities
4. No additional environment variables needed - handled by native iOS framework

### 4. Stripe Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your keys:
   - **Publishable Key**: Found in Developers → API Keys (starts with `pk_`)
   - **Secret Key**: Found in Developers → API Keys (starts with `sk_`) - **NEVER expose this publicly**
   - **Webhook Secret**: Create a webhook endpoint and get the signing secret (starts with `whsec_`)

3. Configure webhook endpoint:
   - Endpoint URL: `https://your-supabase-project.supabase.co/functions/v1/stripe-webhook`
   - Events to monitor:
     - `charge.refunded`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

---

## Development vs Production

### Development Setup

```bash
# Use test/development keys from all services
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Test mode
STRIPE_SECRET_KEY=sk_test_...                    # Test mode
```

### Production Setup

Before deploying:
1. Switch to **Live** keys in Stripe (remove "test" from key names)
2. Use production Supabase project (not development)
3. Update OAuth credentials to production URLs
4. Ensure all error handling is in place

---

## Gitignore Configuration

The `.gitignore` already includes:
```
.env
.env.local
.env.production
.env.staging
```

**NEVER commit `.env` files or any files containing secret keys.**

---

## Verifying Your Setup

Run the system check script:

```bash
node scripts/system-check.js
```

This will verify:
- ✅ Supabase connection
- ✅ Google OAuth configuration
- ✅ Stripe configuration
- ✅ Environment variables

---

## Troubleshooting

### "Cannot find credentials" error
- Ensure `.env.local` is in the root directory (not in `src/`)
- Verify environment variables are prefixed with `EXPO_PUBLIC_` for frontend code
- Restart the development server after adding variables

### Google Sign-In fails
- Verify `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set correctly
- Check that OAuth consent screen is configured in Google Cloud Console
- Ensure iOS app is registered in Google Cloud Console

### Stripe integration fails
- Verify `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` exists and starts with `pk_`
- Check that Stripe webhook secret is correctly configured in `supabase/.env`
- Ensure webhook endpoint is accessible from Stripe servers

### Supabase connection fails
- Verify URL format: `https://[PROJECT-ID].supabase.co`
- Check that ANON_KEY is not the SERVICE_ROLE_KEY
- Ensure Supabase project is in "Active" status

---

## Security Best Practices

1. **NEVER** commit `.env` files
2. **NEVER** share secret keys (STRIPE_SECRET_KEY, SERVICE_ROLE_KEY)
3. **NEVER** expose keys in client-side code (except ANON keys and publishable keys)
4. Use GitHub Actions secrets for CI/CD deployments
5. Rotate keys regularly in production
6. Monitor access logs for suspicious activity

---

## Next Steps

1. Configure all environment variables as described above
2. Run `npm install` to install dependencies
3. Start development: `npm start`
4. Test authentication flows with your configured OAuth providers
5. Test payment flows in Stripe test mode

For additional help:
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Expo Documentation](https://docs.expo.dev)
