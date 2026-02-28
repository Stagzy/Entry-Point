/**
 * =============================================================================
 * ComingSoonScreen.js
 * =============================================================================
 * 
 * PURPOSE:
 * Generic placeholder screen for features that are not yet implemented.
 * Displays a user-friendly "coming soon" message with consistent branding.
 * 
 * CURRENT USAGE:
 * Currently defined in navigation but not actively used in the app.
 * Can be navigated to with custom title and description parameters.
 * 
 * INTENDED USAGE:
 * Navigate to this screen when users tap on features that are under development:
 * navigation.navigate('ComingSoon', { 
 *   title: 'Feature Name', 
 *   description: 'Custom description for this feature' 
 * })
 * 
 * ROUTE PARAMETERS:
 * - title (optional): Custom title to display (defaults to "Coming Soon")
 * - description (optional): Custom description text (defaults to generic message)
 * 
 * FEATURES:
 * - Clean, professional "under construction" design
 * - Customizable title and description via route params
 * - Construction/hammer icon for visual feedback
 * - Back button to return to previous screen
 * - Consistent styling with app design system
 * 
 * POTENTIAL USE CASES:
 * - Video calling feature in ChatScreen
 * - Advanced analytics features
 * - Social media integrations
 * - Payment method implementations (PayPal, Apple Pay, etc.)
 * - Advanced giveaway features
 * 
 * STYLING:
 * - Light background with centered content
 * - Blue accent color matching app theme
 * - Professional typography with hierarchy
 * - Standard header with back navigation
 * =============================================================================
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ComingSoonScreen({ navigation, route }) {
  const { title = 'Coming Soon', description = 'This feature is coming soon!' } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="construct" size={80} color="#007AFF" />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.subtitle}>
          We're working hard to bring you this feature. Stay tuned for updates!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
});
