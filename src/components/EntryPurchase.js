import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { paymentService } from '../services/paymentService';
import { revenueCatService } from '../services/revenueCatService';

/**
 * Entry Purchase Component
 * Handles purchasing giveaway entries through RevenueCat (StoreKit/Play Billing)
 */
const EntryPurchase = ({ giveawayId, userId, onPurchaseComplete }) => {
  const [entryPackages, setEntryPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    initializePayments();
  }, []);

  const initializePayments = async () => {
    try {
      // Initialize payment services
      const initResult = await paymentService.initialize(userId);
      
      if (initResult.success) {
        // Load available entry packages
        await loadEntryPackages();
      } else {
        Alert.alert('Error', 'Failed to initialize payment system');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      Alert.alert('Error', 'Failed to initialize payments');
    } finally {
      setLoading(false);
    }
  };

  const loadEntryPackages = async () => {
    try {
      const result = await paymentService.getEntryPackages();
      
      if (result.success) {
        setEntryPackages(result.packages);
      } else {
        Alert.alert('Error', 'Failed to load entry packages');
      }
    } catch (error) {
      console.error('Load packages error:', error);
      Alert.alert('Error', 'Failed to load packages');
    }
  };

  const handlePurchase = async (packageData) => {
    setPurchasing(true);
    setSelectedPackage(packageData.id);

    try {
      const result = await paymentService.purchaseEntryPackage(
        packageData.id,
        giveawayId,
        userId
      );

      if (result.success) {
        Alert.alert(
          'Purchase Successful!',
          `You've successfully purchased ${result.data.entryCount} entries!`,
          [
            {
              text: 'OK',
              onPress: () => {
                if (onPurchaseComplete) {
                  onPurchaseComplete(result.data);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Purchase Failed', 'An unexpected error occurred');
    } finally {
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const renderPackage = (packageData) => {
    const isSelected = selectedPackage === packageData.id;
    const isPurchasing = purchasing && isSelected;

    return (
      <TouchableOpacity
        key={packageData.id}
        style={[
          styles.packageCard,
          isSelected && styles.selectedPackage,
        ]}
        onPress={() => !purchasing && handlePurchase(packageData)}
        disabled={purchasing}
      >
        <View style={styles.packageHeader}>
          <Text style={styles.packageTitle}>{packageData.title}</Text>
          {packageData.savings > 0 && (
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Save {packageData.savings}%</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.packageDescription}>{packageData.description}</Text>
        
        <View style={styles.packageDetails}>
          <Text style={styles.entryCount}>
            {packageData.entryCount} {packageData.entryCount === 1 ? 'Entry' : 'Entries'}
          </Text>
          <Text style={styles.packagePrice}>{packageData.priceString}</Text>
        </View>

        {isPurchasing && (
          <View style={styles.purchasingOverlay}>
            <ActivityIndicator color="#ffffff" />
            <Text style={styles.purchasingText}>Processing...</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading entry packages...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Purchase Entries</Text>
        <Text style={styles.subtitle}>Choose how many entries you'd like to purchase</Text>
      </View>

      <View style={styles.packagesContainer}>
        {entryPackages.map(renderPackage)}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All purchases are processed securely through {'\n'}
          Apple App Store or Google Play Store
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  packagesContainer: {
    padding: 16,
    gap: 12,
  },
  packageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
    overflow: 'hidden',
  },
  selectedPackage: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  savingsBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  packageDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
  },
  packageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  purchasingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  purchasingText: {
    color: '#ffffff',
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default EntryPurchase;
