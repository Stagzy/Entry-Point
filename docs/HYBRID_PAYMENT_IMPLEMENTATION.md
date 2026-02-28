# Hybrid Payment Architecture Implementation Guide

This guide explains how to implement and deploy the hybrid payment system that uses RevenueCat for entry purchases and Stripe Connect for creator payouts.

## Architecture Overview

```
User Entry Purchase Flow:
User → RevenueCat → App Store/Play Store → Your Backend → Database

Creator Payout Flow:
Giveaway Completion → Revenue Calculation → Stripe Connect → Creator Bank Account
```

## Implementation Steps

### 1. Environment Configuration

Add these environment variables to your `.env` file:

```env
# RevenueCat Configuration
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your_ios_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_your_android_key_here

# Stripe Configuration (existing)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
```

### 2. Database Migration

Run the new schema to add creator payout tables:

```bash
# Apply the new schema
psql -h your-db-host -U your-db-user -d your-db-name -f database/revenuecat_stripe_schema.sql
```

### 3. App Store Connect Setup

1. **Login to App Store Connect**
2. **Navigate to your app → Features → In-App Purchases**
3. **Create these consumable products:**

   - `single_entry_ios` - $0.99 - "Single Entry"
   - `three_entries_ios` - $2.49 - "Three Entries" 
   - `five_entries_ios` - $3.99 - "Five Entries"
   - `ten_entries_ios` - $6.99 - "Ten Entries"

4. **Submit products for review**

### 4. Google Play Console Setup

1. **Login to Google Play Console**
2. **Navigate to your app → Monetize → Products → In-app products**
3. **Create these managed products (consumable):**

   - `single_entry_android` - $0.99 - "Single Entry"
   - `three_entries_android` - $2.49 - "Three Entries"
   - `five_entries_android` - $3.99 - "Five Entries" 
   - `ten_entries_android` - $6.99 - "Ten Entries"

4. **Activate all products**

### 5. RevenueCat Configuration

1. **Create RevenueCat account at revenuecat.com**
2. **Create new project**
3. **Add your iOS app** (Bundle ID from App Store Connect)
4. **Add your Android app** (Package name from Play Console)
5. **Configure products** in RevenueCat dashboard to match your app store products
6. **Get your API keys** from Project Settings
7. **Add API keys to your environment**

### 6. Supabase Edge Function Deployment

Deploy the creator payout function:

```bash
# Deploy the function
supabase functions deploy process-creator-payout

# Set environment variables for the function
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
```

### 7. App Integration

Update your app to use the new payment flow:

```javascript
// In your component
import { paymentService } from '../services/paymentService';
import EntryPurchase from '../components/EntryPurchase';

// Initialize payments when app starts
useEffect(() => {
  paymentService.initialize(userId);
}, [userId]);

// Use the EntryPurchase component
<EntryPurchase 
  giveawayId={giveawayId}
  userId={userId}
  onPurchaseComplete={(result) => {
    // Handle successful purchase
    console.log('Purchase completed:', result);
  }}
/>
```

## Revenue Flow Explanation

### Entry Purchase Flow

1. **User selects entry package** → RevenueCat handles purchase
2. **Apple/Google processes payment** → Takes 30% commission  
3. **RevenueCat receives 70%** → Sends webhook to your backend
4. **Your backend records order** → Adds entries to giveaway
5. **User gets entries** → Can participate in giveaway

### Creator Payout Flow

1. **Giveaway completes** → Winner is selected
2. **Revenue calculation** → Sum all RevenueCat orders for giveaway
3. **Platform fee deduction** → Take 15% platform fee from 70% received
4. **Creator gets 55%** → Of original purchase price
5. **Stripe Connect transfer** → Direct to creator's bank account

## Fee Structure Breakdown

For a $1.00 entry purchase:

- **Apple/Google**: $0.30 (30%)
- **You receive**: $0.70 (70%)
- **Platform fee**: $0.15 (15% of original, ~21% of received)
- **Creator gets**: $0.55 (55% of original, ~79% of received)

## Testing

### Development Testing

The services include mock modes for development:

```javascript
// Mock purchases will work without real app store setup
const result = await paymentService.purchaseEntryPackage('mock_package', giveawayId, userId);
```

### Production Testing

1. **iOS**: Use TestFlight with sandbox Apple ID
2. **Android**: Use internal testing track
3. **Stripe**: Use test mode initially

## Monitoring & Analytics

### Revenue Tracking

Query the `revenue_analytics` view for platform insights:

```sql
SELECT * FROM revenue_analytics 
WHERE date >= NOW() - INTERVAL '30 days'
ORDER BY date DESC;
```

### Creator Earnings

Query the `creator_earnings` view:

```sql
SELECT * FROM creator_earnings 
ORDER BY total_earnings DESC 
LIMIT 10;
```

### Payout Management

Process creator payouts after giveaway completion:

```javascript
import { revenueReconciliationService } from '../services/revenueReconciliationService';

// Process payout when giveaway completes
const result = await revenueReconciliationService.processCreatorPayout(giveawayId);
```

## Security Considerations

1. **App Store Guidelines**: Using platform payment systems ensures compliance
2. **PCI Compliance**: RevenueCat and Stripe handle sensitive payment data
3. **Webhook Security**: Verify RevenueCat webhooks with shared secret
4. **User Privacy**: Minimal payment data stored in your database

## Troubleshooting

### Common Issues

1. **Products not loading**: Ensure product IDs match exactly across platforms
2. **Purchase failures**: Check RevenueCat dashboard for error details  
3. **Payout failures**: Verify Stripe Connect account is fully onboarded
4. **Revenue mismatches**: Check for refunds or cancelled transactions

### Support Contacts

- **RevenueCat**: support@revenuecat.com
- **Apple**: App Store Connect support
- **Google**: Play Console support  
- **Stripe**: Dashboard → Help & Support

## Next Steps

1. **Implement webhook handlers** for RevenueCat events
2. **Add refund handling** for cancelled giveaways
3. **Create admin dashboard** for revenue monitoring
4. **Set up automated payout schedules**
5. **Add tax reporting** for creators (1099s, etc.)

## Cost Analysis

### Monthly Platform Costs

For 1000 transactions at $2.00 average:

- **RevenueCat**: $0 (free tier covers most apps)
- **Stripe Connect**: $2000 × 2.9% = $58
- **App Store/Play Store**: $2000 × 30% = $600 (paid by users)
- **Your platform fee**: $2000 × 15% = $300

**Total platform revenue**: $300/month
**Net after Stripe fees**: $242/month

This hybrid approach maximizes compliance while providing competitive creator payouts and sustainable platform economics.
