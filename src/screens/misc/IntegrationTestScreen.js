/**
 * IntegrationTestScreen.js - Test Component for New Integrations
 * 
 * PURPOSE:
 * Quick testing interface for newly integrated safety and compliance features.
 * Allows developers to test fairness proof, CAPTCHA, and content moderation
 * without going through full app flow.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Import our new services
import fairnessService from '../../services/fairnessService';
import captchaService from '../../services/captchaService';
import contentModerationService from '../../services/contentModerationService';
import ipGeoService from '../../services/ipGeoService';

// Import components
import FairnessProofModal from '../../components/FairnessProofModal';

export default function IntegrationTestScreen() {
  const [showFairnessModal, setShowFairnessModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [testResults, setTestResults] = useState({});

  const testFairnessService = async () => {
    try {
      Alert.alert('Testing', 'Testing fairness seed generation...');
      
      // Test fairness seed generation
      const seedResult = await fairnessService.generateGiveawaySeed('test-giveaway-123');
      
      setTestResults(prev => ({
        ...prev,
        fairness: `✅ Seed generated: ${seedResult.data?.seed_hash?.substring(0, 20)}...`
      }));
      
      Alert.alert('Success', 'Fairness service test completed!');
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        fairness: `❌ Error: ${error.message}`
      }));
      Alert.alert('Error', `Fairness test failed: ${error.message}`);
    }
  };

  const testCaptchaService = async () => {
    try {
      Alert.alert('Testing', 'Testing math CAPTCHA...');
      
      // Test math CAPTCHA generation
      const challenge = captchaService.generateMathChallenge();
      
      setTestResults(prev => ({
        ...prev,
        captcha: `✅ Challenge: ${challenge.question} = ${challenge.answer}`
      }));
      
      Alert.alert('Success', `Math CAPTCHA: ${challenge.question} = ?`);
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        captcha: `❌ Error: ${error.message}`
      }));
      Alert.alert('Error', `CAPTCHA test failed: ${error.message}`);
    }
  };

  const testImageModeration = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Need camera roll permissions to test image moderation.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        
        Alert.alert('Testing', 'Analyzing image content...');
        
        // Test content moderation
        const moderationResult = await contentModerationService.moderateImage(imageUri, {
          checkNSFW: true,
          checkViolence: true,
          contextType: 'test_image'
        });
        
        setTestResults(prev => ({
          ...prev,
          moderation: `${moderationResult.approved ? '✅' : '❌'} ${moderationResult.reason || 'Image processed'}`
        }));
        
        Alert.alert(
          'Moderation Result',
          `Approved: ${moderationResult.approved}\nReason: ${moderationResult.reason || 'No issues detected'}`
        );
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        moderation: `❌ Error: ${error.message}`
      }));
      Alert.alert('Error', `Image moderation test failed: ${error.message}`);
    }
  };

  const testIPGeolocation = async () => {
    try {
      Alert.alert('Testing', 'Testing IP geolocation...');
      
      // Test IP geolocation
      const geoResult = await ipGeoService.validateUserLocation('test-user-123');
      
      setTestResults(prev => ({
        ...prev,
        geolocation: `${geoResult.allowed ? '✅' : '❌'} ${geoResult.country || 'Unknown'} - ${geoResult.region || 'Unknown'}`
      }));
      
      Alert.alert(
        'Geolocation Result',
        `Allowed: ${geoResult.allowed}\nCountry: ${geoResult.country}\nRegion: ${geoResult.region}`
      );
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        geolocation: `❌ Error: ${error.message}`
      }));
      Alert.alert('Error', `Geolocation test failed: ${error.message}`);
    }
  };

  const TestButton = ({ title, onPress, icon, color = "#007AFF" }) => (
    <TouchableOpacity 
      style={[styles.testButton, { borderColor: color }]} 
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.testButtonText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="construct" size={32} color="#007AFF" />
        <Text style={styles.title}>Integration Test Suite</Text>
        <Text style={styles.subtitle}>Test new safety & compliance features</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛡️ Safety Features</Text>
        
        <TestButton
          title="Test Fairness Proof"
          icon="shield-checkmark"
          onPress={testFairnessService}
          color="#4CAF50"
        />
        
        <TestButton
          title="Test CAPTCHA System"
          icon="keypad"
          onPress={testCaptchaService}
          color="#FF9800"
        />
        
        <TestButton
          title="Test Image Moderation"
          icon="image"
          onPress={testImageModeration}
          color="#9C27B0"
        />
        
        <TestButton
          title="Test IP Geolocation"
          icon="location"
          onPress={testIPGeolocation}
          color="#2196F3"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎮 UI Components</Text>
        
        <TestButton
          title="Show Fairness Modal"
          icon="document-text"
          onPress={() => setShowFairnessModal(true)}
          color="#607D8B"
        />
      </View>

      {/* Test Results */}
      <View style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>📊 Test Results</Text>
        {Object.entries(testResults).map(([key, result]) => (
          <View key={key} style={styles.resultItem}>
            <Text style={styles.resultKey}>{key}:</Text>
            <Text style={styles.resultValue}>{result}</Text>
          </View>
        ))}
      </View>

      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={styles.imagePreview}>
          <Text style={styles.sectionTitle}>🖼️ Selected Image</Text>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        </View>
      )}

      {/* Fairness Modal */}
      <FairnessProofModal
        visible={showFairnessModal}
        onClose={() => setShowFairnessModal(false)}
        giveawayId="test-giveaway-123"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  resultsSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultKey: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 100,
  },
  resultValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  imagePreview: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
});
