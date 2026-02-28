import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileAvatar({ 
  user, 
  size = 80, 
  showVerificationBadge = true, 
  showTrustBorder = true,
  showTrustBadge = true,
  showAdminRing = true,
  getTrustTierInfo
}) {
  const badgeSize = size * 0.22;
  
  // Ensure user object exists and has default values
  const safeUser = user || {};
  const userAvatar = safeUser.avatar_url || safeUser.avatar;
  const userTrustTier = safeUser.trust_tier || safeUser.trustTier;
  const userIsVerified = safeUser.is_verified || safeUser.isVerified;
  const userIsCreator = safeUser.is_creator || safeUser.isCreator;
  const userIsAdmin = safeUser.is_admin || safeUser.isAdmin;
  
  return (
    <View style={[styles.avatarContainer, { width: size, height: size }]}>
      {/* Admin Ring - outer ring for admins */}
      {showAdminRing && userIsAdmin && (
        <View style={[
          styles.adminRing,
          {
            width: size + 6,
            height: size + 6,
            borderRadius: (size + 6) / 2,
          }
        ]} />
      )}
      
      {userAvatar ? (
        <Image 
          source={{ uri: userAvatar }} 
          style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} 
        />
      ) : (
        <View style={[
          styles.avatarPlaceholder, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2 
          }
        ]}>
          <Ionicons name="person" size={size * 0.5} color="#fff" />
        </View>
      )}
      
      {/* Trust Level Badge (bottom-right area, below verification badge) */}
      {showTrustBadge && getTrustTierInfo && userTrustTier && userTrustTier !== 'none' && (
        <View style={[
          styles.trustBadge, 
          { 
            width: badgeSize, 
            height: badgeSize, 
            borderRadius: badgeSize / 2,
            backgroundColor: getTrustTierInfo(userTrustTier).color,
            bottom: -badgeSize * 0.55, // Just a tiny bit back up
            right: badgeSize * 0.9, // Just a tiny bit back to the right
          }
        ]}>
          <Ionicons 
            name={getTrustTierInfo(userTrustTier).icon} 
            size={badgeSize * 0.6} 
            color="#fff" 
          />
        </View>
      )}
      
      {/* Verification Badge (bottom right, rightmost) */}
      {showVerificationBadge && userIsCreator && userIsVerified && (
        <View style={[
          styles.verificationBadge, 
          { 
            width: badgeSize, 
            height: badgeSize, 
            borderRadius: badgeSize / 2,
            bottom: 0,
            right: 0,
          }
        ]}>
          <Ionicons name="checkmark" size={badgeSize * 0.6} color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FF3B30', // Red ring for admins
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  avatar: {
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationBadge: {
    position: 'absolute',
    backgroundColor: '#007AFF', // Blue for verified (instead of green)
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  trustBadge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
