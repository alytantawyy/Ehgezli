// /hooks/useSavedBranches.ts
import { useEffect, useRef } from 'react';
import { useSavedBranchStore } from '../store/saved-branch-store';
import { useAuth } from './useAuth';

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
  
  const { user } = useAuth();
  const initialized = useRef(false);
  
  // Initialize on component mount
  useEffect(() => {
    const init = async () => {
      // Mark as initialized immediately to prevent multiple calls
      initialized.current = true;
      
      // Only fetch if user is logged in
      if (user) {
        // Fetch IDs first (faster)
        await fetchSavedBranchIds();
        // Then fetch full branch data
        await fetchSavedBranches();
      }
    };
    
    // Only initialize once
    if (!initialized.current) {
      init();
    }
    
    // Reset when user changes
    return () => {
      initialized.current = false;
    };
  }, [user, fetchSavedBranchIds, fetchSavedBranches]);
  
  // Helper function to check if a branch is saved
  const isBranchSaved = (branchId: number): boolean => {
    return savedBranchIds.includes(branchId);
  };
  
  return {
    savedBranches,
    savedBranchIds,
    loading,
    error,
    toggleSavedBranch,
    isBranchSaved,
    refreshSavedBranches: fetchSavedBranches,
    clearError
  };
};