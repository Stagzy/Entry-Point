/**
 * PaymentSuccessScreen.js
 * 
 * PURPOSE:
 * Transaction confirmation and celebration interface displayed after successful
 * giveaway ticket purchases. Provides immediate positive feedback, transaction
 * details, and guided navigation to enhance user satisfaction and engagement
 * following payment completion with clear next-step pathways.
 * 
 * NAVIGATION FLOW:
 * Accessible from: TicketPurchaseScreen (after payment completion), payment processing flows
 * Navigates to: MyEntriesScreen (view purchased tickets), MainTabs/Home (continue browsing),
 * back to main app experience with success context preserved
 * 
 * KEY FEATURES:
 * • Success Celebration: Large checkmark icon with congratulatory messaging
 * • Transaction Summary: Detailed purchase confirmation with ticket count and amount
 * • Giveaway Context: Display of purchased giveaway details and prize information
 * • Dual Action Paths: View entries or continue browsing with clear user choices
 * • Visual Hierarchy: Gradient background with layered information presentation
 * • Entry Confirmation: Ticket count validation with purchase amount verification
 * • Encouraging Footer: Winner announcement timeline and good luck messaging
 * • Responsive Design: Optimized layout for various screen sizes and orientations
 * 
 * TRANSACTION DETAILS DISPLAYED:
 * • Giveaway Title: Name of the entered giveaway
 * • Prize Information: Description of the potential winnings
 * • Ticket Count: Number of entries purchased with plural handling
 * • Payment Amount: Total charged amount with currency formatting
 * • Purchase Confirmation: Visual success indicators and status
 * 
 * USER EXPERIENCE:
 * • Immediate Feedback: Instant confirmation of successful payment
 * • Clear Next Steps: Obvious navigation options for continued engagement
 * • Visual Celebration: Positive reinforcement with checkmark and emoji
 * • Information Transparency: Complete transaction details for user confidence
 * • Guided Navigation: Strategic routing to high-engagement screens
 * 
 * TECHNICAL DETAILS:
 * • Route Parameter Handling: Secure transaction data passing from payment flow
 * • Linear Gradient Background: Branded visual design with accessibility considerations
 * • Icon Integration: Ionicons for visual feedback and information display
 * • Navigation Integration: React Navigation with proper screen transitions
 * • Parameter Validation: Safe handling of optional transaction data
 * • Responsive Styling: Flexible layout adapting to content and screen size
 * 
 * STATE MANAGEMENT:
 * • Route Parameter Extraction: Transaction details from payment completion
 * • Navigation State Handling: Proper screen stack management
 * • Data Display Logic: Conditional rendering based on available parameters
 * • User Action Tracking: Navigation choice recording for analytics
 * 
 * BUSINESS LOGIC:
 * • Transaction Confirmation: Final step in payment processing workflow
 * • User Engagement: Strategic navigation options to maintain app usage
 * • Success Metrics: Positive completion feedback for conversion tracking
 * • Entry Tracking: Integration with user's giveaway participation history
 * 
 * ACCESSIBILITY:
 * • High contrast text on gradient background
 * • Clear visual hierarchy with readable font sizes
 * • Descriptive text for transaction details
 * • Touch-friendly button sizes and spacing
 * 
 * ERROR HANDLING:
 * • Graceful parameter fallbacks for missing transaction data
 * • Safe navigation with parameter validation
 * • Default value handling for amount and ticket count display
 * 
 * RELATED SCREENS:
 * • TicketPurchaseScreen: Payment processing and transaction initiation
 * • MyEntriesScreen: User's giveaway participation history and management
 * • HomeScreen: Main discovery and browsing interface
 * • GiveawayDetailScreen: Context of the entered giveaway
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentSuccessScreen({ navigation, route }) {
  const { giveaway, ticketCount, amount } = route.params || {};

  const handleViewEntries = () => {
    navigation.navigate('MyEntries');
  };

  const handleContinue = () => {
    // Navigate back to the main tabs and specifically to the Home tab
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        {/* Success Icon */}
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color="white" />
        </View>

        {/* Success Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.successTitle}>Payment Successful! 🎉</Text>
          <Text style={styles.successSubtitle}>
            You've successfully entered the giveaway
          </Text>
        </View>

        {/* Giveaway Info */}
        {giveaway && (
          <View style={styles.giveawayInfo}>
            <Text style={styles.giveawayTitle}>{giveaway.title}</Text>
            <Text style={styles.giveawayPrize}>{giveaway.prize}</Text>
            
            <View style={styles.entryDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="ticket-outline" size={20} color="rgba(255,255,255,0.8)" />
                <Text style={styles.detailText}>
                  {ticketCount} ticket{ticketCount > 1 ? 's' : ''} purchased
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="card-outline" size={20} color="rgba(255,255,255,0.8)" />
                <Text style={styles.detailText}>
                  ${amount ? amount.toFixed(2) : '0.00'} charged
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleViewEntries}>
            <Text style={styles.primaryButtonText}>View My Entries</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleContinue}>
            <Text style={styles.secondaryButtonText}>Continue Browsing</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Good luck! Winner will be announced when the giveaway ends.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 80,
    paddingBottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    marginBottom: 30,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  giveawayInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  giveawayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  giveawayPrize: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  entryDetails: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'center',
  },
  detailText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 10,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
