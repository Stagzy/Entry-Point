/**
 * Google Authentication Service
 * 
 * Handles Google Sign-In integration with proper error handling
 * and user data extraction for the Entry Point platform.
 */

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

class GoogleAuthService {
  constructor() {
    this.isConfigured = false;
  }

  /**
   * Configure Google Sign-In with the provided web client ID
   */
  async configure(webClientId) {
    try {
      if (this.isConfigured) {
        return true;
      }

      // Check if webClientId is provided and not a placeholder
      if (!webClientId || webClientId.includes('your_google_web_client_id_here') || webClientId.includes('placeholder')) {
        console.warn('⚠️ Google Web Client ID not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file');
        return false;
      }

      GoogleSignin.configure({
        webClientId: webClientId, // From Google Cloud Console
        offlineAccess: true, // If you want to access Google API on behalf of the user FROM YOUR SERVER
        hostedDomain: '', // Specifies a hosted domain restriction
        loginHint: '', // [iOS] The user's ID, or email address, to be prefilled in the authentication UI
        forceCodeForRefreshToken: true, // [Android] Related to `serverAuthCode`, read the docs link below *.
        accountName: '', // [Android] Specifies an account name on the device that should be used
        iosClientId: webClientId, // [iOS] If you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
        googleServicePlistPath: '', // [iOS] Path to GoogleService-Info.plist file, if you renamed it
        openIdSupport: false, // [iOS] Add support for OpenId features
        profileImageSize: 120, // [iOS] The desired height (and width) of the profile image URL
      });

      this.isConfigured = true;
      console.log('✅ Google Sign-In configured successfully');
      return true;
    } catch (error) {
      console.error('❌ Google Sign-In configuration failed:', error);
      return false;
    }
  }

  /**
   * Check if Google Play Services are available (Android only)
   */
  async isPlayServicesAvailable() {
    if (Platform.OS !== 'android') {
      return true; // iOS doesn't need Play Services
    }

    try {
      await GoogleSignin.hasPlayServices();
      return true;
    } catch (error) {
      console.error('Google Play Services not available:', error);
      return false;
    }
  }

  /**
   * Sign in with Google
   * Returns user data or error information
   */
  async signIn() {
    try {
      // Check if configuration is done
      if (!this.isConfigured) {
        throw new Error('Google Sign-In not configured. Please set up Google credentials.');
      }

      // Check Play Services availability on Android
      const playServicesAvailable = await this.isPlayServicesAvailable();
      if (!playServicesAvailable) {
        throw new Error('Google Play Services are not available on this device');
      }

      // Check if user is already signed in
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        // Get current user info
        const userInfo = await GoogleSignin.getCurrentUser();
        if (userInfo) {
          return {
            success: true,
            userData: this.extractUserData(userInfo),
            userInfo,
          };
        }
      }

      // Perform sign in
      const userInfo = await GoogleSignin.signIn();
      const userData = this.extractUserData(userInfo);
      
      return {
        success: true,
        userData,
        userInfo,
      };
      
    } catch (error) {
      console.error('Google Sign-In error:', error);
      
      // Handle specific Google Sign-In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return {
          success: false,
          error: 'User cancelled Google Sign-In',
          cancelled: true,
        };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return {
          success: false,
          error: 'Google Sign-In already in progress',
          cancelled: false,
        };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: 'Google Play Services not available',
          cancelled: false,
        };
      }
      
      return {
        success: false,
        error: error.message || 'Google Sign-In failed',
        cancelled: false,
      };
    }
  }

  /**
   * Extract and format user data from Google user info
   */
  extractUserData(userInfo) {
    const user = userInfo.user;
    
    return {
      googleUserId: user.id,
      email: user.email,
      fullName: user.name,
      firstName: user.givenName,
      lastName: user.familyName,
      username: this.generateUsername(user.name, user.email),
      avatarUrl: user.photo,
      isVerified: user.emailVerified || false,
      trustTier: 'Silver', // Google users get Silver tier by default
      provider: 'google',
      serverAuthCode: userInfo.serverAuthCode,
      idToken: userInfo.idToken,
    };
  }

  /**
   * Generate a username from name and email
   */
  generateUsername(name, email) {
    if (name) {
      // Remove spaces and special characters, make lowercase
      return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }
    
    // Fallback to email prefix
    return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  /**
   * Handle the authentication result and integrate with app's auth system
   */
  async handleAuthResult(authResult, authService) {
    if (!authResult.success) {
      return authResult;
    }

    try {
      const { userData } = authResult;
      
      // Try to sign in existing user first
      const existingUserResult = await authService.signInWithGoogle(userData);
      
      if (existingUserResult.data?.user) {
        return {
          success: true,
          user: existingUserResult.data.user,
          isNewUser: false,
        };
      }
      
      // If user doesn't exist, create new account
      const newUserResult = await authService.signUpWithGoogle(userData);
      
      if (newUserResult.data?.user) {
        return {
          success: true,
          user: newUserResult.data.user,
          isNewUser: true,
        };
      }
      
      throw new Error('Failed to create or sign in user');
      
    } catch (error) {
      console.error('Error handling Google auth result:', error);
      return {
        success: false,
        error: error.message || 'Failed to process Google Sign-In',
      };
    }
  }

  /**
   * Handle Google authentication result with Supabase
   */
  async handleAuthResult(authResult, authService) {
    try {
      const { userData } = authResult;
      
      // Try to sign in existing user with Google
      const signInResult = await authService.signInWithGoogle(userData.idToken, userData.accessToken);
      
      if (signInResult.data?.user && !signInResult.error) {
        return {
          success: true,
          user: signInResult.data.user,
          isNewUser: false,
        };
      }
      
      // If user doesn't exist, create new account
      const newUserResult = await authService.signUpWithGoogle(userData);
      
      if (newUserResult.data?.user) {
        return {
          success: true,
          user: newUserResult.data.user,
          isNewUser: true,
        };
      }
      
      throw new Error('Failed to create or sign in user');
      
    } catch (error) {
      console.error('Error handling Google auth result:', error);
      return {
        success: false,
        error: error.message || 'Failed to process Google Sign-In',
      };
    }
  }

  /**
   * Sign out from Google
   */
  async signOut() {
    try {
      await GoogleSignin.signOut();
      return {
        success: true,
        message: 'Signed out from Google successfully',
      };
    } catch (error) {
      console.error('Google sign out error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign out from Google',
      };
    }
  }

  /**
   * Revoke access (disconnect the app from Google account)
   */
  async revokeAccess() {
    try {
      await GoogleSignin.revokeAccess();
      return {
        success: true,
        message: 'Google access revoked successfully',
      };
    } catch (error) {
      console.error('Google revoke access error:', error);
      return {
        success: false,
        error: error.message || 'Failed to revoke Google access',
      };
    }
  }

  /**
   * Get current user info if signed in
   */
  async getCurrentUser() {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (!isSignedIn) {
        return null;
      }

      const userInfo = await GoogleSignin.getCurrentUser();
      return userInfo ? this.extractUserData(userInfo) : null;
    } catch (error) {
      console.error('Error getting current Google user:', error);
      return null;
    }
  }
}

export default new GoogleAuthService();
