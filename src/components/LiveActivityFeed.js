import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileAvatar from './ProfileAvatar';

/**
 * Live Activity Feed Component
 * Shows real-time entry updates with smooth animations
 */
export default function LiveActivityFeed({ recentEntries, isVisible, onToggle }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const entryTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - entryTime) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const renderEntry = ({ item, index }) => (
    <Animated.View
      style={[
        styles.entryItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.entryContent}>
        <ProfileAvatar 
          user={item.user} 
          size={32}
          style={styles.avatar}
        />
        <View style={styles.entryInfo}>
          <Text style={styles.username}>
            {item.user?.display_name || item.user?.username || 'Anonymous'}
          </Text>
          <Text style={styles.entryText}>
            entered with {item.ticket_count} ticket{item.ticket_count !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTimeAgo(item.created_at)}</Text>
          <View style={styles.ticketBadge}>
            <Ionicons name="ticket" size={12} color="#666" />
            <Text style={styles.ticketCount}>{item.ticket_count}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="pulse" size={16} color="#4CAF50" />
          <Text style={styles.headerTitle}>Live Activity</Text>
          <View style={styles.liveDot} />
        </View>
        <TouchableOpacity onPress={onToggle} style={styles.closeButton}>
          <Ionicons name="chevron-up" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {recentEntries.length > 0 ? (
        <FlatList
          data={recentEntries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="hourglass-outline" size={24} color="#999" />
          <Text style={styles.emptyText}>Waiting for entries...</Text>
        </View>
      )}
    </Animated.View>
  );
}

/**
 * Live Stats Bar Component
 * Shows updating entry count with animations
 */
export function LiveStatsBar({ soldTickets, totalTickets, change }) {
  const [bounceAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (change !== 0) {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [soldTickets]);

  const progressPercentage = totalTickets > 0 ? (soldTickets / totalTickets) * 100 : 0;

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statsHeader}>
        <View style={styles.statsLeft}>
          <Ionicons name="people" size={16} color="#4CAF50" />
          <Text style={styles.statsLabel}>Entries</Text>
          {change > 0 && (
            <View style={styles.changeIndicator}>
              <Ionicons name="arrow-up" size={12} color="#4CAF50" />
              <Text style={styles.changeText}>+{change}</Text>
            </View>
          )}
        </View>
        <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
          <Text style={styles.statsValue}>
            {soldTickets} / {totalTickets}
          </Text>
        </Animated.View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill,
              { width: `${Math.min(progressPercentage, 100)}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{progressPercentage.toFixed(1)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  list: {
    maxHeight: 200,
  },
  entryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  entryInfo: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  entryText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  ticketCount: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  // Live Stats Bar Styles
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  changeText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 2,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginLeft: 8,
    minWidth: 35,
    textAlign: 'right',
  },
});
