import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

const ConfettiParticle = ({ delay = 0, color = '#FF6B6B' }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Random horizontal drift
      const randomX = (Math.random() - 0.5) * 200;
      
      Animated.parallel([
        // Falling animation
        Animated.timing(translateY, {
          toValue: height + 100,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        // Horizontal drift
        Animated.timing(translateX, {
          toValue: randomX,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        // Rotation
        Animated.timing(rotate, {
          toValue: Math.random() * 720, // 0-2 full rotations
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        // Fade out towards the end
        Animated.sequence([
          Animated.delay(2000),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          })
        ])
      ]).start();
    };

    const timer = setTimeout(startAnimation, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            { 
              rotate: rotate.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })
            },
          ],
          opacity,
        },
      ]}
    />
  );
};

const ConfettiExplosion = ({ visible, onComplete }) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
  
  useEffect(() => {
    if (visible && onComplete) {
      const timer = setTimeout(onComplete, 5000); // Complete after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {Array.from({ length: 50 }, (_, index) => (
        <ConfettiParticle
          key={index}
          delay={Math.random() * 1000}
          color={colors[index % colors.length]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    left: width / 2,
    top: -50,
  },
});

export default ConfettiExplosion;
