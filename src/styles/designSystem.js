// Design System - Consistent styling across all screens
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const colors = {
  // Primary colors
  primary: '#667eea',
  primaryDark: '#5a6fd8',
  primaryLight: '#f0f4ff',
  
  // Accent colors
  accent: '#764ba2', // Added missing accent color
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Background colors
  background: '#f8f9fa',
  backgroundPrimary: '#f8f9fa', // Added missing backgroundPrimary
  backgroundSecondary: '#ffffff', // Added missing backgroundSecondary
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  
  // Dark mode specific colors
  dark: {
    background: '#000000',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    border: '#38383A',
    textPrimary: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
  },
  
  // Text colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#ffffff',
  
  // Border colors
  border: '#f0f0f0',
  borderLight: '#f5f5f5',
  borderDark: '#e0e0e0',
  
  // Category colors
  tech: '#2196F3',
  gaming: '#FF6B35',
  lifestyle: '#E91E63',
  cash: '#4CAF50',
};

export const gradients = {
  primary: ['#667eea', '#764ba2'],
  tech: ['#4facfe', '#00f2fe'],
  gaming: ['#fa709a', '#fee140'],
  lifestyle: ['#a8edea', '#fed6e3'],
  cash: ['#d299c2', '#fef9d7'],
  surface: ['#ffffff', '#f8f9fa'],
  cardBackground: ['#ffffff', '#f8f9fa'], // Added missing cardBackground gradient
  
  // Dark mode gradients
  dark: {
    primary: ['#0A84FF', '#5E5CE6'],
    surface: ['#1C1C1E', '#2C2C2E'],
    hero: ['#1a1a1a', '#2a2a2a', '#1e3a5f'],
    cardBackground: ['#1C1C1E', '#2C2C2E'],
    accent: ['#0A84FF', '#1e3a5f'],
  },
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 25,
  full: 50,
};

export const typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  
  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textPrimary,
  },
  bodySecondary: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary,
  },
  
  // Small text
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.textTertiary,
  },
  
  // Button text
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
};

// Common component styles
export const commonStyles = {
  // Tab container (like Activity screen)
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    margin: 0, // Remove margin completely
    padding: 1, // Even tighter - reduce from 2 to 1
    alignSelf: 'flex-start', // Change from center to flex-start to prevent stretching
    maxWidth: '100%', // Prevent stretching beyond screen
    ...shadows.medium,
  },
  
  // Individual tab
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6, // Back to 6 for better height
    paddingHorizontal: 10, // Back to 10 for better width
    borderRadius: borderRadius.xxl, // Keep xxl to match container
    position: 'relative',
    minWidth: 0, // Allow shrinking
    flexShrink: 1, // Allow shrinking to fit content
  },
  
  // Active tab
  activeTab: {
    backgroundColor: colors.primary,
  },
  
  // Tab text
  tabText: {
    fontSize: 11, // Further reduced from 12
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 3, // Further reduced from 4
  },
  
  // Active tab text
  activeTabText: {
    color: colors.textInverse,
  },
  
  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  
  // Search input
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    ...shadows.small,
  },
  
  // Button primary
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  
  // Button secondary
  buttonSecondary: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.xl,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  
  // Badge
  badge: {
    position: 'absolute',
    top: -2,
    right: 8,
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textInverse,
  },
};

// Screen dimensions
export const layout = {
  window: {
    width,
    height: Dimensions.get('window').height,
  },
  screen: {
    width: Dimensions.get('screen').width,
    height: Dimensions.get('screen').height,
  },
  isSmallDevice: width < 375,
  isLargeDevice: width >= 414,
};
