/**
 * FairnessProofModal.js - Verifiable Winner Selection Proof
 * 
 * PURPOSE:
 * Display cryptographic proof of fair winner selection to build trust.
 * Shows pre-commit seed, HMAC calculations, and verification steps.
 * 
 * FEATURES:
 * - Pre-commit seed hash display
 * - HMAC calculation breakdown
 * - Step-by-step verification guide
 * - Independent verification instructions
 * - Shareable proof link
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import fairnessService from '../services/fairnessService';

export default function FairnessProofModal({ visible, onClose, giveawayId }) {
  const { theme } = useTheme();
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState(null);

  useEffect(() => {
    if (visible && giveawayId) {
      loadFairnessProof();
    }
  }, [visible, giveawayId]);

  const loadFairnessProof = async () => {
    setLoading(true);
    try {
      const { data, error } = await fairnessService.getFairnessProof(giveawayId);
      
      if (error || !data) {
        Alert.alert('Error', 'No fairness proof found for this giveaway');
        onClose();
        return;
      }
      
      setProof(data);
      
      // Verify the proof independently
      const verificationResult = fairnessService.verifyFairnessProof(data);
      setVerification(verificationResult);
      
    } catch (error) {
      console.error('Failed to load fairness proof:', error);
      Alert.alert('Error', 'Failed to load fairness proof');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const formatHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const renderVerificationStep = (step, index) => (
    <View key={index} style={[styles.stepCard, { backgroundColor: theme.surface }]}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
          <Text style={styles.stepNumberText}>{index + 1}</Text>
        </View>
        <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
      </View>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        {step.description}
      </Text>
      {step.code && (
        <View style={[styles.codeBlock, { backgroundColor: theme.background }]}>
          <Text style={[styles.codeText, { color: theme.text }]}>{step.code}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyToClipboard(step.code, 'Code')}
          >
            <Ionicons name="copy" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const verificationSteps = [
    {
      title: "Verify Seed Commitment",
      description: "Check that the revealed seed matches the pre-published hash",
      code: proof ? `SHA256("${proof.seed_value}") = ${proof.seed_hash}` : ''
    },
    {
      title: "Recreate Winner Calculation",
      description: "Use the revealed seed and winner's payment ID to recreate the HMAC",
      code: proof ? `HMAC_SHA256("${proof.winner_input}", "${proof.seed_value}") = ${proof.winner_hash}` : ''
    },
    {
      title: "Verify Selection Method",
      description: "Confirm the winner had the highest HMAC value among all entries",
      code: proof ? `Selection: ${proof.selection_method}` : ''
    },
    {
      title: "Check Timeline",
      description: "Verify the seed was committed before the giveaway ended",
      code: proof ? `Committed: ${new Date(proof.giveaway?.end_date).toLocaleString()}` : ''
    }
  ];

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading fairness proof...
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Fairness Proof
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.surface }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Verification Status */}
          <View style={[styles.statusCard, { 
            backgroundColor: verification?.isValid ? '#4CAF50' : '#FF3B30' 
          }]}>
            <Ionicons 
              name={verification?.isValid ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.statusText}>
              {verification?.isValid ? 'Proof Verified ✓' : 'Verification Failed ✗'}
            </Text>
          </View>

          {/* Giveaway Info */}
          <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Giveaway Information
            </Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Title:</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {proof?.giveaway?.title || 'Unknown'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Winner:</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {proof?.winner?.username || 'Anonymous'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Total Entries:</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {proof?.total_entries?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>

          {/* Cryptographic Details */}
          <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Cryptographic Proof
            </Text>
            
            <View style={styles.hashRow}>
              <Text style={[styles.hashLabel, { color: theme.textSecondary }]}>
                Pre-commit Seed Hash:
              </Text>
              <TouchableOpacity
                style={styles.hashContainer}
                onPress={() => copyToClipboard(proof?.seed_hash, 'Seed Hash')}
              >
                <Text style={[styles.hashText, { color: theme.primary }]}>
                  {formatHash(proof?.seed_hash)}
                </Text>
                <Ionicons name="copy" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.hashRow}>
              <Text style={[styles.hashLabel, { color: theme.textSecondary }]}>
                Winner Input:
              </Text>
              <TouchableOpacity
                style={styles.hashContainer}
                onPress={() => copyToClipboard(proof?.winner_input, 'Winner Input')}
              >
                <Text style={[styles.hashText, { color: theme.primary }]}>
                  {formatHash(proof?.winner_input)}
                </Text>
                <Ionicons name="copy" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.hashRow}>
              <Text style={[styles.hashLabel, { color: theme.textSecondary }]}>
                HMAC Result:
              </Text>
              <TouchableOpacity
                style={styles.hashContainer}
                onPress={() => copyToClipboard(proof?.winner_hash, 'HMAC Result')}
              >
                <Text style={[styles.hashText, { color: theme.primary }]}>
                  {formatHash(proof?.winner_hash)}
                </Text>
                <Ionicons name="copy" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* How to Verify */}
          <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              How to Verify This Proof
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Anyone can independently verify this proof using these steps:
            </Text>
            
            {verificationSteps.map((step, index) => renderVerificationStep(step, index))}
          </View>

          {/* Technical Details */}
          <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Technical Details
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              • Algorithm: HMAC-SHA256 with pre-commit seed{'\n'}
              • Selection: Highest hash value wins{'\n'}
              • Seed: 256-bit cryptographically secure random{'\n'}
              • Verifiable: All inputs and outputs are public{'\n'}
              • Immutable: Stored permanently on blockchain
            </Text>
          </View>

          {/* Share Proof */}
          <View style={[styles.shareCard, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="share" size={24} color={theme.primary} />
            <View style={styles.shareContent}>
              <Text style={[styles.shareTitle, { color: theme.text }]}>
                Share This Proof
              </Text>
              <Text style={[styles.shareDescription, { color: theme.textSecondary }]}>
                This proof can be shared publicly to demonstrate fair selection
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                const proofUrl = `https://entrypoint.app/proof/${giveawayId}`;
                copyToClipboard(proofUrl, 'Proof URL');
              }}
            >
              <Text style={styles.shareButtonText}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  infoCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  hashRow: {
    marginBottom: 16,
  },
  hashLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  hashContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  hashText: {
    fontSize: 14,
    fontFamily: 'monospace',
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  stepCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  codeBlock: {
    padding: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
  },
  copyButton: {
    padding: 4,
  },
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  shareContent: {
    flex: 1,
    marginLeft: 16,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  shareDescription: {
    fontSize: 14,
  },
  shareButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
