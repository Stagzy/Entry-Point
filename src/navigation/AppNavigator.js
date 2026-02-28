import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Import screens
// Main tab screens
import HomeScreen from '../screens/main/HomeScreen';

// Giveaways tab screens
import GiveawaysScreen from '../screens/giveaways/GiveawaysScreen';
import GiveawayDetailScreen from '../screens/giveaways/GiveawayDetailScreen';
import MyGiveawaysScreen from '../screens/giveaways/MyGiveawaysScreen';
import MyEntriesScreen from '../screens/giveaways/MyEntriesScreen';

// Create tab screens
import CreatorDashboardScreen from '../screens/create/CreatorDashboardScreen';
import CreateGiveawayScreen from '../screens/create/CreateGiveawayScreen';
import CreateGiveawayWizardScreen from '../screens/create/CreateGiveawayWizardScreen';
import CreatorAnalyticsScreen from '../screens/create/CreatorAnalyticsScreen';
import WinnerSelectionScreen from '../screens/create/WinnerSelectionScreen';

// Payment screens
import TicketPurchaseScreen from '../screens/payment/TicketPurchaseScreen';
import PaymentSuccessScreen from '../screens/payment/PaymentSuccessScreen';
import PaymentMethodsScreen from '../screens/payment/PaymentMethodsScreen';
import TierUpgradeScreen from '../screens/payment/TierUpgradeScreen';

// Activity tab screens
import LiveActivityFeedScreen from '../screens/activity/LiveActivityFeedScreen';

// Profile tab screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import FollowersListScreen from '../screens/profile/FollowersListScreen';

// Auth screens (keep existing structure)
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';

// Admin screens (keep existing structure)
import AdminHubScreen from '../screens/admin/AdminHubScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import PendingGiveawaysScreen from '../screens/admin/PendingGiveawaysScreen';
import ManageUsersScreen from '../screens/admin/ManageUsersScreen';

// Miscellaneous screens
import SettingsScreen from '../screens/misc/SettingsScreen';
import ComingSoonScreen from '../screens/misc/ComingSoonScreen';
import HelpSupportScreen from '../screens/misc/HelpSupportScreen';
import VerificationRequiredScreen from '../screens/misc/VerificationRequiredScreen';
import NotificationDemoScreen from '../screens/misc/NotificationDemoScreen';
import IntegrationTestScreen from '../screens/misc/IntegrationTestScreen';
import NotificationManager from '../components/NotificationManager';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Loading screen component
function LoadingScreen() {
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#f8f9fa'
    }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

// Main tab navigator for authenticated users
function MainTabNavigator() {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Giveaways') {
            iconName = focused ? 'gift' : 'gift-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Activity') {
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size || 24} color={color || theme?.primary || '#007AFF'} />;
        },
        tabBarActiveTintColor: theme?.primary || '#007AFF',
        tabBarInactiveTintColor: theme?.textSecondary || 'gray',
        tabBarStyle: {
          backgroundColor: theme?.surface || '#ffffff',
          borderTopColor: theme?.border || '#e0e0e0',
          paddingTop: 5,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: true, // Enable headers by default
        headerStyle: {
          backgroundColor: theme?.surface || '#ffffff',
          borderBottomColor: theme?.border || '#e0e0e0',
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: theme?.text || '#000000',
        },
        headerTintColor: theme?.text || '#000000',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          headerTitle: 'Entry Point',
          headerShown: true,
        }}
      />
      <Tab.Screen 
        name="Giveaways" 
        component={GiveawaysScreen} 
        options={{ 
          headerShown: false 
        }} 
      />
      <Tab.Screen 
        name="Create" 
        component={CreatorDashboardScreen} 
        options={{ 
          headerShown: false 
        }} 
      />
      <Tab.Screen 
        name="Activity" 
        component={LiveActivityFeedScreen} 
        options={{ 
          headerShown: false 
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          headerTitle: 'Profile',
          headerShown: true,
        }}
      />
    </Tab.Navigator>
  );
}

// Main app navigator
export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Simple navigation theme with fallbacks and proper structure
  const navigationTheme = {
    dark: false,
    colors: {
      primary: theme?.primary || '#007AFF',
      background: theme?.background || '#f8f9fa',
      card: theme?.surface || '#ffffff',
      text: theme?.text || '#000000',
      border: theme?.border || '#e0e0e0',
      notification: theme?.primary || '#007AFF',
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: 'normal',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: 'bold',
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900',
      },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: '#f8f9fa' }
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen 
              name="GiveawayDetail" 
              component={GiveawayDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="TicketPurchase" 
              component={TicketPurchaseScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="PaymentSuccess" 
              component={PaymentSuccessScreen}
              options={{ headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ComingSoon" 
              component={ComingSoonScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="HelpSupport" 
              component={HelpSupportScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="PaymentMethods" 
              component={PaymentMethodsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="MyGiveaways" 
              component={MyGiveawaysScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="AdminHub" 
              component={AdminHubScreen}
              options={{ 
                headerShown: true,
                headerTitle: 'Admin Hub',
              }}
            />
            <Stack.Screen 
              name="AdminDashboard" 
              component={AdminDashboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="PendingGiveaways" 
              component={PendingGiveawaysScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ManageUsers" 
              component={ManageUsersScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CreatorAnalytics" 
              component={CreatorAnalyticsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="MyEntries" 
              component={MyEntriesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="VerificationRequired" 
              component={VerificationRequiredScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="TierUpgrade" 
              component={TierUpgradeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="UserProfile" 
              component={UserProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CreatorDashboard" 
              component={CreatorDashboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CreateGiveawayWizard" 
              component={CreateGiveawayWizardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="WinnerSelection" 
              component={WinnerSelectionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="FollowersList" 
              component={FollowersListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="NotificationDemo" 
              component={NotificationDemoScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="IntegrationTest" 
              component={IntegrationTestScreen}
              options={{ 
                headerShown: true, 
                title: 'Integration Tests',
                headerStyle: { backgroundColor: '#007AFF' },
                headerTintColor: '#fff'
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
          </>
        )}
      </Stack.Navigator>
      {isAuthenticated && <NotificationManager />}
    </NavigationContainer>
  );
}
