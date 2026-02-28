# Entry Point Database

## 🚀 Database Files Overview

### Core Schema Files
- **`schema.sql`** - Main database schema with all tables, indexes, and basic RLS policies
- **`SETUP.md`** - Detailed setup instructions for database initialization

### Enhancement Schema Files  
- **`admin_console_schema.sql`** - Admin dashboard tables and functions
- **`captcha_schema.sql`** - Bot protection and captcha verification
- **`enhanced_giveaway_schema.sql`** - Extended giveaway features and analytics
- **`fairness_verification_schema.sql`** - Cryptographic fairness proofs
- **`observability_schema.sql`** - Monitoring, logging, and performance tracking
- **`security_audit.sql`** - Security monitoring and audit trails
- **`stripe_connect_schema.sql`** - Payment processing and Stripe Connect integration

### Optimization & Security Files
- **`complete_database_cleanup.sql`** - Comprehensive RLS optimization and duplicate removal
- **`final_cleanup.sql`** - Final policy consolidation and performance fixes
- **`fix_function_security.sql`** - Function search path security improvements
- **`fix_view_security.sql`** - View security definer fixes

## 🚀 Quick Start

### 1. Create Supabase Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: "Entry Point"
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users

### 2. Get Your Credentials
Once your project is created:
1. Go to **Settings** → **API**
2. Copy your **Project URL**
3. Copy your **anon/public key**
4. Copy your **service_role key** (for setup only)

### 3. Configure Environment Variables
Edit your `.env` file:
```bash
# Replace with your actual values
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Initialize Database
**Step 1: Core Setup**
```sql
-- Run schema.sql in Supabase SQL Editor first
```

**Step 2: Apply Optimizations (IMPORTANT!)**
```sql
-- Run complete_database_cleanup.sql 
-- Run final_cleanup.sql
-- Run fix_function_security.sql  
-- Run fix_view_security.sql
```

**Step 3: Add Enhanced Features (Optional)**
```sql
-- Run any enhancement schema files you need:
-- admin_console_schema.sql
-- captcha_schema.sql
-- enhanced_giveaway_schema.sql
-- etc.
```

This will:
- ✅ Create all database tables
- ✅ Set up optimized security policies  
- ✅ Eliminate Performance Advisor warnings
- ✅ Create storage buckets for images
- ✅ Add monitoring and security features

## 📊 Database Schema

### Core Tables
- **users**: User profiles, settings, verification status
- **giveaways**: Giveaway listings with all details
- **entries**: User entries into giveaways
- **payments**: Payment processing records
- **winners**: Selected winners for each giveaway
- **followers**: User following relationships
- **messages**: Direct messaging between users

### Storage Buckets
- **avatars**: User profile pictures
- **giveaway-images**: Giveaway preview images

## 🔧 Development Commands

```bash
# Set up database (first time)
npm run setup-db

# Reset database (clears all data)
npm run reset-db

# Start development server
npm start
```

## 🔐 Security Features

- **Row Level Security (RLS)**: Enabled on all tables
- **Authentication**: Supabase Auth with email/password and OAuth
- **File Upload**: Secure image upload with type validation
- **API Security**: Anon key for client, service key for admin operations

## 📱 Features Ready

Once your backend is set up, these features work immediately:

### ✅ User Authentication
- Email/password registration
- Social login (Apple, Google)
- Profile management
- Trust tier system

### ✅ Giveaway System
- Create/edit giveaways
- Image upload
- Entry tracking
- Winner selection

### ✅ Social Features
- User profiles
- Following system
- Direct messaging
- Activity feeds

### ✅ Payment System
- Entry fee processing
- Creator payouts
- Transaction history
- Dispute handling

## 🚀 Production Checklist

Before launching:
- [ ] Set up custom domain
- [ ] Configure email templates
- [ ] Set up monitoring/alerts
- [ ] Test payment processing
- [ ] Configure backups
- [ ] Set up analytics
- [ ] Test all user flows

## 🆘 Troubleshooting

**"Cannot connect to Supabase"**
- Check your `.env` file has correct credentials
- Verify service role key has admin permissions
- Make sure Supabase project is running

**"RLS policy error"**
- Policies are automatically set up by the setup script
- If issues persist, check Supabase dashboard → Authentication → Policies

**"Storage bucket not found"**
- Run `npm run setup-db` again
- Check Supabase dashboard → Storage

Need help? Check the [Supabase docs](https://supabase.com/docs) or create an issue!
