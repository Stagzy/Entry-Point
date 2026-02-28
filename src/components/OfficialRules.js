import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getEligibilityMessage } from '../config/geographicCompliance';

/**
 * OfficialRules Component
 * 
 * Displays legally compliant sweepstakes rules that can be customized per giveaway.
 * This component ensures the platform operates as a sweepstakes (not lottery/gambling).
 * 
 * Required for legal compliance under state and federal sweepstakes laws.
 */

const OfficialRules = ({ visible, onClose, giveaway, sponsor }) => {
  const { theme } = useTheme();

  // Calculate odds based on current entries
  const calculateOdds = () => {
    if (!giveaway?.totalTickets || giveaway.totalTickets === 0) {
      return "Odds depend on total number of eligible entries received";
    }
    
    const currentEntries = giveaway.currentSoldTickets || 0;
    const maxEntries = giveaway.totalTickets;
    
    if (currentEntries === 0) {
      return `Odds will depend on total entries (maximum ${maxEntries.toLocaleString()} entries possible)`;
    }
    
    return `Current odds: 1 in ${currentEntries.toLocaleString()} (subject to change based on total entries)`;
  };

  // Format currency for ARV
  const formatARV = (value) => {
    if (!value) return "To be determined";
    return `$${value.toLocaleString()}.00 USD`;
  };

  // Generate eligibility text
  const getEligibilityText = () => {
    return `${getEligibilityMessage()} Employees of ${sponsor?.name || '[SPONSOR NAME]'}, their advertising and promotion agencies, and their immediate family members (spouse, parents, children, siblings and their respective spouses) and household members of such employees are not eligible.`;
  };

  // Get AMOE method description
  const getAMOEMethod = () => {
    return `Alternative Method of Entry: To enter without purchase, complete the free entry form available through the official platform or send a hand-written 3" x 5" card with your full name, complete address, telephone number, date of birth, and email address to: ${sponsor?.name || '[SPONSOR NAME]'} AMOE, ${sponsor?.address || '[SPONSOR ADDRESS]'}. Limit one (1) free entry per person per day during the Promotion Period.`;
  };

  const rulesContent = [
    {
      title: "1. SPONSOR",
      content: `This promotion is sponsored by ${sponsor?.name || '[SPONSOR NAME]'}, located at ${sponsor?.address || '[SPONSOR ADDRESS]'} ("Sponsor").`
    },
    {
      title: "2. PROMOTION PERIOD",
      content: `The promotion begins on ${giveaway?.startDate ? new Date(giveaway.startDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }) : '[START DATE]'} and ends on ${giveaway?.endDate ? new Date(giveaway.endDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }) : '[END DATE]'} ("Promotion Period"). All entries must be received during the Promotion Period.`
    },
    {
      title: "3. ELIGIBILITY",
      content: getEligibilityText()
    },
    {
      title: "4. HOW TO ENTER",
      content: `During the Promotion Period, eligible participants may enter by: (a) purchasing entry tickets through the official platform at $${giveaway?.costPerEntry || '[COST]'} per entry, or (b) using the Alternative Method of Entry described below. Multiple entries are permitted up to the maximum allowed. Each entry method has equal chance of winning.`
    },
    {
      title: "5. ALTERNATIVE METHOD OF ENTRY (AMOE)",
      content: getAMOEMethod()
    },
    {
      title: "6. PRIZE DESCRIPTION",
      content: `One (1) Grand Prize: ${giveaway?.title || '[PRIZE DESCRIPTION]'}. Approximate Retail Value ("ARV"): ${formatARV(giveaway?.arv || giveaway?.prizeValue)}. Prize is awarded "as is" with no warranty or guarantee, either express or implied. Prize is non-transferable and no cash substitution or prize alternatives are permitted except at Sponsor's sole discretion.`
    },
    {
      title: "7. ODDS OF WINNING",
      content: calculateOdds()
    },
    {
      title: "8. WINNER SELECTION AND NOTIFICATION",
      content: `One (1) potential Grand Prize winner will be selected in a random drawing from all eligible entries received during the Promotion Period. The drawing will be conducted on or about ${giveaway?.endDate ? new Date(new Date(giveaway.endDate).getTime() + 24*60*60*1000).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      }) : '[DRAWING DATE]'} by Sponsor or its authorized representative, whose decisions are final and binding. The potential winner will be notified via the contact information provided at entry within five (5) business days of the drawing.`
    },
    {
      title: "9. WINNER VERIFICATION AND PRIZE CLAIM",
      content: `The potential winner must respond to the winner notification within seventy-two (72) hours and complete and return all required affidavit and release forms within seven (7) days of notification attempt. Failure to respond timely or return completed forms may result in disqualification and selection of an alternate winner. Winner must provide valid government-issued photo identification and may be required to complete tax forms.`
    },
    {
      title: "10. TAX OBLIGATIONS",
      content: `Winner is solely responsible for all federal, state, and local taxes on the prize. A Form 1099 will be issued for prizes valued at $600 or more. Winner may be required to provide tax identification number.`
    },
    {
      title: "11. GENERAL CONDITIONS",
      content: `By entering, participants agree to be bound by these Official Rules and the decisions of Sponsor. Entries become property of Sponsor. Sponsor reserves the right to disqualify any entry that is incomplete, illegible, damaged, irregular, or submitted through unauthorized or illegitimate channels. Sponsor is not responsible for lost, late, misdirected, damaged, incomplete, or illegible entries.`
    },
    {
      title: "12. PUBLICITY RELEASE",
      content: `By entering, winner grants permission to Sponsor to use their name, likeness, voice, biographical information, and prize information for advertising and promotional purposes in any media now known or hereafter developed, worldwide, in perpetuity, without further compensation except where prohibited by law.`
    },
    {
      title: "13. LIMITATION OF LIABILITY",
      content: `By participating, entrants agree to release and hold harmless Sponsor, their parent companies, subsidiaries, affiliates, and their respective officers, directors, employees, and agents from any and all liability for any injuries, losses, or damages of any kind arising from or in connection with the promotion or any prize won.`
    },
    {
      title: "14. DISPUTES",
      content: `Any dispute arising out of this promotion will be governed by the laws of the state where Sponsor is located, without regard to conflict of law principles. Any legal proceedings must be brought in the courts of competent jurisdiction in that state.`
    },
    {
      title: "15. VOID WHERE PROHIBITED",
      content: `This promotion is void where prohibited, taxed, or restricted by law. Some states and countries have restrictions on sweepstakes and contests.`
    },
    {
      title: "16. WINNER'S LIST",
      content: `For the name of the winner, send a self-addressed stamped envelope to: ${sponsor?.name || '[SPONSOR NAME]'} Winner's List, ${sponsor?.address || '[SPONSOR ADDRESS]'}, within sixty (60) days after the end of the Promotion Period.`
    }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Ionicons name="document-text" size={24} color={theme.primary} />
              <Text style={[styles.headerTitle, { color: theme.text }]}>Official Rules</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.border }]}
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
          
          {/* Giveaway Info */}
          <View style={styles.giveawayInfo}>
            <Text style={[styles.giveawayTitle, { color: theme.text }]}>
              {giveaway?.title || 'Sweepstakes Promotion'}
            </Text>
            <Text style={[styles.legalNotice, { color: theme.textSecondary }]}>
              NO PURCHASE NECESSARY TO ENTER OR WIN
            </Text>
          </View>
        </View>

        {/* Rules Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Important Notice */}
          <View style={[styles.importantNotice, { backgroundColor: theme.primary + '10', borderColor: theme.primary }]}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.noticeText, { color: theme.text }]}>
              Please read these Official Rules carefully. By entering this sweepstakes, you agree to be bound by these terms.
            </Text>
          </View>

          {/* Rules Sections */}
          {rulesContent.map((section, index) => (
            <View key={index} style={[styles.ruleSection, { backgroundColor: theme.surface }]}>
              <Text style={[styles.ruleTitle, { color: theme.primary }]}>
                {section.title}
              </Text>
              <Text style={[styles.ruleContent, { color: theme.text }]}>
                {section.content}
              </Text>
            </View>
          ))}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              These Official Rules constitute the complete and exclusive agreement between you and Sponsor regarding this promotion.
            </Text>
            <Text style={[styles.lastUpdated, { color: theme.textTertiary }]}>
              Last Updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giveawayInfo: {
    alignItems: 'center',
  },
  giveawayTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  legalNotice: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  importantNotice: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 20,
  },
  ruleSection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  ruleContent: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  lastUpdated: {
    fontSize: 11,
    textAlign: 'center',
  },
});

export default OfficialRules;
