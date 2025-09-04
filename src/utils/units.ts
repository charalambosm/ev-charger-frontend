import { useTranslation } from 'react-i18next';

// Conversion constants
const METERS_TO_FEET = 3.28084;
const METERS_TO_MILES = 0.000621371;
const KILOMETERS_TO_MILES = 0.621371;

export interface UserPreferences {
  units?: 'metric' | 'imperial';
}

/**
 * Format distance based on user's unit preference
 * @param meters Distance in meters
 * @param units User's unit preference ('metric' or 'imperial')
 * @returns Formatted distance string
 */
export const formatDistance = (meters: number, units: 'metric' | 'imperial' = 'metric'): string => {
  if (units === 'imperial') {
    // Imperial units (feet/miles)
    if (meters < 304.8) { // Less than 1000 feet
      const feet = Math.round(meters * METERS_TO_FEET);
      return `${feet} ft`;
    } else {
      const miles = meters * METERS_TO_MILES;
      return `${miles.toFixed(1)} mi`;
    }
  } else {
    // Metric units (meters/kilometers)
    if (meters < 950) {
      return `${Math.round(meters)} m`;
    } else {
      const kilometers = meters / 1000;
      return `${kilometers.toFixed(1)} km`;
    }
  }
};

/**
 * Hook to get formatted distance with user's preferred units
 * @param meters Distance in meters
 * @param userPreferences User's preferences object
 * @returns Formatted distance string
 */
export const useFormattedDistance = (meters?: number, userPreferences?: UserPreferences): string | undefined => {
  if (meters == null) return undefined;
  
  const units = userPreferences?.units || 'metric';
  return formatDistance(meters, units);
};
