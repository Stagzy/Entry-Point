import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileAvatar from './ProfileAvatar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Winner Announcement Modal
 * Shows animated winner celebration with confetti-like effects
 */
export default function WinnerAnnouncement({ winner, isVisible, onClose }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [confettiAnims] = useState(
    Array.from({ length: 20 }, () => ({
      translateY: new Animated.Value(-50),
      translateX: new Animated.Value(Math.random() * screenWidth),
      rotate: new Animated.Value(0),
    }))
  );

  useEffect(() => {
    if (isVisible && winner) {
      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Start confetti animation
      const confettiAnimations = confettiAnims.map((anim, index) => 
        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: screenHeight + 100,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 360 * (2 + Math.random() * 3),
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      );

      Animated.stagger(100, confettiAnimations).start();

      // Auto close after 8 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 8000);

      return () => clearTimeout(timer);
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      confettiAnims.forEach(anim => {
        anim.translateY.setValue(-50);
        anim.rotate.setValue(0);
      });
    }
  }, [isVisible, winner]);

  if (!winner) return null;

  const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        {confettiAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: confettiColors[index % confettiColors.length],
                transform: [
                  { translateX: anim.translateX },
                  { translateY: anim.translateY },
                  {
                    rotate: anim.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}

        {/* Winner Card */}
        <Animated.View
          style={[
            styles.winnerCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.cardGradient}
          >
            {/* Trophy Icon */}
            <View style={styles.trophyContainer}>
              <Ionicons name="trophy" size={60} color="#FFD700" />
            </View>

            {/* Winner Info */}
            <View style={styles.winnerInfo}>
              <Text style={styles.congratsText}>🎉 WINNER! 🎉</Text>
              
              <ProfileAvatar 
                user={winner.user} 
                size={80}
                style={styles.winnerAvatar}
              />
              
              <Text style={styles.winnerName}>
                {winner.user?.display_name || winner.user?.username || 'Winner'}
              </Text>
              
              <View style={styles.prizeContainer}>
                <Text style={styles.wonText}>Won:</Text>
                <Text style={styles.prizeText}>{winner.giveaway?.prize}</Text>
              </View>

              <View style={styles.giveawayInfo}>
                <Text style={styles.giveawayTitle}>{winner.giveaway?.title}</Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Winner Notification Toast
 * Smaller notification for recent winners
 */
export function WinnerToast({ winner, isVisible, onClose }) {
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (isVisible) {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(4000),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onClose());
    }
  }, [isVisible]);

  if (!winner) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.toastGradient}
      >
        <Ionicons name="trophy" size={20} color="#FFD700" />
        <View style={styles.toastContent}>
          <Text style={styles.toastTitle}>New Winner!</Text>
          <Text style={styles.toastText}>
            {winner.user?.username} won {winner.giveaway?.title}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={16} color="white" />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  winnerCard: {
    width: screenWidth * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    padding: 30,
    alignItems: 'center',
  },
  trophyContainer: {
    marginBottom: 20,
  },
  winnerInfo: {
    alignItems: 'center',
    width: '100%',
  },
  congratsText: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  winnerAvatar: {
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'white',
  },
  winnerName: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  prizeContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  wonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 5,
  },
  prizeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
  },
  giveawayInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginTop: 10,
  },
  giveawayTitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  // Toast Styles
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  toastContent: {
    flex: 1,
    marginLeft: 10,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  toastText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
});
