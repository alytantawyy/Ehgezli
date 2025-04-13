import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { updateUserLocation } from '../shared/api/client';
import { useAuth } from './auth-context';

// Define a type that matches the LocationObject from expo-location
interface WebLocationObject {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

type LocationContextType = {
  location: WebLocationObject | null;
  errorMsg: string | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined' | null;
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
  const [location, setLocation] = useState<WebLocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined' | null>('undetermined');
  const [formattedAddress, setFormattedAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Check if geolocation is available in the browser
  const isGeolocationAvailable = () => {
    return 'geolocation' in navigator;
  };

  // Request location permission
  const requestLocationPermission = async (): Promise<boolean> => {
    setIsLoading(true);
    
    if (!isGeolocationAvailable()) {
      setErrorMsg('Geolocation is not supported by this browser.');
      setPermissionStatus('denied');
      setIsLoading(false);
      return false;
    }
    
    try {
      // The browser will show a permission prompt when this is called
      await updateLocation();
      setPermissionStatus('granted');
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setErrorMsg('Permission to access location was denied');
      setPermissionStatus('denied');
      setIsLoading(false);
      return false;
    }
  };

  // Update current location
  const updateLocation = async (): Promise<void> => {
    setIsLoading(true);
    
    if (!isGeolocationAvailable()) {
      setErrorMsg('Geolocation is not supported by this browser.');
      setIsLoading(false);
      return;
    }
    
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Convert browser position to match expo-location format
          const webLocation: WebLocationObject = {
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude,
              accuracy: position.coords.accuracy,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
            },
            timestamp: position.timestamp,
          };
          
          setLocation(webLocation);
          setErrorMsg(null);
          
          // If user is authenticated, update location on server
          if (user) {
            try {
              updateUserLocation(
                webLocation.coords.latitude.toString(),
                webLocation.coords.longitude.toString()
              );
              console.log('Location updated on server');
            } catch (error) {
              console.error('Error updating location on server:', error);
            }
          }
          
          // Try to get address using reverse geocoding API
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${webLocation.coords.latitude}&lon=${webLocation.coords.longitude}`)
            .then((response: Response) => response.json())
            .then((data: any) => {
              if (data && data.display_name) {
                setFormattedAddress(data.display_name);
              }
            })
            .catch((error: Error) => {
              console.error('Error getting address:', error);
            })
            .finally(() => {
              setIsLoading(false);
              resolve();
            });
        },
        (error) => {
          console.error('Error getting current location:', error);
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setErrorMsg('User denied the request for Geolocation.');
              setPermissionStatus('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              setErrorMsg('Location information is unavailable.');
              break;
            case error.TIMEOUT:
              setErrorMsg('The request to get user location timed out.');
              break;
            default:
              setErrorMsg('An unknown error occurred.');
              break;
          }
          
          setIsLoading(false);
          reject(error);
        },
        { 
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      );
    });
  };

  // Check location permission on mount
  useEffect(() => {
    if (isGeolocationAvailable()) {
      navigator.permissions?.query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            setPermissionStatus('granted');
            updateLocation();
          } else if (result.state === 'prompt') {
            setPermissionStatus('undetermined');
          } else {
            setPermissionStatus('denied');
          }
        })
        .catch(() => {
          // If permissions API is not available, try to get location directly
          updateLocation().catch(() => {
            // If it fails, permission is probably denied
            setPermissionStatus('denied');
          });
        });
    } else {
      setErrorMsg('Geolocation is not supported by this browser.');
    }
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