import React, { createContext, useContext, useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

const LocationContext = createContext({});

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('fixvo_user_location');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null; // Null initially until detected or selected
  });

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied', 'denied_permanently', 'disabled'
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [error, setError] = useState(null);

  // Helper to reverse geocode coordinates using Nominatim with fallback
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'FixvoApp/1.0'
          }
        }
      );
      if (!response.ok) throw new Error('Geocoding service unavailable');
      const data = await response.json();
      
      const addr = data.address || {};
      const area = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.village || addr.city_district || addr.road || 'Current Locality';
      const city = addr.city || addr.town || addr.municipality || addr.county || addr.state_district || 'Current City';
      const state = addr.state || '';
      const country = addr.country || 'India';
      const postalCode = addr.postcode || '';
      const formattedAddress = data.display_name || `${area}, ${city}, ${state}`;

      return {
        lat,
        lng,
        area,
        city,
        state,
        country,
        postalCode,
        formattedAddress,
        isRealGps: true,
        updatedAt: new Date().toISOString()
      };
    } catch (primaryErr) {
      console.warn('Nominatim reverse geocode failed, using fallback:', primaryErr.message);
      try {
        const fallbackRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        const fbData = await fallbackRes.json();
        const area = fbData.locality || fbData.subLocality || fbData.city || 'Current Locality';
        const city = fbData.city || fbData.principalSubdivision || 'Current City';
        const state = fbData.principalSubdivision || '';
        const country = fbData.countryName || 'India';
        const postalCode = fbData.postcode || '';

        return {
          lat,
          lng,
          area,
          city,
          state,
          country,
          postalCode,
          formattedAddress: `${area}, ${city}, ${state}`,
          isRealGps: true,
          updatedAt: new Date().toISOString()
        };
      } catch (fbErr) {
        console.error('All reverse geocoding attempts failed:', fbErr);
        return {
          lat,
          lng,
          area: 'Detected Location',
          city: 'GPS Coordinates',
          state: '',
          country: '',
          formattedAddress: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          isRealGps: true,
          updatedAt: new Date().toISOString()
        };
      }
    }
  };

  // Perform GPS location fetch after user clicks "Allow Location" or explicitly requests it
  const requestDeviceLocation = async () => {
    setLoadingLocation(true);
    setError(null);

    try {
      let lat, lng;

      if (Capacitor.isNativePlatform()) {
        // Request native location permission via Capacitor plugin
        const permStatus = await Geolocation.checkPermissions();
        
        if (permStatus.location === 'denied') {
          // Attempt permission request
          const reqStatus = await Geolocation.requestPermissions();
          if (reqStatus.location === 'denied') {
            setPermissionState('denied_permanently');
            setError('Location permission was denied. Please enable location permissions in App Settings.');
            setLoadingLocation(false);
            return null;
          }
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 3000
        });

        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } else {
        // Web Browser Geolocation fallback
        if (!navigator.geolocation) {
          setError('Geolocation is not supported by your browser.');
          setPermissionState('disabled');
          setLoadingLocation(false);
          return null;
        }

        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 3000
          });
        });

        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }

      setPermissionState('granted');
      const geocodedLoc = await reverseGeocode(lat, lng);
      
      setLocation(geocodedLoc);
      localStorage.setItem('fixvo_user_location', JSON.stringify(geocodedLoc));
      setShowExplanationModal(false);
      setLoadingLocation(false);
      return geocodedLoc;
    } catch (err) {
      console.error('Error fetching device location:', err);
      let errMsg = 'Unable to detect your device location.';
      if (err.code === 1 || err?.message?.toLowerCase().includes('denied')) {
        setPermissionState('denied');
        errMsg = 'Location permission was denied. You can manually select your location.';
      } else if (err.code === 2 || err?.message?.toLowerCase().includes('unavailable')) {
        setPermissionState('disabled');
        errMsg = 'Device GPS / Location services are turned off.';
      } else if (err.code === 3 || err?.message?.toLowerCase().includes('timeout')) {
        errMsg = 'Location request timed out. Please try again or select manually.';
      }

      setError(errMsg);
      setLoadingLocation(false);
      return null;
    }
  };

  const openLocationExplanationModal = () => {
    setShowExplanationModal(true);
  };

  const closeLocationExplanationModal = () => {
    setShowExplanationModal(false);
  };

  const setManualLocation = (manualData) => {
    const locObj = {
      lat: manualData.lat || null,
      lng: manualData.lng || null,
      area: manualData.area || manualData.city || 'Selected Area',
      city: manualData.city || 'Selected City',
      state: manualData.state || '',
      country: manualData.country || 'India',
      formattedAddress: manualData.formattedAddress || `${manualData.area || ''}, ${manualData.city || ''}`,
      isRealGps: false,
      updatedAt: new Date().toISOString()
    };
    setLocation(locObj);
    localStorage.setItem('fixvo_user_location', JSON.stringify(locObj));
    setShowExplanationModal(false);
    setError(null);
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        loadingLocation,
        permissionState,
        showExplanationModal,
        error,
        requestDeviceLocation,
        openLocationExplanationModal,
        closeLocationExplanationModal,
        setManualLocation
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
