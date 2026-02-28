/**
 * WinnerSelectionScreen.js
 * 
 * PURPOSE:
 * Comprehensive winner selection interface for creators to randomly select winners from eligible giveaways.
 * This screen represents the final step in the giveaway lifecycle, allowing creators to fairly and randomly
 * choose winners from all valid paid entries once their giveaways have ended.
 * 
 * NAVIGATION:
 * - Accessed from: CreatorDashboardScreen, MyGiveawaysScreen (winner selection action)
 * - Navigation Target: Standalone modal/screen for winner selection process
 * - Exit Routes: Returns to previous screen after winner selection completion
 * - Deep Linking: Not typically deep linked (creator-specific functionality)
 * 
 * KEY FEATURES:
 * • Eligible Giveaway Management:
 *   - Automatic filtering of ended giveaways with entries
 *   - Real-time giveaway status validation
 *   - Entry count and revenue display
 *   - End date confirmation and formatting
 * 
 * • Random Winner Selection:
 *   - Cryptographically secure random selection
 *   - Fair selection from all valid paid entries
 *   - Confirmation dialogs with irreversible warnings
 *   - Automatic winner notification system
 * 
 * • Selection Interface:
 *   - Visual giveaway cards with key statistics
 *   - One-click winner selection with confirmation
 *   - Loading states during selection process
 *   - Success feedback with winner information
 * 
 * • Creator Analytics:
 *   - Entry count display per giveaway
 *   - Revenue calculation and display
 *   - Giveaway performance metrics
 *   - End date tracking and validation
 * 
 * USER REQUIREMENTS:
 * - Must be authenticated creator with active account
 * - Must have ended giveaways with at least one entry
 * - Giveaways must be in 'active' status (not already completed)
 * - Selection process requires explicit confirmation
 * 
 * STATE MANAGEMENT:
 * • Local State:
 *   - giveaways: Array of eligible giveaways for winner selection
 *   - loading: Boolean for initial data loading state
 *   - selecting: String/null for tracking current selection process
 *   - fadeAnim: Animated value for smooth screen transitions
 * 
 * • External State Dependencies:
 *   - AuthContext: User authentication and creator verification
 *   - GiveawayService: Fetching creator's eligible giveaways
 *   - EntryService: Random winner selection and notification
 * 
 * TECHNICAL DETAILS:
 * • Winner Selection Algorithm:
 *   - Random selection from all valid paid entries
 *   - Cryptographically secure randomization
 *   - Immediate database update and user notification
 *   - Irreversible selection process with audit trail
 * 
 * • Giveaway Eligibility Criteria:
 *   - Status must be 'active' (not completed or cancelled)
 *   - Must have at least one entry (current_entries > 0)
 *   - End date must be in the past (automatic filtering)
 *   - Creator must own the giveaway
 * 
 * • Revenue Calculations:
 *   - Real-time calculation: entry_cost × current_entries
 *   - Formatted currency display with proper rounding
 *   - Creator earnings before platform fees
 *   - Revenue tracking for analytics purposes
 * 
 * • Notification System:
 *   - Automatic winner notification via push/email
 *   - Creator confirmation of selection
 *   - Database status updates for tracking
 *   - Audit log creation for compliance
 * 
 * RELATED SCREENS:
 * - CreatorDashboardScreen: Primary navigation source
 * - MyGiveawaysScreen: Giveaway management and selection access
 * - CreateGiveawayWizardScreen: Fallback for empty state
 * - GiveawayDetailScreen: Individual giveaway management
 * 
 * INTEGRATION POINTS:
 * - Supabase: Giveaway and entry data management
 * - Real-time Updates: Live entry count updates
 * - Notification Service: Winner notification delivery
 * - Analytics Service: Selection event tracking
 * - Audit Service: Selection history and compliance
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { giveawayService, entryService } from '../../services/api';

export default function WinnerSelectionScreen({ navigation }) {
  const { user } = useAuth();
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadEligibleGiveaways();
    
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadEligibleGiveaways = async () => {
    try {
      setLoading(true);
      
      // Get creator's active giveaways that are eligible for winner selection
      const { data: allGiveaways, error } = await giveawayService.getCreatorGiveaways();
      
      if (error) {
        Alert.alert('Error', 'Failed to load giveaways');
        return;
      }

      // Filter for giveaways that can have winners selected
      const eligibleGiveaways = allGiveaways.filter(giveaway => 
        giveaway.status === 'active' && 
        giveaway.current_entries > 0 &&
        new Date(giveaway.end_date) <= new Date()
      );

      setGiveaways(eligibleGiveaways);
      
    } catch (error) {
      console.error('Error loading eligible giveaways:', error);
      Alert.alert('Error', 'Failed to load giveaways');
    } finally {
      setLoading(false);
    }
  };

  const selectWinner = async (giveaway) => {
    try {
      setSelecting(giveaway.id);
      
      Alert.alert(
        'Select Winner',
        `Are you sure you want to randomly select a winner for "${giveaway.title}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Select Winner',
            style: 'default',
            onPress: async () => {
              const { data: winner, error } = await entryService.selectRandomWinner(giveaway.id);
              
              if (error) {
                Alert.alert('Error', error.message || 'Failed to select winner');
                return;
              }
              
              Alert.alert(
                '🎉 Winner Selected!',
                `Congratulations to ${winner.user?.username || 'the winner'}! They have been notified of their win.`,
                [
                  { text: 'OK', onPress: () => loadEligibleGiveaways() }
                ]
              );
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error selecting winner:', error);
      Alert.alert('Error', 'Failed to select winner');
    } finally {
      setSelecting(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const GiveawayCard = ({ giveaway }) => (
    <View style={styles.giveawayCard}>
      <View style={styles.giveawayHeader}>
        <View style={styles.giveawayInfo}>
          <Text style={styles.giveawayTitle} numberOfLines={2}>
            {giveaway.title}
          </Text>
          <Text style={styles.giveawayPrize} numberOfLines={1}>
            {giveaway.prize_description}
          </Text>
          <Text style={styles.giveawayEndDate}>
            Ended: {formatDate(giveaway.end_date)}
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{giveaway.current_entries}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>${(giveaway.entry_cost * giveaway.current_entries).toFixed(0)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.selectButton, selecting === giveaway.id && styles.selectButtonDisabled]}
        onPress={() => selectWinner(giveaway)}
        disabled={selecting === giveaway.id}
      >
        <LinearGradient 
          colors={selecting === giveaway.id ? ['#ccc', '#999'] : ['#667eea', '#764ba2']} 
          style={styles.selectButtonGradient}
        >
          <Ionicons 
            name={selecting === giveaway.id ? "time" : "trophy"} 
            size={20} 
            color="white" 
          />
          <Text style={styles.selectButtonText}>
            {selecting === giveaway.id ? 'Selecting...' : 'Select Winner'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Winner Selection</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading eligible giveaways...</Text>
          </View>
        ) : giveaways.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="trophy-outline" size={64} color="#ddd" />
            <Text style={styles.emptyTitle}>No Giveaways Ready</Text>
            <Text style={styles.emptyText}>
              You don't have any ended giveaways with entries that need winner selection.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateGiveawayWizard')}
            >
              <Text style={styles.createButtonText}>Create New Giveaway</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color="#667eea" />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>How Winner Selection Works</Text>
                <Text style={styles.infoDescription}>
                  Winners are selected randomly from all valid paid entries. Once selected, the winner will be notified and the giveaway will be marked as ended.
                </Text>
              </View>
            </View>

            {giveaways.map((giveaway) => (
              <GiveawayCard key={giveaway.id} giveaway={giveaway} />
            ))}
          </>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  giveawayCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  giveawayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  giveawayInfo: {
    flex: 1,
    marginRight: 16,
  },
  giveawayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  giveawayPrize: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 8,
  },
  giveawayEndDate: {
    fontSize: 12,
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    marginLeft: 20,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectButtonDisabled: {
    opacity: 0.7,
  },
  selectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
