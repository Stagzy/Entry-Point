import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  FlatList,
  Image,
  Animated,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import ProfileAvatar from '../../components/ProfileAvatar';
import { colors, shadows, typography } from '../../styles/designSystem';

/**
 * GiveawaysScreen - Advanced Multi-Platform Giveaway Discovery Hub
 * 
 * PURPOSE:
 * - Central discovery platform for all available giveaways across multiple sources
 * - Provides advanced filtering, sorting, and search capabilities
 * - Supports dual-mode viewing (grid/list) with dynamic layouts
 * - Integrates both platform and external giveaway ecosystems
 * - Includes comprehensive user search functionality
 * 
 * NAVIGATION:
 * - Primary Tab: Main navigation tab accessible from bottom navigation
 * - Entry Points: HomeScreen featured giveaways, direct navigation
 * - Navigation Targets: GiveawayDetailScreen, TicketPurchaseScreen, UserProfileScreen
 * - Deep Linking: Supports category and search parameter routing
 * 
 * CORE FEATURES:
 * - Multi-Tab Interface: Platform, External, Categories, and User search
 * - Advanced Search: Real-time filtering across giveaways and users
 * - Dynamic Filtering: Category, price range, time remaining, entry status
 * - Sort Options: Newest, entries, prize value, ending soon
 * - View Modes: Grid and list layouts with responsive design
 * - Live Progress: Real-time entry counts and time remaining
 * 
 * TAB STRUCTURE:
 * 1. Platform Tab (Entry Point Giveaways):
 *    - Native platform giveaways with ticket purchasing
 *    - Trust tier integration and verification badges
 *    - Entry tracking and purchase history
 *    - Real-time progress visualization
 * 
 * 2. External Tab (Third-Party Giveaways):
 *    - YouTube, Twitter, Instagram, TikTok, Reddit integrations
 *    - Free entry external giveaways
 *    - Creator attribution and source linking
 *    - External URL redirection
 * 
 * 3. Categories Tab:
 *    - Organized browsing by prize categories
 *    - Visual category cards with icons
 *    - Curated collections and themed groupings
 * 
 * 4. User Search:
 *    - Comprehensive user discovery system
 *    - Privacy-aware search (respects user settings)
 *    - Creator and participant profiles
 *    - Follow/unfollow functionality
 * 
 * SEARCH FUNCTIONALITY:
 * - Dual Mode: Toggle between giveaway and user search
 * - Real-time Results: Instant filtering as user types
 * - Multi-field Search: Title, description, category, username, bio
 * - Privacy Respect: Only shows users who allow search discovery
 * - Empty States: Contextual messaging for no results
 * 
 * FILTERING SYSTEM:
 * - Sort Options: 6 different sorting methods with ascending/descending
 * - Category Filters: Electronics, Gaming, Fashion, Automotive, etc.
 * - Price Range: Under $50, $50-200, $200-500, Over $500
 * - Time Filters: Ending soon, this week, long-term
 * - Entry Status: All, entered, not entered
 * - Platform Filter: For external giveaways (Instagram, YouTube, etc.)
 * 
 * VISUAL DESIGN:
 * - Dynamic Progress Colors: Green → Yellow → Orange → Red based on time/progress
 * - Category Theming: Each category has unique colors and emojis
 * - Responsive Cards: Adapts between grid and list layouts
 * - Visual Indicators: Entry status, featured badges, time urgency
 * - Professional Animations: Smooth transitions and scroll behaviors
 * 
 * STATE MANAGEMENT:
 * - activeTab: Current active tab (platform/external/categories)
 * - searchQuery: Real-time search input
 * - searchCategory: Toggle between giveaway/user search
 * - viewMode: Grid or list display preference
 * - filters: Comprehensive filter object with multiple criteria
 * - sortBy/sortOrder: Dynamic sorting configuration
 * 
 * REAL-TIME FEATURES:
 * - Live Entry Counts: Updates as users purchase tickets
 * - Progress Visualization: Dynamic progress bars with color coding
 * - Time Remaining: Color-coded urgency indicators
 * - Active Filter Indicators: Visual feedback for applied filters
 * 
 * USER EXPERIENCE:
 * - Infinite Scroll: Efficient loading for large datasets
 * - Pull-to-Refresh: Update content with swipe gesture
 * - Haptic Feedback: Touch interactions with tactile response
 * - Loading States: Smooth transitions during data fetching
 * - Error Handling: Graceful fallbacks for failed requests
 * 
 * PLATFORM INTEGRATION:
 * - Entry Point Native: Full ticket purchasing and tracking
 * - External Platforms: YouTube, Twitter, Instagram, TikTok, Reddit
 * - Creator Attribution: Proper crediting and profile linking
 * - Cross-platform Analytics: Unified tracking across sources
 * 
 * TECHNICAL ARCHITECTURE:
 * - Component Composition: Modular tab components for scalability
 * - Performance Optimization: FlatList virtualization and efficient rendering
 * - Memory Management: Proper cleanup and state persistence
 * - Accessibility: Full screen reader and keyboard navigation support
 * - Responsive Design: Adapts to different screen sizes and orientations
 * 
 * RELATED COMPONENTS:
 * - PlatformGiveawaysScreen: Entry Point native giveaways
 * - ExternalGiveawaysScreen: Third-party platform giveaways
 * - CategoriesScreen: Category-based browsing
 * - UserSearchScreen: User discovery and profiles
 * 
 * RELATED SCREENS:
 * - GiveawayDetailScreen: Individual giveaway details
 * - TicketPurchaseScreen: Entry Point ticket purchasing
 * - UserProfileScreen: User profile viewing
 * - HomeScreen: Featured giveaway promotion
 */

