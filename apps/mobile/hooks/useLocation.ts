import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado');
        return;
      }
      Location.getCurrentPositionAsync({}).then(setLocation);
    });
  }, []);

  return { location, error };
}
