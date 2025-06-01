import apiClient from './api-client';
import { BranchListItem } from '../types/branch';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to check if user is authenticated
const isAuthenticated = async (): Promise<boolean> => {
  const token = await AsyncStorage.getItem('auth_token');
  return !!token;
};

// Get all saved branches for the current user
export const getSavedBranches = async (): Promise<BranchListItem[]> => {
  try {
    // Check authentication first
    if (!(await isAuthenticated())) {
      return [];
    }
    
    const { data } = await apiClient.get<BranchListItem[]>('/saved-branch');
    return data;
  } catch (error) {
    return [];
  }
};

// Get IDs of saved branches for the current user
export const getSavedBranchIds = async (): Promise<number[]> => {
  try {
    // Check authentication first
    if (!(await isAuthenticated())) {
      return [];
    }
    
    const { data } = await apiClient.get<number[]>('/saved-branch/ids');
    return data;
  } catch (error) {
    // Return empty array on error to prevent app crashes
    return [];
  }
};

// Save a branch to favorites
export const saveBranch = async (branchId: number): Promise<boolean> => {
  try {
    // Check authentication first
    if (!(await isAuthenticated())) {
      return false;
    }
    
    await apiClient.post(`/saved-branch/${branchId}`);
    return true;
  } catch (error) {
    return false;
  }
};

// Remove a branch from favorites
export const removeSavedBranch = async (branchId: number): Promise<boolean> => {
  try {
    // Check authentication first
    if (!(await isAuthenticated())) {
      return false;
    }
    
    await apiClient.delete(`/saved-branch/${branchId}`);
    return true;
  } catch (error) {
    return false;
  }
};