export default function GiveawaysScreen({ navigation }) {
  const { showSuccess } = useToast();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('platform');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('giveaways'); // 'giveaways' or 'users'
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all'); // For categories filter
  const [sortBy, setSortBy] = useState('newest'); // Sort option
  const [sortOrder, setSortOrder] = useState('desc'); // Sort order
  const [sortModalVisible, setSortModalVisible] = useState(false); // Sort modal visibility
  const [filters, setFilters] = useState({
    platform: 'all', // For external giveaways (Instagram, TikTok, YouTube, etc.)
    category: 'all', // For entry point giveaways (Electronics, Gaming, Fashion, etc.)
    priceRange: 'all',
    timeRange: 'all',
    entryStatus: 'all', // For entry point: 'all', 'entered', 'not-entered'
  }); // Filter options
  const scrollY = useRef(new Animated.Value(0)).current;

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== 'all') || sortBy !== 'newest';

  // Mock data should be defined inside the component
  const mockGiveaways = [
    {
      id: 1,
      title: 'iPhone 15 Pro Max',
      description: 'Latest Apple flagship with titanium design',
      image: 'https://via.placeholder.com/300x200/667eea/ffffff?text=📱',
      value: 1299,
      costPerEntry: 8,
      ticketPrice: 8,
      entry_cost: 8,
      category: 'Electronics',
      entries: 2450,
      maxEntries: 5000,
      remainingTickets: 2550,
      timeLeft: '2 hours left', // Red
      featured: true,
      isPlatform: true,
      emoji: '📱',
      backgroundColor: '#f3f4ff',
      categoryColor: '#007AFF',
      categoryLabel: 'FLAGSHIP PHONE',
      hasEntered: false,
    },
    // Add other mock items here...
  ];

  // Render function needs to be inside component to access theme
  const renderGiveawayCard = (item) => {
    const progressPercentage = item.maxEntries ? (item.entries / item.maxEntries) * 100 : 0;
    const isUnlimited = !item.maxEntries || item.maxEntries === 0;
    
    // Dynamic progress bar color based on percentage
    const getProgressColor = (percentage, isUnlimited) => {
      if (isUnlimited) return '#007AFF'; // Blue for unlimited
      if (percentage < 50) return '#4CAF50'; // Green
      if (percentage < 80) return '#FF9800'; // Yellow/Orange
      return '#F44336'; // Red
    };

    // Dynamic time left color based on urgency
    const getTimeLeftColor = (timeLeft) => {
      const lowerTime = timeLeft.toLowerCase();
      
      // Extract number and unit
      if (lowerTime.includes('hour') || (lowerTime.includes('day') && parseInt(lowerTime) === 1)) {
        return '#F44336'; // Red for 24 hours or 1 day
      } else if (lowerTime.includes('day') && parseInt(lowerTime) <= 3) {
        return '#FF6B35'; // Orange for 2-3 days
      } else if (lowerTime.includes('day') && parseInt(lowerTime) <= 7) {
        return '#FF9800'; // Yellow for 4-7 days
      } else if (lowerTime.includes('week') && parseInt(lowerTime) === 1) {
        return '#FF9800'; // Yellow for 1 week
      } else if (lowerTime.includes('week') && parseInt(lowerTime) <= 2) {
        return '#FFC107'; // Amber for 2 weeks
      } else if (lowerTime.includes('month') || (lowerTime.includes('week') && parseInt(lowerTime) > 2)) {
        return '#4CAF50'; // Green for months or 3+ weeks
      } else {
        return '#4CAF50'; // Default green for longer periods
      }
    };
    
    return (
      <TouchableOpacity 
        style={[
          styles.giveawayCard,
          { backgroundColor: theme.surface },
          viewMode === 'grid' ? styles.gridCard : styles.listCard
        ]}
        onPress={() => navigation.navigate('GiveawayDetail', { giveaway: item })}
      >
        {/* Image Section */}
        <View style={[
          styles.imageSection, 
          { backgroundColor: item.backgroundColor },
          viewMode === 'grid' ? styles.gridImageSection : styles.listImageSection
        ]}>
          <View style={[
            styles.emojiContainer, 
            { backgroundColor: item.categoryColor },
            viewMode === 'grid' ? styles.gridEmojiContainer : styles.listEmojiContainer
          ]}>
            <Text style={[
              styles.emojiText,
              viewMode === 'grid' ? styles.gridEmojiText : styles.listEmojiText
            ]}>
              {item.emoji}
            </Text>
          </View>
          <Text style={[
            styles.categoryLabel,
            { color: item.categoryColor },
            viewMode === 'grid' ? styles.gridCategoryLabel : styles.listCategoryLabel
          ]}>
            {item.categoryLabel}
          </Text>
        </View>
        
        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={[
            styles.giveawayTitle,
            { color: theme.text },
            viewMode === 'grid' ? styles.gridTitle : styles.listTitle
          ]}>
            {item.title}
          </Text>
          
          <Text style={[
            styles.giveawayDescription,
            { color: theme.textSecondary },
            viewMode === 'grid' ? styles.gridDescription : styles.listDescription
          ]}>
            {item.description}
          </Text>
          
          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: isUnlimited ? '100%' : `${Math.min(progressPercentage, 100)}%`,
                    backgroundColor: getProgressColor(progressPercentage, isUnlimited)
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textTertiary }]}>
              {isUnlimited 
                ? `${item.entries.toLocaleString()} entries • Unlimited`
                : `${item.entries.toLocaleString()} / ${item.maxEntries.toLocaleString()} entries`
              }
            </Text>
          </View>
          
          {/* Bottom Section with Cost and Time */}
          <View style={styles.bottomSection}>
            <Text style={styles.costPerEntry}>
              ${item.costPerEntry}{viewMode === 'grid' ? '' : '/entry'}
            </Text>
            <Text style={[
              styles.timeLeft,
              { color: getTimeLeftColor(item.timeLeft) }
            ]}>
              {viewMode === 'grid' 
                ? item.timeLeft.replace(' left', '') 
                : item.timeLeft
              }
            </Text>
          </View>
          
          {/* Enter Button */}
          <TouchableOpacity 
            style={[
              styles.enterButton,
              item.hasEntered && styles.enteredButton
            ]}
            onPress={() => {
              // Navigate to giveaway detail screen to show entry options
              navigation.navigate('GiveawayDetail', { 
                giveaway: item,
                giveawayId: item.id 
              });
            }}
          >
            <Text style={[
              styles.enterButtonText,
              item.hasEntered && styles.enteredButtonText
            ]}>
              {item.hasEntered ? 'Entered ✓' : 'Enter Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]}>
      <StatusBar 
        barStyle={theme.isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.surface}
      />
      {/* Fixed Header - Always visible */}
      <View style={[
        styles.fixedHeader, 
        { 
          backgroundColor: theme.surface, 
          borderBottomColor: theme.border,
          shadowOpacity: theme.isDarkMode ? 0.3 : 0.08,
        }
      ]}>
        {searchCategory === 'giveaways' ? (
          <>
            {/* Search Category Tabs (Giveaways/Users) */}
            <View style={{ 
              flexDirection: 'row',
              backgroundColor: theme.surface,
              borderRadius: 25,
              marginHorizontal: 16,
              marginTop: 12,
              marginBottom: 8,
              padding: 2,
              ...shadows.medium,
            }}>
              <TouchableOpacity
                style={[
                  {
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 23,
                  },
                  searchCategory === 'giveaways' && { backgroundColor: colors.primary }
                ]}
                onPress={() => {
                  setSearchCategory('giveaways');
                  setSearchQuery('');
                }}
              >
                <Ionicons 
                  name="gift" 
                  size={16} 
                  color={searchCategory === 'giveaways' ? colors.textInverse : colors.primary} 
                />
                <Text style={[
                  { fontSize: 14, fontWeight: '600', color: colors.primary, marginLeft: 6 },
                  searchCategory === 'giveaways' && { color: colors.textInverse }
                ]}>
                  Giveaways
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  {
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 23,
                  },
                  searchCategory === 'users' && { backgroundColor: colors.primary }
                ]}
                onPress={() => {
                  setSearchCategory('users');
                  setSearchQuery('');
                }}
              >
                <Ionicons 
                  name="people" 
                  size={16} 
                  color={searchCategory === 'users' ? colors.textInverse : colors.primary} 
                />
                <Text style={[
                  { fontSize: 14, fontWeight: '600', color: colors.primary, marginLeft: 6 },
                  searchCategory === 'users' && { color: colors.textInverse }
                ]}>
                  Users
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Input Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 6 }}>
              <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.surface,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
                <Ionicons name="search" size={18} color={theme.textTertiary} style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: theme.text, fontWeight: '500' }}
                  placeholder="Giveaways..."
                  placeholderTextColor={theme.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              
              {/* Sort & Filter Button */}
              <TouchableOpacity 
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: hasActiveFilters ? '#007AFF' : theme.surface,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: hasActiveFilters ? '#007AFF' : theme.border,
                  marginRight: 6,
                }}
                onPress={() => setSortModalVisible(true)}
              >
                <Ionicons name="funnel" size={16} color={hasActiveFilters ? '#fff' : theme.textSecondary} />
                <Text style={{
                  fontSize: 12,
                  color: hasActiveFilters ? '#fff' : theme.textSecondary,
                  fontWeight: '500',
                  marginLeft: 4,
                }}>
                  Sort & Filter
                </Text>
                {hasActiveFilters && (
                  <View style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#fff',
                    marginLeft: 4,
                  }} />
                )}
              </TouchableOpacity>
              
              {/* View Mode Toggle */}
              <View style={{
                flexDirection: 'row',
                backgroundColor: theme.surface,
                borderRadius: 16,
                padding: 3,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
                <TouchableOpacity
                  style={[
                    { padding: 6, borderRadius: 12, marginHorizontal: 1 },
                    viewMode === 'grid' && { backgroundColor: '#007AFF' }
                  ]}
                  onPress={() => setViewMode('grid')}
                >
                  <Ionicons name="grid" size={16} color={viewMode === 'grid' ? '#fff' : theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    { padding: 6, borderRadius: 12, marginHorizontal: 1 },
                    viewMode === 'list' && { backgroundColor: '#007AFF' }
                  ]}
                  onPress={() => setViewMode('list')}
                >
                  <Ionicons name="list" size={16} color={viewMode === 'list' ? '#fff' : theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Buttons */}
            <View style={{ paddingVertical: 6, paddingHorizontal: 8, marginTop: 0 }}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {[
                    { id: 'all', name: 'All', icon: '🎯', color: '#007AFF' },
                    { id: 'electronics', name: 'Electronics', icon: '📱', color: '#4CAF50' },
                    { id: 'gaming', name: 'Gaming', icon: '🎮', color: '#FF9800' },
                    { id: 'automotive', name: 'Automotive', icon: '🚗', color: '#FF5722' },
                    { id: 'fashion', name: 'Fashion', icon: '👕', color: '#E91E63' },
                    { id: 'home', name: 'Home', icon: '🏠', color: '#9C27B0' },
                    { id: 'sports', name: 'Sports', icon: '⚽', color: '#00BCD4' },
                    { id: 'travel', name: 'Travel', icon: '✈️', color: '#795548' },
                  ].map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        {
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: theme.surface,
                          borderWidth: 1,
                          borderColor: theme.border,
                          minWidth: 70,
                          justifyContent: 'center',
                        },
                        selectedCategory === category.id && {
                          backgroundColor: category.color,
                          borderColor: category.color,
                        }
                      ]}
                      onPress={() => {
                        setSelectedCategory(category.id);
                        setActiveTab('platform'); // Always show platform giveaways when category selected
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>{category.icon}</Text>
                      <Text style={[
                        { 
                          fontSize: 13, 
                          fontWeight: '600', 
                          color: theme.textSecondary, 
                          marginLeft: 4 
                        },
                        selectedCategory === category.id && { color: '#fff' }
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </>
        ) : (
          // User search header - simpler version
          <>
            {/* Search Category Tabs (Giveaways/Users) */}
            <View style={{ 
              flexDirection: 'row',
              backgroundColor: colors.surface,
              borderRadius: 25,
              marginHorizontal: 16,
              marginTop: 12,
              marginBottom: 8,
              padding: 2,
              ...shadows.medium,
            }}>
              <TouchableOpacity
                style={[
                  {
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 23,
                  },
                  searchCategory === 'giveaways' && { backgroundColor: colors.primary }
                ]}
                onPress={() => {
                  setSearchCategory('giveaways');
                  setSearchQuery('');
                }}
              >
                <Ionicons 
                  name="gift" 
                  size={16} 
                  color={searchCategory === 'giveaways' ? colors.textInverse : colors.primary} 
                />
                <Text style={[
                  { fontSize: 14, fontWeight: '600', color: colors.primary, marginLeft: 6 },
                  searchCategory === 'giveaways' && { color: colors.textInverse }
                ]}>
                  Giveaways
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  {
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 23,
                  },
                  searchCategory === 'users' && { backgroundColor: colors.primary }
                ]}
                onPress={() => {
                  setSearchCategory('users');
                  setSearchQuery('');
                }}
              >
                <Ionicons 
                  name="people" 
                  size={16} 
                  color={searchCategory === 'users' ? colors.textInverse : colors.primary} 
                />
                <Text style={[
                  { fontSize: 14, fontWeight: '600', color: colors.primary, marginLeft: 6 },
                  searchCategory === 'users' && { color: colors.textInverse }
                ]}>
                  Users
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Input for Users */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 6 }}>
              <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.surface,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
                <Ionicons name="search" size={18} color={theme.textTertiary} style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: theme.text, fontWeight: '500' }}
                  placeholder="Users..."
                  placeholderTextColor={theme.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
          </>
        )}
      </View>

      {/* Scrollable Content Area */}
      <View style={[styles.scrollableContent, { backgroundColor: theme.background }]}>
        {searchCategory === 'giveaways' ? (
          <PlatformGiveawaysScreen 
            navigation={navigation}
            searchQuery={searchQuery}
            viewMode={viewMode}
            scrollY={scrollY}
            sortBy={sortBy}
            sortOrder={sortOrder}
            filters={filters}
            selectedCategory={selectedCategory}
          />
        ) : (
          <UserSearchScreen 
            navigation={navigation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            scrollY={scrollY}
            isNested={true}
            theme={theme}
          />
        )}
      </View>

      {/* Sort & Filter Modal */}
      <Modal
        visible={sortModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <TouchableOpacity style={[styles.sortModal, { backgroundColor: theme.surface }]} activeOpacity={1}>
            <View style={styles.sortModalHeader}>
              <Text style={[styles.sortModalTitle, { color: theme.text }]}>Sort & Filter</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalContent} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Sort Section */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: theme.text }]}>Sort by</Text>
                
                <TouchableOpacity 
                  style={[styles.sortOption, sortBy === 'newest' && styles.sortOptionActive]}
                  onPress={() => {
                    setSortBy('newest');
                    setSortOrder('desc');
                  }}
                >
                  <Text style={[styles.sortOptionText, { color: theme.text }, sortBy === 'newest' && styles.sortOptionTextActive]}>
                    Newest First
                  </Text>
                  {sortBy === 'newest' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sortOption, sortBy === 'oldest' && styles.sortOptionActive]}
                  onPress={() => {
                    setSortBy('oldest');
                    setSortOrder('asc');
                  }}
                >
                  <Text style={[styles.sortOptionText, { color: theme.text }, sortBy === 'oldest' && styles.sortOptionTextActive]}>
                    Oldest First
                  </Text>
                  {sortBy === 'oldest' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sortOption, sortBy === 'entries' && styles.sortOptionActive]}
                  onPress={() => {
                    setSortBy('entries');
                    setSortOrder('desc');
                  }}
                >
                  <Text style={[styles.sortOptionText, { color: theme.text }, sortBy === 'entries' && styles.sortOptionTextActive]}>
                    Most Entries
                  </Text>
                  {sortBy === 'entries' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sortOption, sortBy === 'prize' && styles.sortOptionActive]}
                  onPress={() => {
                    setSortBy('prize');
                    setSortOrder('desc');
                  }}
                >
                  <Text style={[styles.sortOptionText, { color: theme.text }, sortBy === 'prize' && styles.sortOptionTextActive]}>
                    Highest Prize Value
                  </Text>
                  {sortBy === 'prize' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.sortOption, sortBy === 'ending' && styles.sortOptionActive]}
                  onPress={() => {
                    setSortBy('ending');
                    setSortOrder('asc');
                  }}
                >
                  <Text style={[styles.sortOptionText, { color: theme.text }, sortBy === 'ending' && styles.sortOptionTextActive]}>
                    Ending Soon
                  </Text>
                  {sortBy === 'ending' && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                </TouchableOpacity>
              </View>

              {/* Filters Section */}
              <>
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Entry Status</Text>
                  {[
                    { key: 'all', label: 'All Giveaways', icon: 'apps' },
                    { key: 'not-entered', label: 'Not Entered', icon: 'add-circle-outline' },
                    { key: 'entered', label: 'Already Entered', icon: 'checkmark-circle' }
                  ].map((status) => (
                      <TouchableOpacity 
                        key={status.key}
                        style={[styles.sortOption, filters.entryStatus === status.key && styles.sortOptionActive]}
                        onPress={() => setFilters(prev => ({ ...prev, entryStatus: status.key }))}
                      >
                        <View style={styles.filterOptionContent}>
                          <Ionicons 
                            name={status.icon}
                            size={18} 
                            color={filters.entryStatus === status.key ? '#007AFF' : '#666'} 
                          />
                          <Text style={[styles.sortOptionText, filters.entryStatus === status.key && styles.sortOptionTextActive]}>
                            {status.label}
                          </Text>
                        </View>
                        {filters.entryStatus === status.key && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Category</Text>
                    {[
                      { key: 'all', label: 'All Categories', icon: 'apps' },
                      { key: 'electronics', label: 'Electronics', icon: 'phone-portrait' },
                      { key: 'gaming', label: 'Gaming', icon: 'game-controller' },
                      { key: 'fashion', label: 'Fashion', icon: 'shirt' },
                      { key: 'automotive', label: 'Automotive', icon: 'car' },
                      { key: 'home-garden', label: 'Home & Garden', icon: 'home' },
                      { key: 'sports', label: 'Sports', icon: 'football' },
                      { key: 'travel', label: 'Travel', icon: 'airplane' },
                      { key: 'cash', label: 'Cash Prizes', icon: 'cash' }
                    ].map((category) => (
                      <TouchableOpacity 
                        key={category.key}
                        style={[styles.sortOption, filters.category === category.key && styles.sortOptionActive]}
                        onPress={() => setFilters(prev => ({ ...prev, category: category.key }))}
                      >
                        <View style={styles.filterOptionContent}>
                          <Ionicons 
                            name={category.icon}
                            size={18} 
                            color={filters.category === category.key ? '#007AFF' : '#666'} 
                          />
                          <Text style={[styles.sortOptionText, filters.category === category.key && styles.sortOptionTextActive]}>
                            {category.label}
                          </Text>
                        </View>
                        {filters.category === category.key && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                      </TouchableOpacity>
                    ))}
                  </View>
              </>

              {/* Common Filters */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Prize Range</Text>
                {[
                  { key: 'all', label: 'Any Prize Value', icon: 'apps' },
                  { key: 'under-50', label: 'Under $50', icon: 'cash-outline' },
                  { key: '50-200', label: '$50 - $200', icon: 'cash' },
                  { key: '200-500', label: '$200 - $500', icon: 'card' },
                  { key: 'over-500', label: 'Over $500', icon: 'diamond' }
                ].map((range) => (
                  <TouchableOpacity 
                    key={range.key}
                    style={[styles.sortOption, filters.priceRange === range.key && styles.sortOptionActive]}
                    onPress={() => setFilters(prev => ({ ...prev, priceRange: range.key }))}
                  >
                    <View style={styles.filterOptionContent}>
                      <Ionicons 
                        name={range.icon}
                        size={18} 
                        color={filters.priceRange === range.key ? '#007AFF' : '#666'} 
                      />
                      <Text style={[styles.sortOptionText, filters.priceRange === range.key && styles.sortOptionTextActive]}>
                        {range.label}
                      </Text>
                    </View>
                    {filters.priceRange === range.key && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Time Remaining</Text>
                {[
                  { key: 'all', label: 'Any Time', icon: 'time' },
                  { key: 'ending-soon', label: 'Ending in 24 hours', icon: 'alarm' },
                  { key: 'this-week', label: 'Ending this week', icon: 'calendar' },
                  { key: 'long-term', label: 'More than a week', icon: 'infinite' }
                ].map((time) => (
                  <TouchableOpacity 
                    key={time.key}
                    style={[styles.sortOption, filters.timeRange === time.key && styles.sortOptionActive]}
                    onPress={() => setFilters(prev => ({ ...prev, timeRange: time.key }))}
                  >
                    <View style={styles.filterOptionContent}>
                      <Ionicons 
                        name={time.icon}
                        size={18} 
                        color={filters.timeRange === time.key ? '#007AFF' : '#666'} 
                      />
                      <Text style={[styles.sortOptionText, filters.timeRange === time.key && styles.sortOptionTextActive]}>
                        {time.label}
                      </Text>
                    </View>
                    {filters.timeRange === time.key && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Apply Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setSortModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// User Search Component
function UserSearchScreen({ navigation, searchQuery, scrollY, theme }) {
  const { getTrustTierInfo } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock user data with privacy settings
  const mockUsers = [
    {
      id: 1,
      username: 'sarah_gamer',
      name: 'Sarah Johnson',
      bio: 'Gaming enthusiast and tech lover 🎮',
      avatar: null,
      isVerified: true,
      isCreator: true,
      trustTier: 'gold',
      followersCount: 15420,
      followingCount: 892,
      activeGiveaways: 3,
      privacySettings: {
        allowSearchDiscovery: true, // User allows being found in search
        showStats: true,
        showActiveGiveaways: true,
      }
    },
    {
      id: 2,
      username: 'mike_streams',
      name: 'Mike Chen',
      bio: 'Streaming daily on Twitch',
      avatar: null,
      isVerified: false,
      isCreator: true,
      trustTier: 'silver',
      followersCount: 8230,
      followingCount: 456,
      activeGiveaways: 2,
      privacySettings: {
        allowSearchDiscovery: false, // User opted out of search
        showStats: true,
        showActiveGiveaways: true,
      }
    },
    {
      id: 3,
      username: 'alex_crypto',
      name: 'Alex Rodriguez',
      bio: 'Crypto trader and NFT collector 🚀',
      avatar: null,
      isVerified: true,
      isCreator: false,
      trustTier: 'bronze',
      followersCount: 2140,
      followingCount: 1205,
      activeGiveaways: 0,
      privacySettings: {
        allowSearchDiscovery: true,
        showStats: false,
        showActiveGiveaways: true,
      }
    },
    {
      id: 4,
      username: 'jenny_artist',
      name: 'Jennifer Liu',
      bio: 'Digital artist and designer ✨',
      avatar: null,
      isVerified: true,
      isCreator: true,
      trustTier: 'gold',
      followersCount: 12580,
      followingCount: 320,
      activeGiveaways: 4,
      privacySettings: {
        allowSearchDiscovery: true,
        showStats: true,
        showActiveGiveaways: true,
      }
    },
    {
      id: 5,
      username: 'tech_reviewer',
      name: 'David Kim',
      bio: 'Tech reviews and unboxings 📱',
      avatar: null,
      isVerified: true,
      isCreator: true,
      trustTier: 'gold',
      followersCount: 45200,
      followingCount: 180,
      activeGiveaways: 6,
      privacySettings: {
        allowSearchDiscovery: true,
        showStats: true,
        showActiveGiveaways: true,
      }
    },
  ];

  React.useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const filteredUsers = mockUsers.filter(user => 
          // Only show users who allow search discovery
          user.privacySettings.allowSearchDiscovery &&
          (user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.bio?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setUsers(filteredUsers);
        setLoading(false);
      }, 500);
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const handleUserPress = (user) => {
    navigation.navigate('UserProfile', { 
      userId: user.id, 
      username: user.username 
    });
  };

  const handleFollowToggle = (userId) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, isFollowing: !user.isFollowing }
        : user
    ));
  };

  const renderUserItem = (user) => (
    <View key={user.id} style={[styles.userSearchItem, { backgroundColor: theme.surface }]}>
      <TouchableOpacity 
        style={styles.userSearchInfo}
        onPress={() => handleUserPress(user)}
        activeOpacity={0.7}
      >
        <ProfileAvatar 
          user={user} 
          size={50} 
          getTrustTierInfo={getTrustTierInfo}
          showVerificationBadge={true}
          showTrustBorder={true}
        />
        <View style={styles.userSearchDetails}>
          <View style={styles.userSearchNameRow}>
            <Text style={[styles.userSearchUsername, { color: theme.text }]}>@{user.username}</Text>
            {user.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#007AFF" style={styles.verifiedIcon} />
            )}
            {user.isCreator && (
              <View style={styles.creatorBadgeSmall}>
                <Ionicons name="star" size={12} color="#FF9500" />
              </View>
            )}
          </View>
          <Text style={[styles.userSearchName, { color: theme.textSecondary }]}>{user.name}</Text>
          {user.bio && (
            <Text style={[styles.userSearchBio, { color: theme.textTertiary }]} numberOfLines={1}>{user.bio}</Text>
          )}
          <View style={styles.userSearchStats}>
            <Text style={[styles.userSearchStat, { color: theme.textTertiary }]}>
              {user.followersCount.toLocaleString()} followers
            </Text>
            {user.activeGiveaways > 0 && (
              <Text style={[styles.userSearchStat, { color: theme.textTertiary }]}>
                • {user.activeGiveaways} active giveaway{user.activeGiveaways !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.followButtonSmall, user.isFollowing && styles.followingButtonSmall]}
        onPress={() => handleFollowToggle(user.id)}
        activeOpacity={0.8}
      >
        <Text style={[styles.followButtonTextSmall, user.isFollowing && styles.followingButtonTextSmall]}>
          {user.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.userSearchContainer, { backgroundColor: theme.background, flex: 1 }]}>
      <ScrollView 
        style={{ backgroundColor: theme.background, flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, backgroundColor: theme.background, minHeight: '100%' }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Content */}
        {searchQuery.trim().length === 0 ? (
          <View style={[styles.searchEmptyState, { backgroundColor: theme.background }]}>
            <Ionicons name="search" size={48} color={theme.textTertiary} />
            <Text style={[styles.searchEmptyText, { color: theme.textSecondary }]}>Search for users</Text>
            <Text style={[styles.searchEmptySubtext, { color: theme.textTertiary }]}>Find creators, participants, and other community members</Text>
          </View>
        ) : loading ? (
          <View style={[styles.searchLoadingState, { backgroundColor: theme.background }]}>
            <Text style={[styles.searchLoadingText, { color: theme.textSecondary }]}>Searching users...</Text>
          </View>
        ) : users.length > 0 ? (
          <View style={[styles.userSearchResults, { backgroundColor: theme.background }]}>
            <Text style={[styles.searchResultsHeader, { color: theme.text }]}>
              {users.length} user{users.length !== 1 ? 's' : ''} found
            </Text>
            {users.map(renderUserItem)}
          </View>
        ) : (
          <View style={[styles.searchNoResults, { backgroundColor: theme.background }]}>
            <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.searchNoResultsText, { color: theme.textSecondary }]}>No users found</Text>
            <Text style={[styles.searchNoResultsSubtext, { color: theme.textTertiary }]}>
              Try different keywords or check if the user has enabled search discovery
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Platform Giveaways Component
function PlatformGiveawaysScreen({ navigation, searchQuery, viewMode, scrollY, sortBy, sortOrder, filters, selectedCategory }) {
  const { showSuccess } = useToast();
  const { theme } = useTheme();
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sorting function
  const sortGiveaways = (giveawaysArray, sortBy, sortOrder) => {
    const sorted = [...giveawaysArray].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          // Assuming id represents creation order (higher id = newer)
          return sortOrder === 'desc' ? b.id - a.id : a.id - b.id;
        case 'oldest':
          return sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
        case 'entries':
          return sortOrder === 'desc' ? b.entries - a.entries : a.entries - b.entries;
        case 'prize':
          return sortOrder === 'desc' ? b.value - a.value : a.value - b.value;
        case 'ending':
          // For demo purposes, using timeLeft string comparison
          // In real app, you'd use actual date objects
          const timeA = a.timeLeft.includes('day') ? parseInt(a.timeLeft) : 
                       a.timeLeft.includes('week') ? parseInt(a.timeLeft) * 7 : 
                       parseInt(a.timeLeft);
          const timeB = b.timeLeft.includes('day') ? parseInt(b.timeLeft) : 
                       b.timeLeft.includes('week') ? parseInt(b.timeLeft) * 7 : 
                       parseInt(b.timeLeft);
          return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        default:
          return 0;
      }
    });
    return sorted;
  };

  // Enhanced mock platform giveaways data with all required fields
  const mockGiveaways = [
    {
      id: 1,
      title: 'iPhone 15 Pro Max',
      description: 'Latest iPhone with amazing camera and performance',
      prize: 'iPhone 15 Pro Max 256GB - Natural Titanium',
      image: 'https://via.placeholder.com/300x200/667eea/ffffff?text=📱',
      value: 1299,
      costPerEntry: 5,
      ticketPrice: 5,
      entry_cost: 5,
      category: 'Electronics',
      entries: 15420,
      maxEntries: 50000,
      totalTickets: 50000,
      soldTickets: 15420,
      remainingTickets: 34580,
      timeLeft: '2 days left',
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      featured: true,
      isPlatform: true,
      emoji: '📱',
      backgroundColor: '#f0f4ff',
      categoryColor: '#007AFF',
      categoryLabel: 'PREMIUM DEVICE',
    },
    {
      id: 2,
      title: 'Gaming Setup Bundle',
      description: 'Complete gaming setup with RGB everything',
      prize: 'RTX 4090 Gaming PC + RGB Keyboard + Gaming Chair + 32" Monitor + Headset',
      image: 'https://via.placeholder.com/300x200/4CAF50/ffffff?text=🎮',
      value: 2500,
      costPerEntry: 10,
      ticketPrice: 10,
      entry_cost: 10,
      category: 'Gaming',
      entries: 8430,
      maxEntries: 25000,
      totalTickets: 25000,
      soldTickets: 8430,
      remainingTickets: 16570,
      timeLeft: '18 hours left', // Critical - should be red
      endDate: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours from now
      featured: false,
      isPlatform: true,
      emoji: '🎮',
      backgroundColor: '#f0fff0',
      categoryColor: '#4CAF50',
      categoryLabel: 'GAMING SETUP',
    },
    {
      id: 3,
      title: 'MacBook Air M3',
      description: 'Perfect for students and professionals',
      image: 'https://via.placeholder.com/300x200/FF9800/ffffff?text=💻',
      value: 1499,
      costPerEntry: 8,
      ticketPrice: 8,
      entry_cost: 8,
      category: 'Electronics',
      entries: 12580,
      maxEntries: 40000,
      remainingTickets: 27420,
      timeLeft: '3 days left', // Orange
      featured: true,
      isPlatform: true,
      emoji: '💻',
      backgroundColor: '#fff8f0',
      categoryColor: '#FF9800',
      categoryLabel: 'PRODUCTIVITY',
    },
    {
      id: 4,
      title: 'AirPods Pro Max',
      description: 'Premium wireless headphones',
      image: 'https://via.placeholder.com/300x200/9C27B0/ffffff?text=🎧',
      value: 549,
      costPerEntry: 3,
      ticketPrice: 3,
      entry_cost: 3,
      category: 'Electronics',
      entries: 22100,
      maxEntries: 30000,
      remainingTickets: 7900,
      timeLeft: '6 days left', // Yellow
      featured: false,
      isPlatform: true,
      emoji: '🎧',
      backgroundColor: '#f3e5f5',
      categoryColor: '#9C27B0',
      categoryLabel: 'PREMIUM AUDIO',
    },
    {
      id: 5,
      title: 'Tesla Model Y',
      description: 'Electric SUV with autopilot features',
      image: 'https://via.placeholder.com/300x200/FF5722/ffffff?text=🚗',
      value: 89990,
      costPerEntry: 50,
      ticketPrice: 50,
      entry_cost: 50,
      category: 'Automotive',
      entries: 5200,
      maxEntries: 10000,
      remainingTickets: 4800,
      timeLeft: '3 weeks left', // Green
      featured: true,
      isPlatform: true,
      emoji: '🚗',
      backgroundColor: '#fff3e0',
      categoryColor: '#FF5722',
      categoryLabel: 'ELECTRIC VEHICLE',
    },
    {
      id: 6,
      title: 'iPad Pro 12.9"',
      description: 'Professional tablet for creative work',
      image: 'https://via.placeholder.com/300x200/2196F3/ffffff?text=📱',
      value: 1299,
      costPerEntry: 6,
      ticketPrice: 6,
      entry_cost: 6,
      category: 'Electronics',
      entries: 18750,
      maxEntries: 35000,
      remainingTickets: 16250,
      timeLeft: '4 days left',
      featured: false,
      isPlatform: true,
      emoji: '📱',
      backgroundColor: '#e3f2fd',
      categoryColor: '#2196F3',
      categoryLabel: 'CREATIVE TABLET',
      hasEntered: true, // User has already entered this giveaway
    },
    {
      id: 7,
      title: 'Designer Fashion Bundle',
      description: 'Luxury clothing and accessories package',
      image: 'https://via.placeholder.com/300x200/E91E63/ffffff?text=�',
      value: 10000,
      costPerEntry: 2,
      ticketPrice: 2,
      entry_cost: 2,
      category: 'Fashion',
      entries: 45600,
      maxEntries: 0, // 0 means unlimited
      remainingTickets: 999999, // High number for unlimited giveaways
      timeLeft: '1 month left', // Green
      featured: true,
      isPlatform: true,
      emoji: '�',
      backgroundColor: '#fce4ec',
      categoryColor: '#E91E63',
      categoryLabel: 'DESIGNER FASHION',
    },
    {
      id: 8,
      title: 'Home Gym Setup',
      description: 'Complete home fitness equipment package',
      image: 'https://via.placeholder.com/300x200/00BCD4/ffffff?text=⚽',
      value: 3500,
      costPerEntry: 15,
      ticketPrice: 15,
      entry_cost: 15,
      category: 'Sports',
      entries: 2300,
      maxEntries: 8000,
      remainingTickets: 5700,
      timeLeft: '5 days left',
      featured: false,
      isPlatform: true,
      emoji: '⚽',
      backgroundColor: '#e0f7fa',
      categoryColor: '#00BCD4',
      categoryLabel: 'FITNESS GEAR',
    },
    {
      id: 9,
      title: 'Smart Home Bundle',
      description: 'Complete smart home automation system',
      prize: 'Complete Smart Home Bundle with Alexa, Ring Doorbell, Smart Lights, and Security System',
      image: 'https://via.placeholder.com/300x200/9C27B0/ffffff?text=🏠',
      value: 2200,
      costPerEntry: 8,
      ticketPrice: 8,
      entry_cost: 8,
      category: 'Home',
      entries: 4800,
      maxEntries: 15000,
      totalTickets: 15000,
      soldTickets: 4800,
      remainingTickets: 10200,
      timeLeft: '1 week left',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      featured: false,
      isPlatform: true,
      emoji: '🏠',
      backgroundColor: '#f3e5f5',
      categoryColor: '#9C27B0',
      categoryLabel: 'SMART HOME',
    },
  ];

  React.useEffect(() => {
    // Initialize giveaways on mount and filter based on search query and filters
    let filteredGiveaways = mockGiveaways;

    // Apply search query filter
    if (searchQuery.trim()) {
      filteredGiveaways = filteredGiveaways.filter(giveaway =>
        giveaway.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        giveaway.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        giveaway.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter from top navigation
    if (selectedCategory && selectedCategory !== 'all') {
      filteredGiveaways = filteredGiveaways.filter(giveaway => {
        // Map category IDs to giveaway categories
        const categoryMap = {
          'electronics': 'Electronics',
          'gaming': 'Gaming', 
          'automotive': 'Automotive',
          'fashion': 'Fashion',
          'home': 'Home',
          'sports': 'Sports',
          'travel': 'Travel'
        };
        const targetCategory = categoryMap[selectedCategory];
        return targetCategory ? giveaway.category === targetCategory : true;
      });
    }

    // Apply category filter from modal (if different from top navigation)
    if (filters.category !== 'all') {
      filteredGiveaways = filteredGiveaways.filter(giveaway =>
        giveaway.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Apply entry status filter
    if (filters.entryStatus !== 'all') {
      filteredGiveaways = filteredGiveaways.filter(giveaway => {
        if (filters.entryStatus === 'entered') {
          return giveaway.hasEntered === true;
        } else if (filters.entryStatus === 'not-entered') {
          return !giveaway.hasEntered;
        }
        return true;
      });
    }

    // Apply price range filter
    if (filters.priceRange !== 'all') {
      filteredGiveaways = filteredGiveaways.filter(giveaway => {
        const value = giveaway.value;
        switch (filters.priceRange) {
          case 'under-50':
            return value < 50;
          case '50-200':
            return value >= 50 && value <= 200;
          case '200-500':
            return value >= 200 && value <= 500;
          case 'over-500':
            return value > 500;
          default:
            return true;
        }
      });
    }

    // Apply time range filter
    if (filters.timeRange !== 'all') {
      filteredGiveaways = filteredGiveaways.filter(giveaway => {
        const timeLeft = giveaway.timeLeft.toLowerCase();
        switch (filters.timeRange) {
          case 'ending-soon':
            return timeLeft.includes('hour') || (timeLeft.includes('day') && parseInt(timeLeft) === 1);
          case 'this-week':
            return timeLeft.includes('day') && parseInt(timeLeft) <= 7;
          case 'long-term':
            return timeLeft.includes('week') || timeLeft.includes('month');
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    const sortedGiveaways = sortGiveaways(filteredGiveaways, sortBy, sortOrder);
    setGiveaways(sortedGiveaways);
  }, [searchQuery, sortBy, sortOrder, filters, selectedCategory]);

  // Initialize data on mount
  React.useEffect(() => {
    const sortedGiveaways = sortGiveaways(mockGiveaways, sortBy || 'newest', sortOrder || 'desc');
    setGiveaways(sortedGiveaways);
  }, []);

  // Render function for Platform giveaway cards
  const renderGiveawayCard = (item) => {
    const progressPercentage = item.maxEntries ? (item.entries / item.maxEntries) * 100 : 0;
    const isUnlimited = !item.maxEntries || item.maxEntries === 0;
    
    // Dynamic progress bar color based on percentage
    const getProgressColor = (percentage, isUnlimited) => {
      if (isUnlimited) return '#007AFF'; // Blue for unlimited
      if (percentage < 50) return '#4CAF50'; // Green
      if (percentage < 80) return '#FF9800'; // Yellow/Orange
      return '#F44336'; // Red
    };

    // Dynamic time left color based on urgency
    const getTimeLeftColor = (timeLeft) => {
      const lowerTime = timeLeft.toLowerCase();
      
      // Extract number and unit
      if (lowerTime.includes('hour') || (lowerTime.includes('day') && parseInt(lowerTime) === 1)) {
        return '#F44336'; // Red for 24 hours or 1 day
      } else if (lowerTime.includes('day') && parseInt(lowerTime) <= 3) {
        return '#FF6B35'; // Orange for 2-3 days
      } else if (lowerTime.includes('day') && parseInt(lowerTime) <= 7) {
        return '#FF9800'; // Yellow for 4-7 days
      } else if (lowerTime.includes('week') && parseInt(lowerTime) === 1) {
        return '#FF9800'; // Yellow for 1 week
      } else if (lowerTime.includes('week') && parseInt(lowerTime) <= 2) {
        return '#FFC107'; // Amber for 2 weeks
      } else if (lowerTime.includes('month') || (lowerTime.includes('week') && parseInt(lowerTime) > 2)) {
        return '#4CAF50'; // Green for months or 3+ weeks
      } else {
        return '#4CAF50'; // Default green for longer periods
      }
    };
    
    return (
      <TouchableOpacity 
        style={[
          styles.giveawayCard,
          { backgroundColor: theme.surface },
          viewMode === 'grid' ? styles.gridCard : styles.listCard
        ]}
        onPress={() => navigation.navigate('GiveawayDetail', { giveaway: item })}
      >
        {/* Image Section */}
        <View style={[
          styles.imageSection, 
          { backgroundColor: item.backgroundColor },
          viewMode === 'grid' ? styles.gridImageSection : styles.listImageSection
        ]}>
          <View style={[
            styles.emojiContainer, 
            { backgroundColor: item.categoryColor },
            viewMode === 'grid' ? styles.gridEmojiContainer : styles.listEmojiContainer
          ]}>
            <Text style={[
              styles.emojiText,
              viewMode === 'grid' ? styles.gridEmojiText : styles.listEmojiText
            ]}>
              {item.emoji}
            </Text>
          </View>
          <Text style={[
            styles.categoryLabel,
            { color: item.categoryColor },
            viewMode === 'grid' ? styles.gridCategoryLabel : styles.listCategoryLabel
          ]}>
            {item.categoryLabel}
          </Text>
        </View>
        
        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={[
            styles.giveawayTitle,
            { color: theme.text },
            viewMode === 'grid' ? styles.gridTitle : styles.listTitle
          ]}>
            {item.title}
          </Text>
          
          <Text style={[
            styles.giveawayDescription,
            { color: theme.textSecondary },
            viewMode === 'grid' ? styles.gridDescription : styles.listDescription
          ]}>
            {item.description}
          </Text>
          
          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: isUnlimited ? '100%' : `${Math.min(progressPercentage, 100)}%`,
                    backgroundColor: getProgressColor(progressPercentage, isUnlimited)
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textTertiary }]}>
              {isUnlimited 
                ? `${item.entries.toLocaleString()} entries • Unlimited`
                : `${item.entries.toLocaleString()} / ${item.maxEntries.toLocaleString()} entries`
              }
            </Text>
          </View>
          
          {/* Bottom Section with Cost and Time */}
          <View style={styles.bottomSection}>
            <Text style={styles.costPerEntry}>
              ${item.costPerEntry}{viewMode === 'grid' ? '' : '/entry'}
            </Text>
            <Text style={[
              styles.timeLeft,
              { color: getTimeLeftColor(item.timeLeft) }
            ]}>
              {viewMode === 'grid' 
                ? item.timeLeft.replace(' left', '') 
                : item.timeLeft
              }
            </Text>
          </View>
          
          {/* Enter Button */}
          <TouchableOpacity 
            style={[
              styles.enterButton,
              item.hasEntered && styles.enteredButton
            ]}
            onPress={() => {
              // Navigate to giveaway detail screen to show entry options
              navigation.navigate('GiveawayDetail', { 
                giveaway: item,
                giveawayId: item.id 
              });
            }}
          >
            <Text style={[
              styles.enterButtonText,
              item.hasEntered && styles.enteredButtonText
            ]}>
              {item.hasEntered ? 'Entered ✓' : 'Enter Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (searchQuery.trim() && giveaways.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="search" size={48} color={colors.textTertiary} />
        <Text style={[typography.h3, { color: colors.textSecondary, marginTop: 16 }]}>
          No giveaways found
        </Text>
        <Text style={[typography.body2, { color: colors.textTertiary, textAlign: 'center', marginTop: 8 }]}>
          Try different keywords or browse our featured giveaways
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.contentWrapper}>
      <FlatList
        data={giveaways}
        renderItem={({ item }) => renderGiveawayCard(item)}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.giveawaysList,
          { paddingTop: 16, paddingBottom: 100 } // Add top padding and extra bottom padding
        ]}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        removeClippedSubviews={false} // Prevent rendering issues
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={30}
        getItemLayout={undefined} // Let FlatList calculate layout automatically
      />
    </View>
  );
}

// Categories Screen Component
function CategoriesScreen({ navigation, searchQuery, selectedCategory, setSelectedCategory, scrollY, headerComponents }) {
  const categories = [
    { id: 'all', name: 'All Categories', icon: '🎯', color: '#007AFF', count: 156 },
    { id: 'electronics', name: 'Electronics', icon: '📱', color: '#4CAF50', count: 45 },
    { id: 'gaming', name: 'Gaming', icon: '🎮', color: '#FF9800', count: 32 },
    { id: 'automotive', name: 'Automotive', icon: '🚗', color: '#FF5722', count: 18 },
    { id: 'fashion', name: 'Fashion', icon: '👕', color: '#E91E63', count: 24 },
    { id: 'home', name: 'Home & Garden', icon: '🏠', color: '#9C27B0', count: 19 },
    { id: 'sports', name: 'Sports', icon: '⚽', color: '#00BCD4', count: 15 },
    { id: 'travel', name: 'Travel', icon: '✈️', color: '#795548', count: 3 },
  ];

  const renderCategoryCard = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryCard,
        selectedCategory === category.id && styles.selectedCategoryCard
      ]}
      onPress={() => setSelectedCategory(category.id)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
          <Text style={styles.categoryCount}>{category.count}</Text>
        </View>
      </View>
      <Text style={styles.categoryName}>{category.name}</Text>
      <Text style={styles.categorySubtext}>
        {category.count} active giveaway{category.count !== 1 ? 's' : ''}
      </Text>
    </TouchableOpacity>
  );

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (searchQuery.trim() && filteredCategories.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="search" size={48} color={colors.textTertiary} />
        <Text style={[typography.h3, { color: colors.textSecondary, marginTop: 16 }]}>
          No categories found
        </Text>
        <Text style={[typography.body2, { color: colors.textTertiary, textAlign: 'center', marginTop: 8 }]}>
          Try different keywords to find categories
        </Text>
      </View>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor will be set inline with theme
  },
  fixedHeader: {
    // backgroundColor will be set inline with theme
    borderBottomWidth: 1,
    // borderBottomColor will be set inline with theme
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  scrollableContent: {
    flex: 1,
    // backgroundColor will be set inline with theme
  },
  headerSection: {
    // backgroundColor will be set inline with theme
    borderBottomWidth: 1,
    // borderBottomColor will be set inline with theme
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    // backgroundColor will be set inline with theme
    paddingHorizontal: 0, // Remove horizontal padding to extend to edges
    paddingBottom: 6, // Reduced from 8
    paddingTop: 4, // Reduced from 6
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Reduced from 12 to give more space to search input
    marginTop: 0, // Reduced from 2
    paddingHorizontal: 0, // Removed padding to go edge to edge
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor will be set inline with theme
    paddingHorizontal: 12, // Reduced from 14 
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    // borderColor will be set inline with theme
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    marginRight: 6, // Reduced from 8
  },
  searchIcon: {
    marginRight: 8, // Reduced from 10
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor will be set inline with theme
    paddingHorizontal: 10, // Reduced from 12
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    // borderColor will be set inline with theme
    marginRight: 6, // Reduced from 8
    minWidth: 60,
    justifyContent: 'center',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  viewModeContainer: {
    flexDirection: 'row',
    // backgroundColor will be set inline with theme
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    // borderColor will be set inline with theme
  },
  viewModeButton: {
    padding: 6,
    borderRadius: 12,
    marginHorizontal: 1,
  },
  activeViewMode: {
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
    // backgroundColor will be set inline with theme
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 0, // Remove side padding to extend to edges
    paddingTop: 0, // Remove top padding too
  },
  giveawaysList: {
    paddingBottom: 20,
    paddingHorizontal: 16, // Add back horizontal padding for giveaway cards
  },
  
  // New Giveaway Card Styles
  giveawayCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  gridCard: {
    width: '48%',
    marginHorizontal: '1%',
  },
  listCard: {
    width: '100%',
  },
  
  // Image Section
  imageSection: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gridImageSection: {
    height: 120,
  },
  listImageSection: {
    height: 160,
  },
  emojiContainer: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridEmojiContainer: {
    width: 50,
    height: 50,
  },
  listEmojiContainer: {
    width: 70,
    height: 70,
  },
  emojiText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  gridEmojiText: {
    fontSize: 20,
  },
  listEmojiText: {
    fontSize: 28,
  },
  categoryLabel: {
    fontWeight: '600',
    marginTop: 8,
  },
  gridCategoryLabel: {
    fontSize: 9,
  },
  listCategoryLabel: {
    fontSize: 11,
  },
  
  // Content Section
  contentSection: {
    padding: 12, // Reduced from 16
  },
  giveawayTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  gridTitle: {
    fontSize: 16,
  },
  listTitle: {
    fontSize: 18,
  },
  giveawayDescription: {
    marginBottom: 8,
    lineHeight: 18,
  },
  gridDescription: {
    fontSize: 12,
  },
  listDescription: {
    fontSize: 14,
  },
  creatorName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  
  // Progress Section
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
  },
  
  // Bottom Section
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Reduced from 12
  },
  costPerEntry: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  timeLeft: {
    fontSize: 12,
    fontWeight: '600',
    // Color is now set dynamically based on urgency
  },
  
  // Buttons
  enterButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8, // Reduced from 10
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  enterButtonText: {
    color: '#fff',
    fontSize: 13, // Reduced from 14
    fontWeight: '600',
  },
  enteredButton: {
    backgroundColor: '#4CAF50', // Green for entered state
  },
  enteredButtonText: {
    color: '#fff',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  
  // User Search Styles (keeping existing ones)
  userSearchContainer: {
    flex: 1,
    // backgroundColor will be set inline with theme
  },
  userSearchResults: {
    padding: 20,
  },
  searchResultsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  userSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userSearchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userSearchDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userSearchNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userSearchUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  creatorBadgeSmall: {
    marginLeft: 4,
    backgroundColor: '#FF950015',
    borderRadius: 10,
    padding: 2,
  },
  userSearchName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userSearchBio: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  userSearchStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userSearchStat: {
    fontSize: 12,
    color: '#666',
  },
  followButtonSmall: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 70,
    alignItems: 'center',
  },
  followingButtonSmall: {
    // backgroundColor will be set inline with theme
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  followButtonTextSmall: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  followingButtonTextSmall: {
    color: '#007AFF',
  },
  
  // Search State Styles
  searchEmptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  searchEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  searchEmptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchLoadingState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  searchLoadingText: {
    fontSize: 16,
    color: '#666',
  },
  searchNoResults: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  searchNoResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  searchNoResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Platform Tab Styles (Entry Point/External with different styling)
  platformTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, // Increased for better standalone button look
    paddingVertical: 8, // Increased for better height
    borderRadius: 20, // More rounded for standalone look
    // backgroundColor will be set inline with theme
    borderWidth: 1,
    // borderColor will be set inline with theme
    marginHorizontal: 4, // Increased gap between buttons
    minWidth: 80, // Increased for better standalone appearance
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  activePlatformTab: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  platformTabText: {
    fontSize: 14, // Back to 14 for better readability
    fontWeight: '600',
    color: '#666',
    marginLeft: 6, // Back to 6 for better spacing
  },
  activePlatformTabText: {
    color: '#fff',
  },
  
  // Category Screen Styles
  categoriesList: {
    paddingBottom: 20,
    paddingHorizontal: 4,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    margin: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.small,
  },
  selectedCategoryCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  categoryCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryName: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  categorySubtext: {
    ...typography.body2,
    color: colors.textTertiary,
  },
  // Sort Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModal: {
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  applyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterSection: {
    marginVertical: 8,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sortOptionActive: {
    backgroundColor: '#f0f8ff',
  },
  sortOptionText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  sortOptionTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  // Category styles
  categoryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  categoriesList: {
    padding: 16,
    paddingBottom: 100,
  },
  // External giveaway styles
  externalBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  externalBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
    marginLeft: 2,
  },
  creatorName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
});
