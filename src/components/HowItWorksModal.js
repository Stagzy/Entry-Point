/**
 * HowItWorksModal.js - Platform Explanation Modal
 * 
 * PURPOSE:
 * Explains how the platform works to users in a clear, accessible format.
 * Covers entry purchasing, AMOE, winner selection, and legal compliance.
 * 
 * FEATURES:
 * - Step-by-step explanation of the giveaway process
 * - Entry method descriptions (paid & free)
 * - Winner selection transparency
 * - Platform safety and legitimacy assurance
 * - Links to relevant legal documents
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function HowItWorksModal({ visible, onClose, onOpenOfficialRules, onOpenAMOE }) {
  const { theme } = useTheme();

  const steps = [
    {
      icon: 'search',
      title: 'Browse Giveaways',
      description: 'Discover exciting prizes from verified creators. Filter by category, value, or ending soon.',
      details: 'All giveaways are hosted by verified creators and reviewed for legitimacy before going live.'
    },
    {
      icon: 'ticket',
      title: 'Purchase Entries',
      description: 'Buy entries to increase your chances of winning. More entries = better odds!',
      details: 'Entry prices are set by creators. All payments are secure and processed through certified gateways.'
    },
    {
      icon: 'gift-outline',
      title: 'Free Entry Option',
      description: 'No purchase necessary! Submit one free entry per day using our AMOE form.',
      details: 'Free entries have the same chance of winning as paid entries. This is required by law for all giveaways.'
    },
    {
      icon: 'share-social',
      title: 'Bonus Entries',
      description: 'Follow creators on social media for bonus entries and stay updated on new giveaways.',
      details: 'Complete social tasks like following on Instagram, YouTube, or Twitter to earn additional entries.'
    },
    {
      icon: 'trophy',
      title: 'Random Winner Selection',
      description: 'Winners are selected randomly using our verified fairness system.',
      details: 'Selection is transparent and auditable. All entries (paid and free) have equal chances of winning.'
    },
    {
      icon: 'notifications',
      title: 'Winner Notification',
      description: 'Winners are notified within 24 hours via email and app notification.',
      details: 'You have 72 hours to respond and 7 days to complete verification and provide shipping information.'
    }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Ionicons name="help-circle" size={24} color={theme.primary} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>How It Works</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.border }]}
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Introduction */}
          <View style={[styles.introSection, { backgroundColor: theme.surface }]}>
            <Text style={[styles.introTitle, { color: theme.text }]}>
              Welcome to Entry Point
            </Text>
            <Text style={[styles.introText, { color: theme.textSecondary }]}>
              Entry Point is a legitimate promotional marketing platform where verified creators host giveaways and users can participate safely and transparently.
            </Text>
          </View>

          {/* Steps */}
          {steps.map((step, index) => (
            <View key={index} style={[styles.stepCard, { backgroundColor: theme.surface }]}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepIconContainer, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name={step.icon} size={24} color={theme.primary} />
                </View>
                <View style={styles.stepNumber}>
                  <Text style={[styles.stepNumberText, { color: theme.primary }]}>{index + 1}</Text>
                </View>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: theme.text }]}>
                  {step.title}
                </Text>
                <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
                  {step.description}
                </Text>
                <Text style={[styles.stepDetails, { color: theme.textTertiary }]}>
                  {step.details}
                </Text>
              </View>
            </View>
          ))}

          {/* Safety & Legitimacy */}
          <View style={[styles.safetySection, { backgroundColor: theme.surface }]}>
            <View style={[styles.safetyHeader, { borderColor: theme.primary }]}>
              <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
              <Text style={[styles.safetyTitle, { color: theme.text }]}>
                Safety & Legitimacy
              </Text>
            </View>
            <View style={styles.safetyPoints}>
              <View style={styles.safetyPoint}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={[styles.safetyPointText, { color: theme.textSecondary }]}>
                  All creators are verified and background-checked
                </Text>
              </View>
              <View style={styles.safetyPoint}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={[styles.safetyPointText, { color: theme.textSecondary }]}>
                  Winner selection is transparent and auditable
                </Text>
              </View>
              <View style={styles.safetyPoint}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={[styles.safetyPointText, { color: theme.textSecondary }]}>
                  Payments are secured with bank-level encryption
                </Text>
              </View>
              <View style={styles.safetyPoint}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={[styles.safetyPointText, { color: theme.textSecondary }]}>
                  Full legal compliance with promotional regulations
                </Text>
              </View>
            </View>
          </View>

          {/* Legal Links */}
          <View style={[styles.legalSection, { backgroundColor: theme.surface }]}>
            <Text style={[styles.legalTitle, { color: theme.text }]}>
              Legal Information
            </Text>
            <Text style={[styles.legalDescription, { color: theme.textSecondary }]}>
              Review important legal documents and giveaway rules
            </Text>
            
            <View style={styles.legalLinks}>
              <TouchableOpacity 
                style={[styles.legalLink, { borderColor: theme.border }]}
                onPress={() => {
                  onClose();
                  onOpenOfficialRules?.();
                }}
              >
                <Ionicons name="document-text" size={20} color={theme.primary} />
                <Text style={[styles.legalLinkText, { color: theme.primary }]}>
                  Official Rules
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.legalLink, { borderColor: theme.border }]}
                onPress={() => {
                  onClose();
                  onOpenAMOE?.();
                }}
              >
                <Ionicons name="gift-outline" size={20} color={theme.primary} />
                <Text style={[styles.legalLinkText, { color: theme.primary }]}>
                  Free Entry (AMOE)
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Have more questions? Visit our Help & Support section or contact our team directly.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  introSection: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  stepCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    marginTop: -8,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  stepDetails: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  safetySection: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  safetyPoints: {
    gap: 12,
  },
  safetyPoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safetyPointText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  legalSection: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legalDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  legalLinks: {
    gap: 12,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  legalLinkText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
