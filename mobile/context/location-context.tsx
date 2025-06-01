import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationContextType {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  isLoading: boolean;
  requestLocationPermission: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType>({
  location: null,
  errorMsg: null,
  isLoading: true,
  requestLocationPermission: async () => {},
});

export const useLocation = () => useContext(LocationContext);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const requestLocationPermission = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setErrorMsg(null);
    } catch (error) {
      setErrorMsg('Could not get location');
      console.error('Error getting location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        errorMsg,
        isLoading,
        requestLocationPermission,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
