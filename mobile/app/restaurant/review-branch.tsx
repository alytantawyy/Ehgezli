import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRestaurant } from '@/hooks/useRestaurant';
import { CreateBranchData, CreateBookingSettingsData } from '@/types/branch';
import { useBranchStore } from '@/store/branch-store';

/**
 * Review Branch Screen
 * 
 * Displays all branch information for review before final submission
 */
export default function ReviewBranchScreen() {
  const { refreshRestaurantData } = useRestaurant();
  const { createBranch } = useBranchStore();
  const params = useLocalSearchParams<{
    address: string;
    city: string;
    phone: string;
    openTime: string;
    closeTime: string;
    interval: string;
    maxSeats: string;
    maxTables: string;
    formattedOpenTime: string;
    formattedCloseTime: string;
    latitude: string;
    longitude: string;
    hasValidCoordinates: string;
  }>();
  
  const [loading, setLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState('');
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Generating time slots...');
      
      // Prepare booking settings data
      const bookingSettings: CreateBookingSettingsData = {
        openTime: params.openTime,
        closeTime: params.closeTime,
        interval: Number(params.interval),
        maxSeatsPerSlot: Number(params.maxSeats),
        maxTablesPerSlot: Number(params.maxTables)
      };
      
      // Parse coordinates from params
      const latitude = parseFloat(params.latitude || '0');
      const longitude = parseFloat(params.longitude || '0');
      
      console.log('📍 Creating branch with coordinates:', { latitude, longitude });
      
      // Prepare branch data
      const branchData: CreateBranchData = {
        address: params.address,
        city: params.city,
        phone: params.phone || undefined,
        latitude,
        longitude,
        bookingSettings
      };
      
      // Call branch store to create branch
      await createBranch(branchData);
      
      // Refresh restaurant data to include the new branch
      await refreshRestaurantData();
      
      // Show success message
      Alert.alert(
        'Success',
        'Branch added successfully!',
        [{ text: 'OK', onPress: () => router.push('/restaurant/edit-branches') }]
      );
    } catch (error: any) {
      console.error('Error creating branch:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create branch. Please try again.'
      );
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleEdit = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#f8f8f8" 
          translucent={false}
        />
        
        <View style={styles.topActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#B22222" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Review Branch Information</Text>
        </View>
      
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Branch Information</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={styles.infoValue}>{params.address}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>City:</Text>
                <Text style={styles.infoValue}>{params.city}</Text>
              </View>
              
              {params.phone ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{params.phone}</Text>
                </View>
              ) : null}
            </View>
            
            <Text style={[styles.sectionTitle, styles.bookingSettingsTitle]}>Booking Settings</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Opening Time:</Text>
                <Text style={styles.infoValue}>{params.formattedOpenTime}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Closing Time:</Text>
                <Text style={styles.infoValue}>{params.formattedCloseTime}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Booking Interval:</Text>
                <Text style={styles.infoValue}>{params.interval} minutes</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Maximum Seats:</Text>
                <Text style={styles.infoValue}>{params.maxSeats}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Maximum Tables:</Text>
                <Text style={styles.infoValue}>{params.maxTables}</Text>
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEdit}
                disabled={loading}
              >
                <Ionicons name="pencil-outline" size={20} color="#555" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={{ color: '#fff', marginLeft: 8, fontWeight: '500' }}>
                      Generating time slots...
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Submit</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 15,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  bookingSettingsTitle: {
    marginTop: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  infoLabel: {
    width: 120,
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
  },
  editButtonText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 5,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#B22222',
    borderRadius: 8,
    width: '100%',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 5,
  },
});
