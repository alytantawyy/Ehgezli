import apiClient from './api-client';
import { BranchListItem } from '../types/branch';

// Get all saved branches for the current user
export const getSavedBranches = async (): Promise<BranchListItem[]> => {
  try {
    const { data } = await apiClient.get<BranchListItem[]>('/saved-branch');
    return data;
  } catch (error) {
    console.error('Error fetching saved branches:', error);
    // Return empty array on error to prevent app crashes
    return [];
  }
};

// Get IDs of saved branches for the current user
export const getSavedBranchIds = async (): Promise<number[]> => {
  try {
    const { data } = await apiClient.get<number[]>('/saved-branch/ids');
    return data;
  } catch (error) {
    console.error('Error fetching saved branch IDs:', error);
    // Return empty array on error to prevent app crashes
    return [];
  }
};

// Save a branch to favorites
export const saveBranch = async (branchId: number): Promise<boolean> => {
  try {
    await apiClient.post(`/saved-branch/${branchId}`);
    return true;
  } catch (error) {
    console.error(`Error saving branch ${branchId}:`, error);
    return false;
  }
};

// Remove a branch from favorites
export const removeSavedBranch = async (branchId: number): Promise<boolean> => {
  try {
    await apiClient.delete(`/saved-branch/${branchId}`);
    return true;
  } catch (error) {
    console.error(`Error removing branch ${branchId}:`, error);
    return false;
  }
};
