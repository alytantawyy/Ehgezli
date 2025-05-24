import React, { useState, useMemo } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Text } from '../../../components/common/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getAllBranches } from '../../../api/branch';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Branch } from '../../../types/booking';

/**
 * Restaurant Branches Screen
 * 
 * Displays and manages restaurant branches
 */
export default function BranchesScreen() {
  // Get restaurant user context
  const { user } = useAuth();

  // Fetch restaurant branches
  const { data: rawBranches = [], isLoading } = useQuery({
    queryKey: ['restaurantBranches', user?.id],
    queryFn: () => getAllBranches(),
    enabled: !!user,
  });

  /**
   * Data Transformation: RestaurantBranch → Branch
   * 
   * Purpose:
   * This transformation maps the API response data structure to match the Branch interface
   * required by our UI components. This is a temporary solution during the restructuring phase.
   * 
   * In a production environment, we would:
   * 1. Update the API to return data in the correct format
   * 2. OR update our type definitions to match the actual API response
   * 3. OR create a proper data access layer to handle these transformations consistently
   */
  const branches: Branch[] = useMemo(() => {
    return rawBranches.map(branch => ({
        id: branch.id,
        restaurantId: branch.restaurantId,
        name: branch.restaurantName,
        address: branch.address,
        city: branch.city,
        phone: branch.phone,
        openingHours: branch.openingHours,
        latitude: branch.latitude,
        longitude: branch.longitude,
        createdAt: branch.createdAt,
        updatedAt: branch.updatedAt
    }) as unknown as Branch); // Type assertion to handle optional fields
  }, [rawBranches]);

  // Render a branch item
  const renderBranchItem = ({ item }: { item: Branch }) => (
    <TouchableOpacity 
      style={styles.branchCard}
      onPress={() => router.push(`/restaurant/edit-branch?id=${item.id}` as any)}
    >
      <View style={styles.branchInfo}>
        <Text style={styles.branchName}>{item.name}</Text>
        <Text style={styles.branchAddress}>{item.address}, {item.city}</Text>
        
        <View style={styles.branchStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.statText}>{item.capacity} seats</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.statText}>{item.openingHours}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => router.push(`/restaurant/edit-branch?id=${item.id}` as any)}
      >
        <Ionicons name="create" size={20} color="#FF385C" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Branches</Text>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/restaurant/add-branch' as any)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF385C" />
          <Text style={styles.loadingText}>Loading branches...</Text>
        </View>
      ) : branches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="business" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No branches found</Text>
          <TouchableOpacity 
            style={styles.addBranchButton}
            onPress={() => router.push('/restaurant/add-branch' as any)}
          >
            <Text style={styles.addBranchText}>Add Branch</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={branches}
          renderItem={renderBranchItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF385C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  branchImage: {
    width: 100,
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchInfo: {
    flex: 1,
    padding: 12,
  },
  branchName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  branchAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  branchStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  editButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  addBranchButton: {
    backgroundColor: '#FF385C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addBranchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
});
