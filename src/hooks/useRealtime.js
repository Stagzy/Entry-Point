import { useState, useEffect, useCallback } from 'react';
import { realtimeService } from '../services/realtimeService';

/**
 * Custom hook for real-time giveaway updates
 */
export const useRealtimeGiveaway = (giveaway) => {
  const [liveData, setLiveData] = useState({
    soldTickets: giveaway?.soldTickets || 0,
    totalEntries: 0,
    recentEntries: [],
    isLoading: true
  });

  const [subscription, setSubscription] = useState(null);

  // Update live entry count
  const updateLiveData = useCallback(async () => {
    if (!giveaway?.id) return;

    try {
      const [entryCount, recentEntries] = await Promise.all([
        realtimeService.getLiveEntryCount(giveaway.id),
        realtimeService.getRecentEntries(giveaway.id, 5)
      ]);

      setLiveData(prev => ({
        ...prev,
        soldTickets: entryCount,
        totalEntries: recentEntries.length,
        recentEntries: recentEntries,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error updating live data:', error);
      setLiveData(prev => ({ ...prev, isLoading: false }));
    }
  }, [giveaway?.id]);

  // Handle real-time updates
  const handleRealtimeUpdate = useCallback((payload) => {
    console.log('🔄 Processing real-time update:', payload.eventType);
    
    // Update data when entries change
    if (payload.eventType === 'INSERT') {
      // New entry added
      setLiveData(prev => ({
        ...prev,
        soldTickets: prev.soldTickets + (payload.new?.ticket_count || 1),
        totalEntries: prev.totalEntries + 1
      }));
      
      // Refresh recent entries
      updateLiveData();
    } else if (payload.eventType === 'DELETE') {
      // Entry removed (refund case)
      setLiveData(prev => ({
        ...prev,
        soldTickets: Math.max(0, prev.soldTickets - (payload.old?.ticket_count || 1)),
        totalEntries: Math.max(0, prev.totalEntries - 1)
      }));
    }
  }, [updateLiveData]);

  // Set up real-time subscription
  useEffect(() => {
    if (!giveaway?.id) return;

    console.log('🚀 Setting up real-time subscription for giveaway:', giveaway.id);
    
    // Initial data load
    updateLiveData();

    // Subscribe to real-time updates
    const sub = realtimeService.subscribeToGiveawayEntries(
      giveaway.id,
      handleRealtimeUpdate
    );
    
    setSubscription(sub);

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      if (sub) {
        realtimeService.unsubscribe(sub);
      }
    };
  }, [giveaway?.id, handleRealtimeUpdate, updateLiveData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    updateLiveData();
  }, [updateLiveData]);

  return {
    liveData,
    refresh,
    isSubscribed: !!subscription
  };
};

/**
 * Hook for user-specific real-time updates
 */
export const useRealtimeUserActivity = (userId) => {
  const [userActivity, setUserActivity] = useState({
    recentEntries: [],
    totalSpent: 0,
    entriesCount: 0
  });

  const handleUserUpdate = useCallback((payload) => {
    if (payload.eventType === 'INSERT') {
      setUserActivity(prev => ({
        ...prev,
        entriesCount: prev.entriesCount + 1,
        totalSpent: prev.totalSpent + (payload.new?.total_cost || 0)
      }));
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    try {
      const subscription = realtimeService.subscribeToUserEntries(
        userId,
        handleUserUpdate
      );

      return () => {
        if (subscription) {
          realtimeService.unsubscribe(subscription);
        }
      };
    } catch (error) {
      console.log('⚠️ Realtime subscription error (using mock mode):', error.message);
    }
  }, [userId, handleUserUpdate]);

  return userActivity;
};

/**
 * Hook for winner announcements
 */
export const useRealtimeWinners = () => {
  const [winners, setWinners] = useState([]);
  const [latestWinner, setLatestWinner] = useState(null);

  const handleWinnerUpdate = useCallback((payload) => {
    const newWinner = payload.new;
    setWinners(prev => [newWinner, ...prev]);
    setLatestWinner(newWinner);
    
    // Clear latest winner after 10 seconds
    setTimeout(() => setLatestWinner(null), 10000);
  }, []);

  useEffect(() => {
    const subscription = realtimeService.subscribeToWinners(handleWinnerUpdate);

    return () => {
      if (subscription) {
        realtimeService.unsubscribe(subscription);
      }
    };
  }, [handleWinnerUpdate]);

  return { winners, latestWinner };
};
