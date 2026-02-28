/**
 * HelpSupportScreen - Comprehensive User Support Center
 * 
 * PURPOSE:
 * - Provides comprehensive customer support and help resources
 * - Offers multiple contact methods for user assistance
 * - Features expandable FAQ section for common questions
 * - Includes quick access to settings and app information
 * 
 * NAVIGATION:
 * - Accessed from: SettingsScreen → "Help & Support" option
 * - Alternative Access: Profile menu, side navigation
 * - Returns to: Previous screen via back button
 * - External Links: Help center, terms, privacy policy
 * 
 * KEY FEATURES:
 * - Multi-Channel Support: Email, chat, phone, help center options
 * - Interactive FAQ: Expandable/collapsible question-answer pairs
 * - External Integration: Links to web-based help resources
 * - Contact Methods: Multiple ways to reach support team
 * 
 * USER REQUIREMENTS:
 * - No Authentication: Accessible to all users (logged in or not)
 * - Device Capabilities: Uses native linking for email/phone
 * - Internet Connection: Required for external links and chat
 * 
 * STATE MANAGEMENT:
 * - expandedFAQ: Tracks which FAQ item is currently expanded
 * - Simple toggle state for accordion-style FAQ display
 * 
 * SUPPORT CHANNELS:
 * 1. Email Support:
 *    - Pre-filled subject line for help requests
 *    - Opens default email client with support address
 *    - 24/7 availability with response time expectations
 * 
 * 2. Live Chat:
 *    - Real-time chat with support representatives
 *    - Currently in development (shows coming soon message)
 *    - Future integration with chat platforms
 * 
 * 3. Phone Support:
 *    - Business hours: Monday-Friday 9AM-5PM EST
 *    - Direct phone number with alert display
 *    - For urgent issues requiring immediate assistance
 * 
 * 4. Help Center:
 *    - Web-based knowledge base and documentation
 *    - Comprehensive guides and tutorials
 *    - Self-service resource center
 * 
 * FAQ COVERAGE:
 * - Giveaway Participation: How to enter and purchase tickets
 * - Giveaway Creation: Step-by-step creator guide
 * - Winner Notifications: Timing and announcement process
 * - Prize Claiming: Instructions for winners
 * - Legitimacy Verification: Platform trust and security
 * - Refund Policy: Entry purchase refund conditions
 * - Creator Contact: Communication with giveaway creators
 * - Payment Security: Financial information protection
 * 
 * QUICK ACTIONS:
 * - Terms of Service: External link to legal terms
 * - Privacy Policy: External link to privacy documentation
 * 
 * EXTERNAL INTEGRATIONS:
 * - Email Client: Native mailto: URL scheme
 * - Web Browser: External links for terms, privacy, help center
 * - Phone Dialer: Future integration for direct calling
 * - Chat Platform: Integration planned for live chat
 * 
 * USER EXPERIENCE:
 * - Progressive Disclosure: FAQ accordion reduces visual clutter
 * - Clear Visual Hierarchy: Organized sections with proper spacing
 * - Intuitive Icons: Recognizable icons for each support method
 * - Responsive Design: Adapts to different screen sizes
 * - Accessibility: Screen reader friendly with proper labeling
 * 
 * CONTENT ORGANIZATION:
 * 1. Contact Support: Primary support channel options
 * 2. FAQ Section: Common questions with detailed answers
 * 3. Legal Documents: Links to terms, privacy, and policies
 * 4. App Information: Version details and company info
 * 
 * SUPPORT WORKFLOW:
 * - Self-Service First: FAQ section for immediate answers
 * - Escalation Path: Multiple contact methods for complex issues
 * - External Resources: Help center for detailed documentation
 * - Direct Contact: Email and phone for personalized assistance
 * 
 * TECHNICAL DETAILS:
 * - Native Linking: Uses React Native Linking API for external actions
 * - State Persistence: FAQ expansion state maintained during session
 * - Error Handling: Graceful fallbacks for failed external links
 * - Performance: Efficient rendering with minimal re-renders
 * 
 * RELATED SCREENS:
 * - SettingsScreen: Primary navigation source
 * - EditProfileScreen: Quick action destination
 * - External Help Center: Web-based support resources
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function HelpSupportScreen({ navigation }) {
  const { theme } = useTheme();
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqData = [
    {
      id: 1,
      question: 'How do I participate in a giveaway?',
      answer: 'To participate in a giveaway, browse the available giveaways, select one you\'re interested in, and purchase entries. You can also complete bonus actions like following social media accounts for additional entries.'
    },
    {
      id: 2,
      question: 'How do I create my own giveaway?',
      answer: 'To create a giveaway, tap the "Create" tab, fill in all the required information including title, description, prize details, and upload an image. Your giveaway will be reviewed before going live.'
    },
    {
      id: 3,
      question: 'When will I know if I won?',
      answer: 'Winners are announced when the giveaway ends. You\'ll receive a notification in the app and via email if you win. Check the giveaway details for the specific end date and announcement time.'
    },
    {
      id: 4,
      question: 'How do I claim my prize?',
      answer: 'If you win, you\'ll receive detailed instructions via email and in-app notification. Follow the provided steps to verify your identity and claim your prize within the specified timeframe.'
    },
    {
      id: 5,
      question: 'Are the giveaways legitimate?',
      answer: 'Yes! All giveaways are structured as legitimate promotional marketing campaigns. We verify creators and ensure all legal requirements are met. Winners are selected fairly using secure random selection methods.'
    },
    {
      id: 6,
      question: 'Can I get a refund on my entries?',
      answer: 'Entry purchases are generally final once made. However, if a giveaway is cancelled by the creator or platform, full refunds will be processed automatically within 3-5 business days.'
    },
    {
      id: 7,
      question: 'How do I contact a creator?',
      answer: 'You can contact creators through their profile pages if they have enabled direct messaging. You can also follow their social media accounts linked on their profile.'
    },
    {
      id: 8,
      question: 'Is my payment information secure?',
      answer: 'Yes, we use industry-standard encryption and secure payment processing. We never store your complete payment information and all transactions are processed through secure, certified payment gateways.'
    }
  ];

  const supportOptions = [
    {
      icon: 'mail',
      title: 'Email Support',
      description: 'Get help via email - support@entrypointapp.com',
      action: () => openEmail()
    }
  ];



  const legalDocuments = [
    {
      icon: 'document-text',
      title: 'Terms of Service',
      description: 'Platform usage terms and conditions',
      action: () => openLegalDocument('https://entrypointapp.com/terms-of-service')
    },
    {
      icon: 'shield-checkmark',
      title: 'Privacy Policy',
      description: 'How we handle your data',
      action: () => openLegalDocument('https://entrypointapp.com/privacy-policy')
    },
    {
      icon: 'ribbon',
      title: 'Creator Agreement',
      description: 'Terms for hosting giveaways',
      action: () => openLegalDocument('https://entrypointapp.com/creator-agreement')
    },
    {
      icon: 'flag',
      title: 'Content Policy',
      description: 'Community guidelines and DMCA',
      action: () => openLegalDocument('https://entrypointapp.com/content-policy')
    }
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const openEmail = () => {
    Linking.openURL('mailto:support@entrypointapp.com?subject=Help Request');
  };

  const openLegalDocument = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Error',
        'Could not open the legal document. Please try again later or contact support.',
        [{ text: 'OK' }]
      );
    });
  };

  const renderFAQItem = (item) => (
    <View key={item.id} style={[styles.faqItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={() => toggleFAQ(item.id)}
      >
        <Text style={[styles.faqQuestionText, { color: theme.text }]}>{item.question}</Text>
        <Ionicons
          name={expandedFAQ === item.id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.textSecondary}
        />
      </TouchableOpacity>
      {expandedFAQ === item.id && (
        <View style={styles.faqAnswer}>
          <Text style={[styles.faqAnswerText, { color: theme.textSecondary }]}>{item.answer}</Text>
        </View>
      )}
    </View>
  );

  const renderSupportOption = (option) => (
    <TouchableOpacity
      key={option.title}
      style={[styles.supportOption, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={option.action}
    >
      <View style={styles.supportIconContainer}>
        <Ionicons name={option.icon} size={24} color={theme.primary} />
      </View>
      <View style={styles.supportContent}>
        <Text style={[styles.supportTitle, { color: theme.text }]}>{option.title}</Text>
        <Text style={[styles.supportDescription, { color: theme.textSecondary }]}>{option.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={[styles.content, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Contact Support Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Support</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Get help from our support team via email
          </Text>
          <View style={styles.supportGrid}>
            {supportOptions.map(renderSupportOption)}
          </View>
        </View>

        {/* Legal Documents Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Legal Documents</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Important terms, policies, and agreements
          </Text>
          <View style={styles.supportGrid}>
            {legalDocuments.map(renderSupportOption)}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={[styles.section, styles.lastSection, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Frequently Asked Questions</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Quick answers to common questions
          </Text>
          <View style={styles.faqContainer}>
            {faqData.map(renderFAQItem)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  lastSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  supportGrid: {
    gap: 15,
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  supportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  supportDescription: {
    fontSize: 14,
    color: '#666',
  },
  faqContainer: {
    gap: 10,
  },
  faqItem: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  faqAnswer: {
    padding: 15,
    paddingTop: 0,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
