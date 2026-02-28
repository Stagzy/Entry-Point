import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const { register, login, signInWithApple, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    isCreator: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const username = `${formData.firstName.trim().toLowerCase()}_${formData.lastName.trim().toLowerCase()}`;
      
      const result = await register(formData.email, formData.password, {
        name: fullName,
        username: username,
        isCreator: formData.isCreator
      });
      
      if (result.user && !result.error) {
        Alert.alert(
          'Registration Successful! 🎉',
          'Your account has been created. Please check your email to verify your account before signing in.',
          [
            {
              text: 'Go to Login',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.error?.message || 'Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleRegister = async () => {
    try {
      setIsLoading(true);
      console.log('🍎 Starting Apple Sign-In from Register Screen...');
      
      const result = await signInWithApple();
      
      if (result.error) {
        if (result.error.cancelled) {
          // User cancelled, don't show error
          console.log('User cancelled Apple Sign-In');
          return;
        }
        Alert.alert('Apple Sign-In Failed', result.error.message);
        return;
      }
      
      if (result.user) {
        console.log('✅ Apple Sign-In/Registration successful');
        if (result.isNewUser) {
          Alert.alert(
            'Welcome to Entry Point! 🎉',
            'Your Apple account has been created successfully. You\'re now verified and ready to create giveaways!',
            [{ text: 'Get Started' }]
          );
        } else {
          Alert.alert(
            'Welcome Back! 👋',
            'You already have an account with this Apple ID. You\'ve been signed in.',
            [{ text: 'Continue' }]
          );
        }
        // Navigation is handled by AuthContext
      }
      
    } catch (error) {
      console.error('Apple registration error:', error);
      Alert.alert('Error', 'Apple Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setIsLoading(true);
      console.log('🌐 Starting Google Sign-In from Register Screen...');
      
      const result = await signInWithGoogle();
      
      if (result.error) {
        if (result.error.cancelled) {
          // User cancelled, don't show error
          console.log('User cancelled Google Sign-In');
          return;
        }
        Alert.alert('Google Sign-In Failed', result.error.message);
        return;
      }
      
      if (result.user) {
        console.log('✅ Google Sign-In/Registration successful');
        if (result.isNewUser) {
          Alert.alert(
            'Welcome to Entry Point! 🎉',
            'Your Google account has been created successfully. You\'re now verified and ready to create giveaways!',
            [{ text: 'Get Started' }]
          );
        } else {
          Alert.alert(
            'Welcome Back! 👋',
            'You already have an account with this Google account. You\'ve been signed in.',
            [{ text: 'Continue' }]
          );
        }
        // Navigation is handled by AuthContext
      }
      
    } catch (error) {
      console.error('Google registration error:', error);
      Alert.alert('Error', 'Google Sign-In failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialRegister = (provider) => {
    if (provider === 'Apple') {
      handleAppleRegister();
    } else if (provider === 'Google') {
      handleGoogleRegister();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Section */}
          <View style={styles.brandContainer}>
            <View style={styles.logoContainer}>
              <Ionicons name="gift" size={32} color="#fff" />
            </View>
            <Text style={styles.brandName}>Join Entry Point</Text>
            <Text style={styles.brandTagline}>Start your giveaway journey today</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.formCard}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join thousands of winners</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.nameRow}>
                <View style={styles.nameInput}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'firstName' && styles.inputWrapperFocused
                  ]}>
                    <Ionicons name="person-outline" size={18} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="John"
                      placeholderTextColor="#999"
                      value={formData.firstName}
                      onChangeText={(text) => setFormData({...formData, firstName: text})}
                      autoCapitalize="words"
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
                <View style={styles.nameInput}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'lastName' && styles.inputWrapperFocused
                  ]}>
                    <Ionicons name="person-outline" size={18} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Doe"
                      placeholderTextColor="#999"
                      value={formData.lastName}
                      onChangeText={(text) => setFormData({...formData, lastName: text})}
                      autoCapitalize="words"
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'email' && styles.inputWrapperFocused
                ]}>
                  <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    value={formData.email}
                    onChangeText={(text) => setFormData({...formData, email: text})}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'password' && styles.inputWrapperFocused
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Create a password"
                    placeholderTextColor="#999"
                    value={formData.password}
                    onChangeText={(text) => setFormData({...formData, password: text})}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'confirmPassword' && styles.inputWrapperFocused
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    placeholderTextColor="#999"
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.creatorToggle}
                onPress={() => setFormData({...formData, isCreator: !formData.isCreator})}
              >
                <View style={styles.toggleLeft}>
                  <View style={[styles.checkbox, formData.isCreator && styles.checkedBox]}>
                    {formData.isCreator && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleTitle}>I'm a content creator</Text>
                    <Text style={styles.toggleSubtitle}>
                      Create giveaways and grow your audience
                    </Text>
                  </View>
                </View>
                <Ionicons name="star" size={20} color="#FF9500" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.termsToggle}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkedBox]}>
                  {agreedToTerms && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#ccc', '#ccc'] : ['#667eea', '#764ba2']}
                  style={styles.registerButtonGradient}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.registerButtonText}>Creating Account...</Text>
                    </View>
                  ) : (
                    <Text style={styles.registerButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or sign up with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialRegister('Google')}
                  disabled={isLoading}
                >
                  <View style={styles.socialButtonContent}>
                    <Ionicons name="logo-google" size={22} color="#DB4437" />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialButton, styles.appleButton]}
                  onPress={() => handleSocialRegister('Apple')}
                  disabled={isLoading}
                >
                  <View style={styles.socialButtonContent}>
                    <Ionicons name="logo-apple" size={22} color="#fff" />
                    <Text style={[styles.socialButtonText, styles.appleButtonText]}>Apple</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 60,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandTagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  nameInput: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 14,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: '#667eea',
    backgroundColor: '#fff',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    paddingVertical: 0,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 6,
    marginLeft: 6,
  },
  creatorToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e3f2fd',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleText: {
    marginLeft: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkedBox: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  termsToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  termsText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  termsLink: {
    color: '#667eea',
    fontWeight: '600',
  },
  registerButton: {
    borderRadius: 16,
    marginBottom: 25,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  registerButtonGradient: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  socialButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  appleButtonText: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#666',
  },
  footerLink: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
  },
});
