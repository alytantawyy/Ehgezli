import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as Location from 'expo-location';
import { updateUserLocation } from '../shared/api/client';
import { useAuth } from './auth-context';

type LocationContextType = {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  permissionStatus: Location.PermissionStatus | null;
  requestLocationPermission: () => Promise<boolean>;
  updateLocation: () => Promise<void>;
  formattedAddress: string | null;
  isLoading: boolean;
};

const LocationContext = createContext<LocationContextType>({
  location: null,
  errorMsg: null,
  permissionStatus: null,
  requestLocationPermission: async () => false,
  updateLocation: async () => {},
  formattedAddress: null,
  isLoading: false,
});

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [formattedAddress, setFormattedAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Request location permission
  const requestLocationPermission = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setIsLoading(false);
        return false;
      }
      
      await updateLocation();
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setErrorMsg('Error requesting location permission');
      setIsLoading(false);
      return false;
    }
  };

  // Update current location
  const updateLocation = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation(currentLocation);
      setErrorMsg(null);
      
      // Get address from coordinates
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        
        if (address) {
          const addressParts = [
            address.street,
            address.city,
            address.region,
            address.country
          ].filter(Boolean);
          
          setFormattedAddress(addressParts.join(', '));
        }
      } catch (error) {
        console.error('Error getting address:', error);
      }
      
      // If user is authenticated, update location on server
      if (user && currentLocation) {
        try {
          await updateUserLocation(
            currentLocation.coords.latitude.toString(),
            currentLocation.coords.longitude.toString()
          );
          console.log('Location updated on server');
        } catch (error) {
          console.error('Error updating location on server:', error);
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      setErrorMsg('Error getting current location');
    } finally {
      setIsLoading(false);
    }
  };

  // Check location permission on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(status);
        
        if (status === 'granted') {
          updateLocation();
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
      }
    })();
  }, []);

  // Update location when user logs in
  useEffect(() => {
    if (user && permissionStatus === 'granted') {
      updateLocation();
    }
  }, [user]);

  return (
    <LocationContext.Provider
      value={{
        location,
        errorMsg,
        permissionStatus,
        requestLocationPermission,
        updateLocation,
        formattedAddress,
        isLoading,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
