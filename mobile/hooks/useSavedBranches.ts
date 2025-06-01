// /hooks/useSavedBranches.ts
import { useEffect, useRef, useCallback } from 'react';
import { useSavedBranchStore } from '../store/saved-branch-store';
import { useAuth } from './useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSavedBranches = () => {
  const { 
    savedBranches, 
    savedBranchIds, 
    loading, 
    error, 
    fetchSavedBranches, 
    fetchSavedBranchIds, 
    toggleSavedBranch, 
    clearError 
  } = useSavedBranchStore();
  
  const { user, isAuthenticated } = useAuth();
  const initialized = useRef(false);
  
  // Initialize on component mount or when user changes
  useEffect(() => {
    // Skip initialization if already done for this user
    if (initialized.current && user) {
      return;
    }
    
    const init = async () => {
      // Check if we have a token before trying to fetch
      const token = await AsyncStorage.getItem('auth_token');
      
      // Only fetch if user is logged in AND we have a token
      if (user && token) {
        // Fetch IDs first (faster)
        await fetchSavedBranchIds();
        // Then fetch full branch data
        await fetchSavedBranches();
        // Mark as initialized after successful fetch
        initialized.current = true;
      } else {
        // If we have no user or token, make sure saved branches are empty
        if (savedBranchIds.length > 0 || savedBranches.length > 0) {
          useSavedBranchStore.setState({ savedBranchIds: [], savedBranches: [] });
        }
      }
    };
    
    // Initialize if not already done or if user changed
    init();
    
    // Reset initialization flag when user changes
    return () => {
      if (user === null) {
        initialized.current = false;
      }
    };
  }, [user, fetchSavedBranchIds, fetchSavedBranches]);
  
  // Helper function to check if a branch is saved
  const isBranchSaved = useCallback((branchId: number): boolean => {
    // If user is not logged in, nothing is saved
    if (!user) return false;
    return savedBranchIds.includes(branchId);
  }, [savedBranchIds, user]);
  
  // Wrapper for toggleSavedBranch that ensures proper UI updates
  const handleToggleSave = useCallback(async (branchId: number) => {
    // If user is not logged in, don't try to toggle
    if (!user) {
      return;
    }
    
    // Double check token existence before trying to toggle
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      return;
    }
    
    await toggleSavedBranch(branchId);
  }, [toggleSavedBranch, user]);
  
  return {
    savedBranches,
    savedBranchIds,
    loading,
    error,
    toggleSavedBranch: handleToggleSave,
    isBranchSaved,
    refreshSavedBranches: fetchSavedBranches,
    clearError
  };
};