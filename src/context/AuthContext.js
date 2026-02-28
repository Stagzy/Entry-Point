import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService } from '../services/api';
import { Alert } from 'react-native';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    
    // Only set up auth listener if using real Supabase
    if (authService.onAuthStateChange) {
      try {
        const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
            await loadUserProfile(session.user.id);
            setIsAuthenticated(true);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setUserProfile(null);
            setIsAuthenticated(false);
          }
          setIsLoading(false);
        });

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch (error) {
        console.log('Using mock auth - Supabase not configured');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { user, error } = await authService.getCurrentUser();
      if (user && !error) {
        setUser(user);
        await loadUserProfile(user.id);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      console.log('👤 Loading user profile for:', userId);
      const { data: profile, error } = await userService.getUserProfile(userId);
      
      if (profile && !error) {
        console.log('✅ Profile loaded successfully');
        setUserProfile(profile);
      } else if (error) {
        console.log('⚠️ Profile not found, may need to create one:', error.message);
        // For new users, we might need to create a profile
        // This would happen after registration
      } else {
        console.log('⚠️ No profile data returned');
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      
      // First, try real Supabase authentication
      console.log('🔐 Attempting real authentication for:', email);
      const realAuthResult = await signInWithEmail(email, password);
      
      if (realAuthResult.user && !realAuthResult.error) {
        console.log('✅ Real authentication successful');
        return realAuthResult;
      }
      
      console.log('⚠️ Real auth failed, checking demo accounts...', realAuthResult.error?.message);
      
      // Fall back to demo accounts for development/testing
      // NOTE: Demo accounts should only be used for development.
      // For production, ensure Supabase is properly configured.
      if (false) { // Demo accounts disabled - configure SUPABASE credentials instead
        console.log('🎭 Demo account login disabled');
        const demoUser = {
          id: 'DEMO_ID_DISABLED',
          email: 'demo@example.com',
          user_metadata: {
            name: 'Demo User',
            username: 'demo_user',
          },
          isVerified: true,
          trustTier: 'diamond',
        };
        
        const demoProfile = {
          id: 'DEMO_ID_DISABLED',
          name: 'Demo User',
          username: 'demo_user',
          email: 'demo@example.com',
          avatar_url: null,
          is_creator: true,
          is_admin: true,
          is_verified: true,
          trust_tier: 'diamond',
          followers_count: 0,
          following_count: 0,
          stats: {
            giveawaysCreated: 0,
            giveawaysWon: 0,
            totalTicketsPurchased: 0,
            followersGained: 0,
          },
          privacy_settings: {
            allowSearchDiscovery: true,
            shareWinPublicly: true,
            showFollowersList: true,
            showFollowingList: true,
            allowProfileViewing: true,
          },
        };
        
        setUser(demoUser);
        setUserProfile(demoProfile);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { user: demoUser, error: null };
      }
      
      // Apple demo login - Verified user
      if (email === 'verified@apple.demo' && password === 'password') {
        const appleUser = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'verified@apple.demo',
          user_metadata: {
            name: 'Apple User',
            username: 'AppleUser',
          },
          isVerified: true,
          trustTier: 'gold',
        };
        
        const appleProfile = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Apple User',
          username: 'AppleUser',
          email: 'verified@apple.demo',
          avatar_url: null,
          is_creator: false,
          is_admin: false,
          is_verified: true,
          trust_tier: 'gold',
          followers_count: 450,
          following_count: 123,
          stats: {
            giveawaysCreated: 0,
            giveawaysWon: 0,
            totalTicketsPurchased: 0,
            followersGained: 0,
          },
          privacy_settings: {
            allowSearchDiscovery: true,
            shareWinPublicly: true,
            showFollowersList: true,
            showFollowingList: true,
            allowProfileViewing: true,
          },
        };
        
        setUser(appleUser);
        setUserProfile(appleProfile);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { user: appleUser, error: null };
      }
      
      // Google demo login - Unverified user
      if (email === 'unverified@google.demo' && password === 'password') {
        const googleUser = {
          id: 'google_demo_user',
          email: 'unverified@google.demo',
          user_metadata: {
            name: 'Google User',
            username: 'GoogleUser',
          },
          isVerified: false,
          trustTier: 'bronze',
        };
        
        const googleProfile = {
          id: 'google_demo_user',
          name: 'Google User',
          username: 'GoogleUser',
          email: 'unverified@google.demo',
          avatar_url: null,
          is_creator: false,
          is_admin: false,
          is_verified: false,
          trust_tier: 'bronze',
          followers_count: 23,
          following_count: 89,
          stats: {
            giveawaysCreated: 0,
            giveawaysWon: 0,
            totalTicketsPurchased: 0,
            followersGained: 0,
          },
          privacy_settings: {
            allowSearchDiscovery: true,
            shareWinPublicly: false,
            showFollowersList: false,
            showFollowingList: true,
            allowProfileViewing: true,
          },
        };
        
        setUser(googleUser);
        setUserProfile(googleProfile);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { user: googleUser, error: null };
      }
      
      // For any other credentials in mock mode, show a helpful message
      setIsLoading(false);
      return { 
        user: null, 
        error: { 
          message: 'Authentication failed. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are configured in your environment variables. For OAuth logins (Apple, Google), ensure they are properly set up with your credentials.' 
        } 
      };
      
    } catch (error) {
      setIsLoading(false);
      console.error('Login failed:', error);
      return { user: null, error };
    }
  };

  // Real user registration with Supabase
  const register = async (email, password, metadata = {}) => {
    try {
      setIsLoading(true);
      console.log('🔐 Registering new user...');
      
      const result = await authService.signUp(email, password, metadata);
      
      if (result.error) {
        console.error('❌ Registration failed:', result.error.message);
        return { user: null, error: result.error };
      }
      
      if (result.data?.user) {
        console.log('✅ Registration successful');
        
        // Check if user needs email confirmation
        if (!result.data.session) {
          Alert.alert(
            'Check Your Email',
            'We sent you a confirmation link. Please check your email and click the link to verify your account.',
            [{ text: 'OK' }]
          );
        }
        
        return { user: result.data.user, error: null };
      }
      
      return { user: null, error: { message: 'Registration failed' } };
    } catch (error) {
      console.error('Registration error:', error);
      return { user: null, error: { message: error.message || 'Registration failed' } };
    } finally {
      setIsLoading(false);
    }
  };

  // Real authentication with Supabase (prioritizes real auth, falls back to demo)
  const signInWithEmail = async (email, password) => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting real authentication...');
      
      const result = await authService.signIn(email, password);
      
      if (result.data?.user && !result.error) {
        console.log('✅ Real authentication successful');
        setUser(result.data.user);
        
        // Load user profile
        const profileResult = await userService.getUserProfile(result.data.user.id);
        if (profileResult.data) {
          setUserProfile(profileResult.data);
        }
        
        setIsAuthenticated(true);
        return { user: result.data.user, error: null };
      }
      
      console.log('❌ Real authentication failed:', result.error?.message);
      return { user: null, error: result.error || { message: 'Authentication failed' } };
      
    } catch (error) {
      console.error('Authentication error:', error);
      return { user: null, error: { message: error.message || 'Authentication failed' } };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      
      // For mock mode, manually clear state since there's no auth listener
      if (!authService.onAuthStateChange) {
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
        console.log('✅ Mock logout - state cleared');
      }
      // For real Supabase, state will be cleared via the auth state change listener
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) return { data: null, error: 'No user found' };
      
      // Handle demo admin account
      if (user.id === '550e8400-e29b-41d4-a716-446655440000') {
        const updatedProfile = { ...userProfile, ...updates };
        setUserProfile(updatedProfile);
        return { data: updatedProfile, error: null };
      }
      
      const { data, error } = await userService.updateUserProfile(user.id, updates);
      
      if (data && !error) {
        setUserProfile(data);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Profile update failed:', error);
      return { data: null, error };
    }
  };

  // Apple Sign-In integration
  const signInWithApple = async () => {
    try {
      setIsLoading(true);
      console.log('🍎 Starting Apple Sign-In...');
      
      // Check if we're in development mode or on non-iOS platform
      try {
        const appleAuth = await import('expo-apple-authentication');
        const isAvailable = await appleAuth.isAvailableAsync();
        if (!isAvailable) {
          console.warn('⚠️ Apple Sign-In not available - falling back to demo mode');
          throw new Error('Not available');
        }
        console.log('✅ Apple Sign-In available');
      } catch (moduleError) {
        console.warn('⚠️ Apple Sign-In not available - falling back to demo mode');
        // Fallback for development or non-iOS platforms
        const demoUser = {
          id: 'apple_demo_user_' + Date.now(),
          email: 'demo@icloud.com',
          user_metadata: {
            name: 'Apple Demo User',
            username: 'AppleDemo',
            picture: null,
          },
        };
        
        const demoProfile = {
          id: demoUser.id,
          name: 'Apple Demo User',
          username: 'AppleDemo',
          email: 'demo@icloud.com',
          avatar_url: null,
          is_creator: false,
          is_admin: false,
          is_verified: true, // Apple users are typically more verified
          trust_tier: 'silver',
          followers_count: 0,
          following_count: 0,
          stats: {
            giveawaysCreated: 0,
            giveawaysWon: 0,
            totalTicketsPurchased: 0,
            followersGained: 0,
          },
        };
        
        setUser(demoUser);
        setUserProfile(demoProfile);
        setIsAuthenticated(true);
        
        return {
          user: demoUser,
          error: null,
          isDemoMode: true
        };
      }
      
      // Import Apple auth service dynamically (iOS only)
      const appleAuthService = await import('../services/appleAuthService');
      
      // Check if Apple Sign-In is available
      const isAvailable = await appleAuthService.default.isAvailable();
      if (!isAvailable) {
        return {
          user: null,
          error: { message: 'Apple Sign-In is not available on this device' }
        };
      }
      
      // Perform Apple Sign-In
      const authResult = await appleAuthService.default.signIn();
      
      if (!authResult.success) {
        if (authResult.cancelled) {
          return {
            user: null,
            error: { message: 'Apple Sign-In was cancelled', cancelled: true }
          };
        }
        return {
          user: null,
          error: { message: authResult.error }
        };
      }
      
      // Handle the authentication result
      const handleResult = await appleAuthService.default.handleAuthResult(authResult, authService);
      
      if (handleResult.success) {
        const { user: authenticatedUser, isNewUser } = handleResult;
        
        setUser(authenticatedUser);
        
        // Load or create user profile
        if (isNewUser) {
          // Create profile for new Apple user
          const profileData = {
            id: authenticatedUser.id,
            name: authResult.userData.fullName || authResult.userData.username,
            username: authResult.userData.username,
            email: authenticatedUser.email,
            avatar_url: null,
            is_creator: false,
            is_admin: false,
            is_verified: authResult.userData.isVerified,
            trust_tier: authResult.userData.trustTier,
          };
          
          setUserProfile(profileData);
        } else {
          // Load existing profile
          await loadUserProfile(authenticatedUser.id);
        }
        
        setIsAuthenticated(true);
        
        return {
          user: authenticatedUser,
          error: null,
          isNewUser
        };
      }
      
      return {
        user: null,
        error: { message: handleResult.error }
      };
      
    } catch (error) {
      console.error('Apple Sign-In error:', error);
      return {
        user: null,
        error: { message: error.message || 'Apple Sign-In failed' }
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In integration
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      console.log('🌐 Starting Google Sign-In...');
      
      // Check if we're in development mode without native support
      try {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        console.log('✅ Native Google Sign-In available');
      } catch (moduleError) {
        console.warn('⚠️ Native Google Sign-In not available - falling back to demo mode');
        // Fallback for development in Expo Go
        const demoUser = {
          id: 'google_demo_user_' + Date.now(),
          email: 'demo@google.com',
          user_metadata: {
            name: 'Google Demo User',
            username: 'GoogleDemo',
            picture: null,
          },
        };
        
        const demoProfile = {
          id: demoUser.id,
          name: 'Google Demo User',
          username: 'GoogleDemo',
          email: 'demo@google.com',
          avatar_url: null,
          is_creator: false,
          is_admin: false,
          is_verified: false,
          trust_tier: 'bronze',
          followers_count: 0,
          following_count: 0,
          stats: {
            giveawaysCreated: 0,
            giveawaysWon: 0,
            totalTicketsPurchased: 0,
            followersGained: 0,
          },
        };
        
        setUser(demoUser);
        setUserProfile(demoProfile);
        setIsAuthenticated(true);
        
        return {
          user: demoUser,
          error: null,
          isDemoMode: true
        };
      }
      
      // Check if Google Web Client ID is configured
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      console.log('🔍 Google Client ID configured:', !!webClientId && !webClientId.includes('your_google_web_client_id_here'));
      console.log('🔍 Raw Google Client ID:', webClientId?.substring(0, 20) + '...');
      
      // CLEAR ANY EXISTING SESSION FIRST
      console.log('🧹 Clearing any existing session...');
      await authService.signOut();
      
      if (!webClientId || 
          webClientId.includes('your_google_web_client_id_here') || 
          webClientId.includes('placeholder') ||
          webClientId.includes('YOUR_REAL_GOOGLE_CLIENT_ID_HERE')) {
        
        console.error('❌ Google Web Client ID not properly configured:', {
          exists: !!webClientId,
          value: webClientId?.substring(0, 20) + '...',
          isPlaceholder: webClientId?.includes('your_google_web_client_id_here')
        });
        
        return {
          user: null,
          error: { 
            message: 'Google Sign-In not configured. Please add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your environment variables.' 
          }
        };
      }
      
      // Import Google auth service
      const googleAuthService = await import('../services/googleAuthService');
      
      // Configure Google Sign-In with the web client ID
      const configResult = await googleAuthService.default.configure(webClientId);
      if (!configResult) {
        return {
          user: null,
          error: { message: 'Failed to configure Google Sign-In' }
        };
      }
      
      // Perform Google Sign-In
      const authResult = await googleAuthService.default.signIn();
      
      if (!authResult.success) {
        if (authResult.cancelled) {
          return {
            user: null,
            error: { message: 'Google Sign-In was cancelled', cancelled: true }
          };
        }
        return {
          user: null,
          error: { message: authResult.error }
        };
      }
      
      // Handle the authentication result with Supabase
      const handleResult = await googleAuthService.default.handleAuthResult(authResult, authService);
      
      if (handleResult.success) {
        const { user: authenticatedUser, isNewUser } = handleResult;
        
        setUser(authenticatedUser);
        
        // Load or create user profile
        if (isNewUser) {
          // Create profile for new Google user
          const profileData = {
            id: authenticatedUser.id,
            username: authResult.userData.username,
            full_name: authResult.userData.fullName,
            email: authenticatedUser.email,
            avatar_url: authResult.userData.photoURL,
            is_creator: false,
            is_verified: authResult.userData.emailVerified || false,
            bio: null,
          };
          
          const { data: newProfile, error: profileError } = await userService.createUserProfile(profileData);
          
          if (profileError) {
            console.error('Failed to create user profile:', profileError);
            return {
              user: null,
              error: { message: 'Failed to create user profile' }
            };
          }
          
          setUserProfile(newProfile);
        } else {
          // Load existing profile
          await loadUserProfile(authenticatedUser.id);
        }
        
        setIsAuthenticated(true);
        
        return {
          user: authenticatedUser,
          error: null,
          isNewUser
        };
      }
      
      return {
        user: null,
        error: { message: handleResult.error }
      };
      
    } catch (error) {
      console.error('Google Sign-In error:', error);
      return {
        user: null,
        error: { message: error.message || 'Google Sign-In failed' }
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function for trust tier info (for demo purposes)
      
      // Configure Google Sign-In
  // Helper function for trust tier info (for demo purposes)
  const getTrustTierInfo = (tier) => {
    switch (tier) {
      case 'bronze':
        return { 
          color: '#CD7F32', 
          label: 'Bronze', 
          name: 'Bronze',
          icon: 'medal',
          requirements: 'New users start here',
          privileges: {
            maxGiveawaysPerMonth: 1,
            maxGiveawayValue: 100,
            requiresApproval: true,
            canCreatePaidGiveaways: false,
            prioritySupport: false,
            customization: false,
            analytics: false,
          }
        };
      case 'silver':
        return { 
          color: '#C0C0C0', 
          label: 'Silver', 
          name: 'Silver',
          icon: 'medal',
          requirements: '5+ successful giveaways, verified identity',
          privileges: {
            maxGiveawaysPerMonth: 3,
            maxGiveawayValue: 500,
            requiresApproval: true,
            canCreatePaidGiveaways: true,
            prioritySupport: false,
            customization: true,
            analytics: true,
          }
        };
      case 'gold':
        return { 
          color: '#FFD700', 
          label: 'Gold', 
          name: 'Gold',
          icon: 'medal',
          requirements: '25+ successful giveaways, 1000+ followers',
          privileges: {
            maxGiveawaysPerMonth: 10,
            maxGiveawayValue: 2000,
            requiresApproval: false,
            canCreatePaidGiveaways: true,
            prioritySupport: true,
            customization: true,
            analytics: true,
          }
        };
      case 'platinum':
        return { 
          color: '#E5E4E2', 
          label: 'Platinum', 
          name: 'Platinum',
          icon: 'diamond',
          requirements: '100+ successful giveaways, 10K+ followers',
          privileges: {
            maxGiveawaysPerMonth: -1,
            maxGiveawayValue: -1,
            requiresApproval: false,
            canCreatePaidGiveaways: true,
            prioritySupport: true,
            customization: true,
            analytics: true,
          }
        };
      case 'diamond':
        return { 
          color: '#B9F2FF', 
          label: 'Diamond', 
          name: 'Diamond',
          icon: 'diamond',
          requirements: 'Invite only - top creators and partners',
          privileges: {
            maxGiveawaysPerMonth: -1,
            maxGiveawayValue: -1,
            requiresApproval: false,
            canCreatePaidGiveaways: true,
            prioritySupport: true,
            customization: true,
            analytics: true,
          }
        };
      default:
        return { 
          color: '#CD7F32', 
          label: 'Bronze', 
          name: 'Bronze',
          icon: 'medal',
          requirements: 'New users start here',
          privileges: {
            maxGiveawaysPerMonth: 1,
            maxGiveawayValue: 100,
            requiresApproval: true,
            canCreatePaidGiveaways: false,
            prioritySupport: false,
            customization: false,
            analytics: false,
          }
        };
    }
  };

  // Helper function for verification level info
  const getVerificationLevelInfo = (isVerified) => {
    if (isVerified) {
      return { 
        color: '#007AFF', 
        label: 'Verified', 
        icon: 'checkmark-circle',
        bgColor: '#007AFF15'
      };
    }
    return { 
      color: '#666', 
      label: 'Unverified', 
      icon: 'help-circle',
      bgColor: '#66666615'
    };
  };

  // Mock upgrade user tier function
  const upgradeUserTier = async (userId, newTier, reason) => {
    try {
      console.log('🔄 Upgrading user tier:', { userId, newTier, reason });
      
      // Try real database update first
      const { data, error } = await userService.updateUserProfile(userId, {
        trust_tier: newTier
      });
      
      if (data && !error) {
        console.log('✅ Real tier upgrade successful');
        // Update local state
        if (userProfile && userId === userProfile.id) {
          const updatedProfile = { ...userProfile, trust_tier: newTier };
          setUserProfile(updatedProfile);
        }
        return { success: true, data };
      }
      
      console.log('⚠️ Real upgrade failed, using demo mode:', error?.message);
      // Fallback to demo mode
      if (userProfile && userId === userProfile.id) {
        const updatedProfile = { ...userProfile, trust_tier: newTier };
        setUserProfile(updatedProfile);
        return { success: true };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Tier upgrade error:', error);
      return { success: false, error: error.message };
    }
  };

  // Mock functions for giveaway creation permissions
  const canCreateGiveaway = (user) => {
    // For demo purposes, always allow creation for verified users
    const isVerified = user?.isVerified || user?.is_verified || false;
    if (!isVerified) {
      return { 
        allowed: false, 
        reason: 'Account verification required',
        action: 'verify'
      };
    }
    
    return { allowed: true };
  };

  const canCreateGiveawayWithValue = (user, prizeValue) => {
    // For demo purposes, always allow for Diamond tier
    const tierInfo = getTrustTierInfo((user?.trustTier || user?.trust_tier) || 'bronze');
    if (prizeValue > tierInfo.maxGiveawayValue) {
      return {
        allowed: false,
        reason: `Prize value exceeds your tier limit of $${tierInfo.maxGiveawayValue}`,
        action: 'upgrade'
      };
    }
    
    return { allowed: true };
  };

  const value = {
    user,
    userProfile,
    isLoading,
    isAuthenticated,
    login,
    register,
    signInWithEmail,
    signInWithApple,
    signInWithGoogle,
    logout,
    updateProfile,
    checkAuthStatus,
    getTrustTierInfo,
    getVerificationLevelInfo,
    upgradeUserTier,
    canCreateGiveaway,
    canCreateGiveawayWithValue,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
