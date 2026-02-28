import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys (you'll need to add these to your environment)
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'appl_your_ios_key_here';
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || 'goog_your_android_key_here';

// Product IDs for giveaway entries (these need to match your App Store Connect / Play Console setup)
export const ENTRY_PRODUCTS = {
  SINGLE_ENTRY: Platform.OS === 'ios' ? 'single_entry_ios' : 'single_entry_android',
  THREE_ENTRIES: Platform.OS === 'ios' ? 'three_entries_ios' : 'three_entries_android',
  FIVE_ENTRIES: Platform.OS === 'ios' ? 'five_entries_ios' : 'five_entries_android',
  TEN_ENTRIES: Platform.OS === 'ios' ? 'ten_entries_ios' : 'ten_entries_android',
};

// Check if we're using real RevenueCat (both keys configured)
const isRealRevenueCat = (Platform.OS === 'ios' && REVENUECAT_IOS_API_KEY !== 'appl_your_ios_key_here') ||
                        (Platform.OS === 'android' && REVENUECAT_ANDROID_API_KEY !== 'goog_your_android_key_here');

/**
 * RevenueCat Service for handling in-app purchases
 * Manages StoreKit (iOS) and Play Billing (Android) through RevenueCat
 */
export const revenueCatService = {

  /**
   * Initialize RevenueCat with the appropriate API key
   */
  async initialize(userId) {
    if (!isRealRevenueCat) {
      console.log('RevenueCat: Using mock mode');
      return { success: true, mock: true };
    }

    try {
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
      
      await Purchases.configure({
        apiKey,
        appUserID: userId,
      });

      console.log('RevenueCat initialized successfully');
      return { success: true, mock: false };
    } catch (error) {
      console.error('RevenueCat initialization error:', error);
      return { success: false, error };
    }
  },

  /**
   * Get available products for purchase
   */
  async getAvailableProducts() {
    if (!isRealRevenueCat) {
      // Mock products for development
      return {
        success: true,
        products: [
          {
            identifier: ENTRY_PRODUCTS.SINGLE_ENTRY,
            description: '1 Giveaway Entry',
            title: 'Single Entry',
            price: 0.99,
            priceString: '$0.99',
            currencyCode: 'USD',
          },
          {
            identifier: ENTRY_PRODUCTS.THREE_ENTRIES,
            description: '3 Giveaway Entries',
            title: 'Three Entries',
            price: 2.49,
            priceString: '$2.49',
            currencyCode: 'USD',
          },
          {
            identifier: ENTRY_PRODUCTS.FIVE_ENTRIES,
            description: '5 Giveaway Entries',
            title: 'Five Entries',
            price: 3.99,
            priceString: '$3.99',
            currencyCode: 'USD',
          },
          {
            identifier: ENTRY_PRODUCTS.TEN_ENTRIES,
            description: '10 Giveaway Entries',
            title: 'Ten Entries',
            price: 6.99,
            priceString: '$6.99',
            currencyCode: 'USD',
          },
        ],
      };
    }

    try {
      const products = await Purchases.getProducts(Object.values(ENTRY_PRODUCTS));
      
      return {
        success: true,
        products: products.map(product => ({
          identifier: product.identifier,
          description: product.description,
          title: product.title,
          price: product.price,
          priceString: product.priceString,
          currencyCode: product.currencyCode,
        })),
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { success: false, error };
    }
  },

  /**
   * Purchase a product
   */
  async purchaseProduct(productId, giveawayId = null) {
    if (!isRealRevenueCat) {
      // Mock purchase for development
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const entryCount = this.getEntryCountForProduct(productId);
      return {
        success: true,
        mock: true,
        purchaseInfo: {
          transactionId: 'mock_txn_' + Date.now(),
          productId,
          entryCount,
          price: this.getMockPriceForProduct(productId),
          currencyCode: 'USD',
          purchaseDate: new Date().toISOString(),
        },
      };
    }

    try {
      const purchaserInfo = await Purchases.purchaseProduct(productId);
      
      if (purchaserInfo.latestTransaction) {
        const transaction = purchaserInfo.latestTransaction;
        const entryCount = this.getEntryCountForProduct(productId);
        
        return {
          success: true,
          mock: false,
          purchaseInfo: {
            transactionId: transaction.transactionIdentifier,
            productId,
            entryCount,
            price: transaction.price || 0,
            currencyCode: transaction.currencyCode || 'USD',
            purchaseDate: transaction.purchaseDate,
            revenueCatUserId: purchaserInfo.originalAppUserId,
          },
        };
      } else {
        return { success: false, error: 'No transaction found' };
      }
    } catch (error) {
      console.error('Purchase error:', error);
      return { success: false, error };
    }
  },

  /**
   * Restore purchases (for users who need to restore their account)
   */
  async restorePurchases() {
    if (!isRealRevenueCat) {
      return { success: true, mock: true, activeEntitlements: [] };
    }

    try {
      const purchaserInfo = await Purchases.restoreTransactions();
      
      return {
        success: true,
        mock: false,
        activeEntitlements: Object.keys(purchaserInfo.entitlements.active),
      };
    } catch (error) {
      console.error('Restore purchases error:', error);
      return { success: false, error };
    }
  },

  /**
   * Get customer info (current entitlements, etc.)
   */
  async getCustomerInfo() {
    if (!isRealRevenueCat) {
      return { 
        success: true, 
        mock: true, 
        customerInfo: { activeEntitlements: [], originalAppUserId: 'mock_user' } 
      };
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      return {
        success: true,
        mock: false,
        customerInfo: {
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          originalAppUserId: customerInfo.originalAppUserId,
          firstSeen: customerInfo.firstSeen,
          latestExpirationDate: customerInfo.latestExpirationDate,
        },
      };
    } catch (error) {
      console.error('Get customer info error:', error);
      return { success: false, error };
    }
  },

  /**
   * Set user attributes for analytics and targeting
   */
  async setUserAttributes(attributes) {
    if (!isRealRevenueCat) {
      console.log('RevenueCat mock: Setting user attributes', attributes);
      return { success: true, mock: true };
    }

    try {
      await Purchases.setAttributes(attributes);
      return { success: true, mock: false };
    } catch (error) {
      console.error('Set attributes error:', error);
      return { success: false, error };
    }
  },

  /**
   * Helper: Get entry count for a product ID
   */
  getEntryCountForProduct(productId) {
    const entryMap = {
      [ENTRY_PRODUCTS.SINGLE_ENTRY]: 1,
      [ENTRY_PRODUCTS.THREE_ENTRIES]: 3,
      [ENTRY_PRODUCTS.FIVE_ENTRIES]: 5,
      [ENTRY_PRODUCTS.TEN_ENTRIES]: 10,
    };
    return entryMap[productId] || 1;
  },

  /**
   * Helper: Get mock price for product (for development)
   */
  getMockPriceForProduct(productId) {
    const priceMap = {
      [ENTRY_PRODUCTS.SINGLE_ENTRY]: 0.99,
      [ENTRY_PRODUCTS.THREE_ENTRIES]: 2.49,
      [ENTRY_PRODUCTS.FIVE_ENTRIES]: 3.99,
      [ENTRY_PRODUCTS.TEN_ENTRIES]: 6.99,
    };
    return priceMap[productId] || 0.99;
  },

  /**
   * Set up webhook listener for purchase events
   */
  setupPurchaseListener(callback) {
    if (!isRealRevenueCat) {
      console.log('RevenueCat mock: Purchase listener setup');
      return { success: true, mock: true };
    }

    try {
      Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        callback({
          success: true,
          customerInfo: {
            activeEntitlements: Object.keys(customerInfo.entitlements.active),
            originalAppUserId: customerInfo.originalAppUserId,
          },
        });
      });
      
      return { success: true, mock: false };
    } catch (error) {
      console.error('Setup purchase listener error:', error);
      return { success: false, error };
    }
  },

  /**
   * Clean up resources
   */
  cleanup() {
    if (!isRealRevenueCat) {
      return;
    }
    
    try {
      // RevenueCat handles cleanup automatically, but we can remove listeners if needed
      console.log('RevenueCat cleanup completed');
    } catch (error) {
      console.error('RevenueCat cleanup error:', error);
    }
  }
};
