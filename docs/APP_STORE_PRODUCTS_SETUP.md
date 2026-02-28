# App Store Connect Products Configuration

This document outlines the in-app purchase products that need to be configured in App Store Connect for iOS and Google Play Console for Android.

## Product Configuration

### iOS Products (App Store Connect)
Configure these consumable products in App Store Connect:

1. **Single Entry**
   - Product ID: `single_entry_ios`
   - Type: Consumable
   - Price Tier: $0.99 USD
   - Display Name: "Single Entry"
   - Description: "Purchase 1 giveaway entry"

2. **Three Entries Bundle**
   - Product ID: `three_entries_ios`
   - Type: Consumable
   - Price Tier: $2.49 USD
   - Display Name: "Three Entries"
   - Description: "Purchase 3 giveaway entries (Save 17%)"

3. **Five Entries Bundle**
   - Product ID: `five_entries_ios`
   - Type: Consumable
   - Price Tier: $3.99 USD
   - Display Name: "Five Entries"
   - Description: "Purchase 5 giveaway entries (Save 19%)"

4. **Ten Entries Bundle**
   - Product ID: `ten_entries_ios`
   - Type: Consumable
   - Price Tier: $6.99 USD
   - Display Name: "Ten Entries"
   - Description: "Purchase 10 giveaway entries (Save 29%)"

### Android Products (Google Play Console)
Configure these consumable products in Google Play Console:

1. **Single Entry**
   - Product ID: `single_entry_android`
   - Type: Managed product (consumable)
   - Price: $0.99 USD
   - Title: "Single Entry"
   - Description: "Purchase 1 giveaway entry"

2. **Three Entries Bundle**
   - Product ID: `three_entries_android`
   - Type: Managed product (consumable)
   - Price: $2.49 USD
   - Title: "Three Entries"
   - Description: "Purchase 3 giveaway entries (Save 17%)"

3. **Five Entries Bundle**
   - Product ID: `five_entries_android`
   - Type: Managed product (consumable)
   - Price: $3.99 USD
   - Title: "Five Entries"
   - Description: "Purchase 5 giveaway entries (Save 19%)"

4. **Ten Entries Bundle**
   - Product ID: `ten_entries_android`
   - Type: Managed product (consumable)
   - Price: $6.99 USD
   - Title: "Ten Entries"
   - Description: "Purchase 10 giveaway entries (Save 29%)"

## Setup Instructions

### iOS Setup (App Store Connect)
1. Login to App Store Connect
2. Navigate to your app
3. Go to "Features" > "In-App Purchases"
4. Click "+" to add new products
5. Select "Consumable" for each product
6. Configure each product with the details above
7. Submit for review (required before they can be purchased)

### Android Setup (Google Play Console)
1. Login to Google Play Console
2. Navigate to your app
3. Go to "Monetize" > "Products" > "In-app products"
4. Click "Create product" for each item
5. Set up each product with the details above
6. Activate each product

### RevenueCat Setup
1. Create a RevenueCat account
2. Create a new project
3. Add your iOS app (Bundle ID from App Store Connect)
4. Add your Android app (Package name from Play Console)
5. Configure the products in RevenueCat dashboard
6. Get your API keys:
   - iOS: `appl_xxxxxxxxxx`
   - Android: `goog_xxxxxxxxxx`
7. Add these to your environment variables:
   - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
   - `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`

## Testing

### iOS Testing
- Use sandbox Apple ID for testing
- Products must be approved in App Store Connect
- Test on actual device (not simulator for StoreKit)

### Android Testing
- Use test account in Google Play Console
- Test with internal testing track
- Can test on emulator or device

## Important Notes

1. **Product IDs must match exactly** between:
   - App Store Connect / Play Console
   - RevenueCat dashboard
   - Your app code (`ENTRY_PRODUCTS` in `revenueCatService.js`)

2. **Consumable vs Subscription**:
   - We're using consumable products since entries are "consumed" when used
   - Users can purchase multiple times

3. **Price Localization**:
   - Set equivalent prices in all regions you plan to launch
   - RevenueCat will handle currency conversion

4. **Tax Compliance**:
   - Apple/Google handle tax collection for in-app purchases
   - You're responsible for reporting RevenueCat revenue to your tax authority

## Environment Configuration

Add these to your `.env` file:

```env
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your_ios_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_your_android_key_here
```
