/**
 * Apple Authentication Service
 * 
 * Handles Apple Sign-In integration with proper error handling
 * and user data extraction for the Entry Point platform.
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

class AppleAuthService {
  /**
   * Check if Apple Sign-In is available on the current device
   */
  async isAvailable() {
    if (Platform.OS !== 'ios') {
      return false;
    }
    
    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch (error) {
      console.error('Error checking Apple Sign-In availability:', error);
      return false;
    }
  }

  /**
   * Sign in with Apple
   * Returns user data or throws error
   */
  async signIn() {
    try {
      const available = await this.isAvailable();
      if (!available) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Extract user data from Apple response
      const userData = this.extractUserData(credential);
      
      return {
        success: true,
        userData,
        credential,
      };
      
    } catch (error) {
      console.error('Apple Sign-In error:', error);
      
      // Handle specific Apple Sign-In errors
      if (error.code === 'ERR_CANCELED') {
        return {
          success: false,
          error: 'User canceled Apple Sign-In',
          cancelled: true,
        };
      }
      
      return {
        success: false,
        error: error.message || 'Apple Sign-In failed',
        cancelled: false,
      };
    }
  }

  /**
   * Extract and format user data from Apple credential
   */
  extractUserData(credential) {
    const { user, email, fullName, identityToken, authorizationCode } = credential;
    
    // Construct full name from Apple's name components
    let displayName = '';
    if (fullName) {
      const { givenName, familyName } = fullName;
      if (givenName || familyName) {
        displayName = `${givenName || ''} ${familyName || ''}`.trim();
      }
    }
    
    // Generate username from email or use Apple user ID
    let username = '';
    if (email) {
      username = email.split('@')[0].toLowerCase();
    } else {
      username = `apple_user_${user.substring(0, 8)}`;
    }
    
    return {
      appleUserId: user,
      email: email || null,
      fullName: displayName || null,
      firstName: fullName?.givenName || null,
      lastName: fullName?.familyName || null,
      username: username,
      identityToken,
      authorizationCode,
      // For Entry Point specific fields
      isVerified: true, // Apple users are considered verified
      trustTier: 'gold', // Give Apple users gold tier
      provider: 'apple',
    };
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
      const existingUserResult = await authService.signInWithApple(userData);
      
      if (existingUserResult.data?.user) {
        return {
          success: true,
          user: existingUserResult.data.user,
          isNewUser: false,
        };
      }
      
      // If user doesn't exist, create new account
      const newUserResult = await authService.signUpWithApple(userData);
      
      if (newUserResult.data?.user) {
        return {
          success: true,
          user: newUserResult.data.user,
          isNewUser: true,
        };
      }
      
      throw new Error('Failed to create or sign in user');
      
    } catch (error) {
      console.error('Error handling Apple auth result:', error);
      return {
        success: false,
        error: error.message || 'Failed to process Apple Sign-In',
      };
    }
  }

  /**
   * Sign out (Apple doesn't provide a sign out method)
   */
  async signOut() {
    // Apple doesn't provide a programmatic sign out
    // The user must sign out from device settings
    return {
      success: true,
      message: 'To fully sign out of Apple, go to Settings > Apple ID > Sign Out',
    };
  }
}

export default new AppleAuthService();
