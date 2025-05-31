import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurant } from '@/hooks/useRestaurant';
import { RestaurantBranch } from '@/types/branch';
import { RestaurantRoute } from '@/types/navigation';

/**
 * Edit Branches Screen
 * 
 * Allows restaurant owners to manage their branches
 * - View all branches
 * - Edit existing branches
 * - Delete branches
 * - Add new branches
 */
export default function EditBranchesScreen() {
  const { restaurant, isLoading, refreshRestaurantData } = useRestaurant();
  const [branches, setBranches] = useState<RestaurantBranch[]>([]);

  useEffect(() => {
    if (restaurant && restaurant.branches) {
      setBranches(restaurant.branches);
    }
  }, [restaurant]);

  const handleEditBranch = (branchId: number) => {
    router.push(RestaurantRoute.editBranch(branchId.toString()));
  };

  const handleDeleteBranch = (branchId: number) => {
    Alert.alert(
      'Delete Branch',
      'Are you sure you want to delete this branch? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Here you would call the API to delete the branch
            // For now, we'll just filter it out locally
            const updatedBranches = branches.filter(branch => branch.id !== branchId);
            setBranches(updatedBranches);
            // In a real implementation, you would refresh the restaurant data after successful deletion
            // refreshRestaurantData();
            Alert.alert('Branch deleted successfully');
          }
        }
      ]
    );
  };

  const handleBranchPress = (branchId: number) => {
    router.push(RestaurantRoute.branchDetails(branchId.toString()));
  };

  const renderBranchItem = ({ item }: { item: RestaurantBranch }) => (
    <TouchableOpacity 
      style={styles.branchItem}
      onPress={() => handleBranchPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.branchDetails}>
        <Text style={styles.branchName}>{item.restaurantName}</Text>
        
        <View style={styles.branchLocation}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.branchAddress}>{item.address}</Text>
        </View>
        
        {item.city && (
          <View style={styles.branchLocation}>
            <Ionicons name="business-outline" size={14} color="#666" />
            <Text style={styles.branchCity}>{item.city}</Text>
          </View>
        )}
        
        {item.phone && (
          <View style={styles.branchLocation}>
            <Ionicons name="call-outline" size={14} color="#666" />
            <Text style={styles.branchInfo}>{item.phone}</Text>
          </View>
        )}
        
        {(item.openingHours || item.closingHours) && (
          <View style={styles.branchLocation}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.branchInfo}>
              {item.openingHours && item.closingHours 
                ? `${item.openingHours} - ${item.closingHours}`
                : item.openingHours 
                  ? `Opens: ${item.openingHours}` 
                  : `Closes: ${item.closingHours}`
              }
            </Text>
          </View>
        )}
        
        {item.bookingSettings && (
          <View style={styles.bookingSettings}>
            <Text style={styles.settingsLabel}>Booking Settings:</Text>
            <View style={styles.settingsDetail}>
              <Text style={styles.settingsText}>Hours: {item.bookingSettings.openTime} - {item.bookingSettings.closeTime}</Text>
              <Text style={styles.settingsText}>Interval: {item.bookingSettings.interval} min</Text>
              <Text style={styles.settingsText}>Max Seats: {item.bookingSettings.maxSeatsPerSlot}</Text>
              <Text style={styles.settingsText}>Max Tables: {item.bookingSettings.maxTablesPerSlot}</Text>
            </View>
          </View>
        )}
        
        {item.isActive !== undefined && (
          <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.branchActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditBranch(item.id)}
        >
          <Ionicons name="pencil" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteBranch(item.id)}
        >
          <Ionicons name="trash" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B22222" />
        <Text style={styles.loadingText}>Loading branches...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      
      <View style={styles.topActions}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#B22222" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.header}>
        <Text style={styles.title}>Your Branches</Text>
        <Text style={styles.subtitle}>Manage your restaurant locations</Text>
      </View>

      {branches && branches.length > 0 ? (
        <FlatList
          data={branches}
          renderItem={renderBranchItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.branchList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>No branches added yet</Text>
          <Text style={styles.emptySubtext}>Add your first branch to get started</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => router.push(RestaurantRoute.addBranch)}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add New Branch</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  branchList: {
    padding: 16,
  },
  branchItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  branchDetails: {
    flex: 1,
  },
  branchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  branchLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  branchAddress: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  branchCity: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  branchInfo: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  branchActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#B22222',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#B22222',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  bookingSettings: {
    marginTop: 10,
  },
  settingsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  settingsDetail: {
    backgroundColor: '#f7f7f7',
    padding: 10,
    borderRadius: 5,
  },
  settingsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statusBadge: {
    padding: 5,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: '#B22222',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
  },
});
