/**
 * =============================================================================
 * CreateGiveawayWizardScreen.js
 * =============================================================================
 * 
 * PURPOSE:
 * Step-by-step wizard interface for creating giveaways with guided user experience.
 * Designed as an accessible entry point for all users, including unverified creators,
 * providing a simplified workflow compared to the advanced CreateGiveawayScreen.
 * 
 * NAVIGATION FLOW:
 * Home Screen → FAB Button → CreateGiveawayWizard
 * OR
 * Creator Dashboard → Empty State → CreateGiveawayWizard
 * OR
 * Winner Selection Screen → Create Another → CreateGiveawayWizard
 * 
 * USER REQUIREMENTS:
 * - Any logged-in user (verified OR unverified)
 * - No tier restrictions enforced (simpler than CreateGiveawayScreen)
 * - Suitable for first-time giveaway creators
 * 
 * KEY FEATURES:
 * - 5-step guided wizard with progress indicator
 * - Animated step transitions with horizontal sliding
 * - Category selection with visual icons
 * - Prize image upload with preview
 * - Social media task configuration (optional)
 * - Delivery method selection (worldwide, US-only, pickup)
 * - Review and launch final step with terms acceptance
 * - Form validation at each step before progression
 * 
 * WIZARD STEPS:
 * 1. Basic Info - Title, description, category selection
 * 2. Prize Details - Prize description, value, image upload
 * 3. Entry Settings - Entry price, max entries, end date, delivery method
 * 4. Social Tasks - Optional social media follow requirements
 * 5. Review & Launch - Final review, terms acceptance, submission
 * 
 * VALIDATION RULES:
 * - Step 1: Title and category selection required
 * - Step 2: Giveaway description, prize description and value required
 * - Step 3: Entry price and max entries required
 * - Step 4: No validation (social tasks optional)
 * - Step 5: Terms acceptance required
 * 
 * STATE MANAGEMENT:
 * - currentStep: Active wizard step (1-5)
 * - slideAnim: Animation value for step transitions
 * - formData: Complete form state across all steps
 * - Step-by-step form validation before progression
 * 
 * RELATED SCREENS:
 * - CreateGiveawayScreen: Advanced creation for verified users
 * - CreatorDashboard: Navigation destination after success
 * - HomeScreen: Primary entry point via FAB button
 * 
 * API INTEGRATION:
 * - giveawayService.uploadGiveawayImage() for image uploads
 * - giveawayService.createGiveaway() for final submission
 * - Real-time validation and error handling
 * 
 * UI/UX FEATURES:
 * - Linear gradient header with step counter
 * - Visual step indicator with active states
 * - Smooth animations between steps
 * - Mobile-optimized form inputs and layouts
 * - Error alerts with helpful messaging
 * - Success flow with dashboard navigation options
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { giveawayService } from '../../services/api';

const { width } = Dimensions.get('window');

const STEPS = [
  { id: 1, title: 'Basic Info', icon: 'information-circle' },
  { id: 2, title: 'Prize Details', icon: 'gift' },
  { id: 3, title: 'Entry Settings', icon: 'settings' },
  { id: 4, title: 'Social Tasks', icon: 'share-social' },
  { id: 5, title: 'Review & Launch', icon: 'checkmark-circle' },
];

export default function CreateGiveawayWizardScreen({ navigation }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [slideAnim] = useState(new Animated.Value(0));
  const scrollViewRef = useRef();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    description: '',
    category: 'tech',
    
    // Step 2: Prize Details
    prize: '',
    prizeValue: '',
    prizeImage: null,
    
    // Step 3: Entry Settings
    entryPrice: '',
    maxEntries: '',
    endDate: '',
    
    // Step 4: Social Tasks
    socialTasks: {
      followInstagram: false,
      followTwitter: false,
      subscribeYoutube: false,
      joinDiscord: false,
    },
    socialHandles: {
      instagram: '',
      twitter: '',
      youtube: '',
      discord: '',
    },
    
    // Additional settings
    deliveryMethod: 'worldwide',
    termsAccepted: false,
  });

  const categories = [
    { id: 'electronics', name: 'Electronics', icon: 'phone-portrait', color: '#4CAF50', emoji: '📱' },
    { id: 'gaming', name: 'Gaming', icon: 'game-controller', color: '#FF9800', emoji: '🎮' },
    { id: 'automotive', name: 'Automotive', icon: 'car', color: '#FF5722', emoji: '🚗' },
    { id: 'fashion', name: 'Fashion', icon: 'shirt', color: '#E91E63', emoji: '👕' },
    { id: 'home', name: 'Home & Garden', icon: 'home', color: '#9C27B0', emoji: '🏠' },
    { id: 'sports', name: 'Sports', icon: 'fitness', color: '#00BCD4', emoji: '⚽' },
    { id: 'travel', name: 'Travel', icon: 'airplane', color: '#795548', emoji: '✈️' },
    { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#607D8B', emoji: '🎯' },
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateSocialTask = (platform, enabled) => {
    setFormData(prev => ({
      ...prev,
      socialTasks: { ...prev.socialTasks, [platform]: enabled }
    }));
  };

  const updateSocialHandle = (platform, handle) => {
    setFormData(prev => ({
      ...prev,
      socialHandles: { ...prev.socialHandles, [platform]: handle }
    }));
  };

  const showDateSelector = () => {
    setShowDatePicker(true);
  };

  const generateDateOptions = () => {
    const today = new Date();
    const options = [];
    
    // Generate date options for the next 30 days
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      options.push({
        label: `${dayName}, ${formattedDate}`,
        sublabel: `${i} day${i > 1 ? 's' : ''} from now`,
        value: date.getTime()
      });
    }
    
    return options;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate && selectedDate.timestamp) {
      const date = new Date(selectedDate.timestamp);
      // Format date as YYYY-MM-DD for consistent display
      const formattedDate = date.toISOString().split('T')[0];
      updateFormData('endDate', formattedDate);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      const newStep = Math.min(currentStep + 1, STEPS.length);
      setCurrentStep(newStep);
      animateToStep(newStep);
    }
  };

  const previousStep = () => {
    const newStep = Math.max(currentStep - 1, 1);
    setCurrentStep(newStep);
    animateToStep(newStep);
  };

  const animateToStep = (step) => {
    Animated.timing(slideAnim, {
      toValue: -(step - 1) * width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          Alert.alert('Error', 'Please enter a giveaway title');
          return false;
        }
        if (!formData.category) {
          Alert.alert('Error', 'Please select a category');
          return false;
        }
        return true;
        
      case 2:
        if (!formData.description.trim()) {
          Alert.alert('Error', 'Please enter a giveaway description');
          return false;
        }
        if (!formData.prize.trim()) {
          Alert.alert('Error', 'Please describe the prize');
          return false;
        }
        if (!formData.prizeValue || parseFloat(formData.prizeValue) <= 0) {
          Alert.alert('Error', 'Please enter a valid prize value');
          return false;
        }
        return true;
        
      case 3:
        if (!formData.entryPrice || parseFloat(formData.entryPrice) <= 0) {
          Alert.alert('Error', 'Please enter a valid entry price');
          return false;
        }
        if (!formData.maxEntries || parseInt(formData.maxEntries) <= 0) {
          Alert.alert('Error', 'Please enter maximum number of entries');
          return false;
        }
        return true;
        
      case 4:
        // Social tasks are optional, so always valid
        return true;
        
      case 5:
        if (!formData.termsAccepted) {
          Alert.alert('Error', 'Please accept the terms and conditions');
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll permissions to select an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      updateFormData('prizeImage', result.assets[0].uri);
    }
  };

  const submitGiveaway = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'You must be logged in to create a giveaway');
        return;
      }

      console.log('🎯 Creating real giveaway...');
      
      // Validate required fields
      if (!formData.title || !formData.description || !formData.prize || !formData.entryPrice || !formData.maxEntries || !formData.endDate) {
        Alert.alert('Missing Information', 'Please fill in all required fields');
        return;
      }

      // Upload image first if provided
      let imageUrl = null;
      if (formData.prizeImage) {
        console.log('📸 Uploading giveaway image...');
        const imageResult = await giveawayService.uploadGiveawayImage(
          formData.prizeImage, 
          `giveaway-${Date.now()}.jpg`
        );
        
        if (imageResult.error) {
          console.error('Image upload failed:', imageResult.error);
          Alert.alert('Upload Error', 'Failed to upload image. Continuing without image...');
        } else {
          imageUrl = imageResult.data;
          console.log('✅ Image uploaded successfully');
        }
      }

      // Prepare giveaway data
      const giveawayData = {
        title: formData.title,
        description: formData.description,
        prize: formData.prize,
        image_url: imageUrl,
        ticketPrice: parseFloat(formData.entryPrice),
        totalTickets: parseInt(formData.maxEntries),
        endDate: formData.endDate,
        status: formData.publishImmediately ? 'active' : 'draft',
        category: formData.category || 'General'
      };

      console.log('💾 Saving giveaway to database...');
      const result = await giveawayService.createGiveaway(giveawayData, user.id);

      if (result.error) {
        console.error('❌ Giveaway creation failed:', result.error);
        Alert.alert('Creation Failed', result.error.message || 'Failed to create giveaway. Please try again.');
        return;
      }

      console.log('✅ Giveaway created successfully!');
      
      Alert.alert(
        'Success! 🎉',
        `Your giveaway "${formData.title}" has been ${formData.publishImmediately ? 'published' : 'saved as draft'} successfully!`,
        [
          {
            text: 'View Dashboard',
            onPress: () => navigation.navigate('CreatorDashboard')
          },
          {
            text: 'Create Another',
            onPress: () => {
              // Reset form
              setCurrentStep(1);
              setFormData({
                title: '',
                description: '',
                category: 'tech',
                prize: '',
                prizeValue: '',
                prizeImage: null,
                entryPrice: '',
                maxEntries: '',
                endDate: '',
                socialTasks: {},
                deliveryMethod: 'digital',
                winnerSelection: 'random',
                publishImmediately: true,
                termsAccepted: false
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Giveaway creation error:', error);
      Alert.alert('Error', 'Failed to create giveaway. Please try again.');
    }
  };

  const StepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => (
        <View key={step.id} style={styles.stepItem}>
          <View style={[
            styles.stepCircle,
            currentStep >= step.id && styles.stepCircleActive
          ]}>
            <Ionicons 
              name={step.icon} 
              size={18} 
              color={currentStep >= step.id ? '#6366F1' : '#FFFFFF'} 
            />
          </View>
          {index < STEPS.length - 1 && (
            <View style={[
              styles.stepLine,
              currentStep > step.id && styles.stepLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const CategorySelector = () => (
    <View style={styles.categoryGrid}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryCard,
            formData.category === category.id && [
              styles.categoryCardSelected,
              { borderColor: category.color }
            ]
          ]}
          onPress={() => updateFormData('category', category.id)}
        >
          <View style={[
            styles.categoryIconContainer,
            formData.category === category.id && { backgroundColor: category.color }
          ]}>
            <Text style={styles.categoryEmoji}>{category.emoji}</Text>
          </View>
          <Text style={[
            styles.categoryText,
            formData.category === category.id && styles.categoryTextSelected
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const SocialTaskToggle = ({ platform, icon, label }) => (
    <View style={styles.socialTask}>
      <View style={styles.socialTaskLeft}>
        <Ionicons name={icon} size={24} color="#667eea" />
        <Text style={styles.socialTaskLabel}>{label}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.toggle,
          formData.socialTasks[platform] && styles.toggleActive
        ]}
        onPress={() => updateSocialTask(platform, !formData.socialTasks[platform])}
      >
        <View style={[
          styles.toggleThumb,
          formData.socialTasks[platform] && styles.toggleThumbActive
        ]} />
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Text style={styles.stepDescription}>
              Let's start with the basics of your giveaway
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Giveaway Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., iPhone 15 Pro Max Giveaway"
                value={formData.title}
                onChangeText={(text) => updateFormData('title', text)}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <CategorySelector />
            </View>
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Prize Details</Text>
            <Text style={styles.stepDescription}>
              Tell us about your giveaway and the amazing prize
            </Text>

            <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
              {formData.prizeImage ? (
                <Image source={{ uri: formData.prizeImage }} style={styles.prizeImage} />
              ) : (
                <View style={styles.imageUploadPlaceholder}>
                  <Ionicons name="camera" size={40} color="#999" />
                  <Text style={styles.imageUploadText}>Add Prize Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Giveaway Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your giveaway and what makes it special..."
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prize Description *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., iPhone 15 Pro Max 256GB in Natural Titanium"
                value={formData.prize}
                onChangeText={(text) => updateFormData('prize', text)}
                maxLength={200}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prize Value (USD) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="1200"
                value={formData.prizeValue}
                onChangeText={(text) => updateFormData('prizeValue', text)}
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
        );

      case 3:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Entry Settings</Text>
            <Text style={styles.stepDescription}>
              Configure how users can enter your giveaway
            </Text>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Entry Price (USD) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="5.00"
                  value={formData.entryPrice}
                  onChangeText={(text) => updateFormData('entryPrice', text)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.inputLabel}>Max Entries *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="500"
                  value={formData.maxEntries}
                  onChangeText={(text) => updateFormData('maxEntries', text)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date *</Text>
              <TouchableOpacity style={styles.dateInput} onPress={showDateSelector}>
                <Ionicons name="calendar" size={20} color="#666" />
                <Text style={styles.dateText}>
                  {formData.endDate || 'Select end date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.deliverySection}>
              <Text style={styles.inputLabel}>Delivery</Text>
              <View style={styles.deliveryOptions}>
                {['worldwide', 'us-only', 'pickup'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.deliveryOption,
                      formData.deliveryMethod === option && styles.deliveryOptionSelected
                    ]}
                    onPress={() => updateFormData('deliveryMethod', option)}
                  >
                    <Text style={[
                      styles.deliveryOptionText,
                      formData.deliveryMethod === option && styles.deliveryOptionTextSelected
                    ]}>
                      {option === 'worldwide' ? 'Worldwide' : 
                       option === 'us-only' ? 'US Only' : 'Local Pickup'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        );

      case 4:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Social Tasks</Text>
            <Text style={styles.stepDescription}>
              Add social media tasks for bonus entries (optional)
            </Text>

            <View style={styles.socialTasks}>
              <SocialTaskToggle 
                platform="followInstagram" 
                icon="logo-instagram" 
                label="Follow on Instagram" 
              />
              <SocialTaskToggle 
                platform="followTwitter" 
                icon="logo-twitter" 
                label="Follow on Twitter" 
              />
              <SocialTaskToggle 
                platform="subscribeYoutube" 
                icon="logo-youtube" 
                label="Subscribe on YouTube" 
              />
              <SocialTaskToggle 
                platform="joinDiscord" 
                icon="logo-discord" 
                label="Join Discord Server" 
              />
            </View>

            {Object.entries(formData.socialTasks).some(([_, enabled]) => enabled) && (
              <View style={styles.socialHandles}>
                <Text style={styles.socialHandlesTitle}>Social Media Handles</Text>
                {formData.socialTasks.followInstagram && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Instagram Handle</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="@yourusername"
                      value={formData.socialHandles.instagram}
                      onChangeText={(text) => updateSocialHandle('instagram', text)}
                    />
                  </View>
                )}
                {formData.socialTasks.followTwitter && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Twitter Handle</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="@yourusername"
                      value={formData.socialHandles.twitter}
                      onChangeText={(text) => updateSocialHandle('twitter', text)}
                    />
                  </View>
                )}
                {formData.socialTasks.subscribeYoutube && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>YouTube Channel</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Channel Name or URL"
                      value={formData.socialHandles.youtube}
                      onChangeText={(text) => updateSocialHandle('youtube', text)}
                    />
                  </View>
                )}
                {formData.socialTasks.joinDiscord && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Discord Server</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Discord invite link"
                      value={formData.socialHandles.discord}
                      onChangeText={(text) => updateSocialHandle('discord', text)}
                    />
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        );

      case 5:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Review & Launch</Text>
            <Text style={styles.stepDescription}>
              Review your giveaway details before launching
            </Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>{formData.title}</Text>
              <Text style={styles.reviewDescription}>{formData.description}</Text>
              
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Prize:</Text>
                <Text style={styles.reviewValue}>{formData.prize}</Text>
              </View>
              
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Prize Value:</Text>
                <Text style={styles.reviewValue}>${formData.prizeValue}</Text>
              </View>
              
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Entry Price:</Text>
                <Text style={styles.reviewValue}>${formData.entryPrice}</Text>
              </View>
              
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Max Entries:</Text>
                <Text style={styles.reviewValue}>{formData.maxEntries}</Text>
              </View>
            </View>

            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.termsCheckbox}
                onPress={() => updateFormData('termsAccepted', !formData.termsAccepted)}
              >
                <Ionicons 
                  name={formData.termsAccepted ? 'checkbox' : 'square-outline'} 
                  size={24} 
                  color={formData.termsAccepted ? '#667eea' : '#999'} 
                />
                <Text style={styles.termsText}>
                  I agree to the Terms of Service and will fulfill the prize delivery
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Giveaway</Text>
          <View style={styles.headerRight}>
            <Text style={styles.stepCounter}>{currentStep}/{STEPS.length}</Text>
          </View>
        </View>
        <StepIndicator />
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {renderStep()}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={previousStep}>
              <Ionicons name="arrow-back" size={20} color="#6B7280" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.nextButton,
              currentStep === 1 && styles.nextButtonFullWidth
            ]} 
            onPress={currentStep === STEPS.length ? submitGiveaway : nextStep}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === STEPS.length ? 'Launch Giveaway' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select End Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.dateOptions}>
              {generateDateOptions().map((dateOption, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dateOption}
                  onPress={() => handleDateChange(null, { timestamp: dateOption.value })}
                >
                  <Text style={styles.dateOptionText}>{dateOption.label}</Text>
                  <Text style={styles.dateOptionSubtext}>{dateOption.sublabel}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  stepCounter: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '600',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  stepCircleActive: {
    backgroundColor: 'white',
    borderColor: 'white',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepLine: {
    width: 35,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 6,
    borderRadius: 1.5,
  },
  stepLineActive: {
    backgroundColor: 'white',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    color: '#374151',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 60) / 3,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryCardSelected: {
    backgroundColor: '#F8FAFC',
    borderWidth: 3,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: '#374151',
    fontWeight: '700',
  },
  imageUpload: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  prizeImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imageUploadPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUploadText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  dateInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  deliverySection: {
    marginTop: 10,
  },
  deliveryOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deliveryOption: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  deliveryOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  deliveryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  deliveryOptionTextSelected: {
    color: 'white',
  },
  socialTasks: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  socialTask: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  socialTaskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  socialTaskLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  toggle: {
    width: 50,
    height: 30,
    backgroundColor: '#e9ecef',
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#667eea',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    backgroundColor: 'white',
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  socialHandles: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  socialHandlesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  reviewDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewLabel: {
    fontSize: 16,
    color: '#666',
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  termsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 34, // Extra padding for safe area
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    flex: 1,
    gap: 8,
  },
  nextButtonFullWidth: {
    flex: 1,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  dateOptions: {
    paddingHorizontal: 20,
  },
  dateOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dateOptionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
