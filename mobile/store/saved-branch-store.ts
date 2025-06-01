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
    console.log('Fetched saved branches:', branches.length);
    set({ savedBranches: branches, loading: false });
  },
  
  // Fetch just the IDs of saved branches (more efficient)
  fetchSavedBranchIds: async () => {
    set({ loading: true, error: null });
    const ids = await getSavedBranchIds();
    console.log('Fetched saved branch IDs:', ids.length, ids);
    set({ savedBranchIds: ids, loading: false });
  },
  
  // Toggle a branch as saved/unsaved
  toggleSavedBranch: async (branchId: number) => {
    const { savedBranchIds, savedBranches } = get();
    const isSaved = savedBranchIds.includes(branchId);
    console.log(`Toggling branch ${branchId}, current status:`, isSaved ? 'saved' : 'not saved');
    
    // Optimistically update UI
    if (isSaved) {
      // Remove from saved
      set({
        savedBranchIds: savedBranchIds.filter(id => id !== branchId),
        savedBranches: savedBranches.filter(branch => branch.branchId !== branchId)
      });
      
      // Then perform API call
      const success = await removeSavedBranch(branchId);
      console.log(`Remove branch ${branchId} result:`, success ? 'success' : 'failed');
      
      if (!success) {
        // Revert on failure
        console.log('Reverting optimistic update after failure');
        get().fetchSavedBranchIds();
      }
    } else {
      // Add to saved
      set({
        savedBranchIds: [...savedBranchIds, branchId]
      });
      
      // Then perform API call
      const success = await saveBranch(branchId);
      console.log(`Save branch ${branchId} result:`, success ? 'success' : 'failed');
      
      if (!success) {
        // Revert on failure
        console.log('Reverting optimistic update after failure');
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