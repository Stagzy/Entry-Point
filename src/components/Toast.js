import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const Toast = ({ 
  visible, 
  message, 
  type = 'success', // 'success', 'error', 'info', 'warning'
  duration = 3000,
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const lastHapticTime = useRef(0);

  useEffect(() => {
    if (visible) {
      // Haptic feedback with debouncing (prevent rapid haptics)
      const now = Date.now();
      if (now - lastHapticTime.current > 100) { // 100ms minimum between haptics
        lastHapticTime.current = now;
        try {
          if (type === 'success') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else if (type === 'error') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        } catch (error) {
          // Haptics not available
          console.log('Haptics not available:', error);
        }
      }

      // Show animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    } else {
      // Reset animations when not visible
      translateY.setValue(-100);
      opacity.setValue(0);
    }
  }, [visible, duration, hideToast]);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  }, [translateY, opacity, onHide]);

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          colors: ['#4CAF50', '#45a049'],
          icon: 'checkmark-circle',
          shadowColor: '#4CAF50',
        };
      case 'error':
        return {
          colors: ['#F44336', '#d32f2f'],
          icon: 'close-circle',
          shadowColor: '#F44336',
        };
      case 'warning':
        return {
          colors: ['#FF9800', '#f57c00'],
          icon: 'warning',
          shadowColor: '#FF9800',
        };
      case 'info':
      default:
        return {
          colors: ['#2196F3', '#1976d2'],
          icon: 'information-circle',
          shadowColor: '#2196F3',
        };
    }
  };

  const config = getToastConfig();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hideToast}
        style={[styles.toastShadow, { shadowColor: config.shadowColor }]}
      >
        <LinearGradient
          colors={config.colors}
          style={styles.toast}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={config.icon} size={24} color="white" />
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
          <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
            <Ionicons name="close" size={18} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toastShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 60,
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
});

export default Toast;
