// /store/saved-branch-store.ts
import { create } from 'zustand';
import { 
  getSavedBranches, 
  getSavedBranchIds, 
  saveBranch, 
  removeSavedBranch 
} from '../api/savedBranch';
import { BranchListItem } from '../types/branch';

interface SavedBranchState {
  // Data
  savedBranches: BranchListItem[];
  savedBranchIds: number[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSavedBranches: () => Promise<void>;
  fetchSavedBranchIds: () => Promise<void>;
  toggleSavedBranch: (branchId: number) => Promise<void>;
  clearError: () => void;
}

export const useSavedBranchStore = create<SavedBranchState>((set, get) => ({
  // Initial state
  savedBranches: [],
  savedBranchIds: [],
  loading: false,
  error: null,
  
  // Fetch all saved branches
  fetchSavedBranches: async () => {
    set({ loading: true, error: null });
    const branches = await getSavedBranches();
    set({ savedBranches: branches, loading: false });
    // Note: Error handling is now in the API function
  },
  
  // Fetch just the IDs of saved branches (more efficient)
  fetchSavedBranchIds: async () => {
    set({ loading: true, error: null });
    const ids = await getSavedBranchIds();
    set({ savedBranchIds: ids, loading: false });
    // Note: Error handling is now in the API function
  },
  
  // Toggle a branch as saved/unsaved
  toggleSavedBranch: async (branchId: number) => {
    const { savedBranchIds, savedBranches } = get();
    const isSaved = savedBranchIds.includes(branchId);
    
    // Optimistically update UI
    if (isSaved) {
      set({
        savedBranchIds: savedBranchIds.filter(id => id !== branchId),
        savedBranches: savedBranches.filter(branch => branch.branchId !== branchId)
      });
      
      // Then perform API call
      const success = await removeSavedBranch(branchId);
      if (!success) {
        // Revert on failure
        get().fetchSavedBranchIds();
      }
    } else {
      set({
        savedBranchIds: [...savedBranchIds, branchId]
      });
      
      // Then perform API call
      const success = await saveBranch(branchId);
      if (!success) {
        // Revert on failure
        get().fetchSavedBranchIds();
      } else {
        // Refresh the full list to get the complete branch data
        get().fetchSavedBranches();
      }
    }
  },
  
  // Clear error state
  clearError: () => set({ error: null })
}));