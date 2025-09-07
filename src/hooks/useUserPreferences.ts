import { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { UserService } from '../services';

export interface UserPreferences {
  units?: 'metric' | 'imperial';
  language?: string;
}

export const useUserPreferences = () => {
  const { user, isGuest } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPreferences = async () => {
    if (!user || isGuest) {
      setPreferences({ units: 'metric', language: 'en' });
      return;
    }

    setLoading(true);
    try {
      const profile = await UserService.getCurrentUserProfile();
      setPreferences(profile?.preferences || { units: 'metric', language: 'en' });
    } catch (error) {
      console.error('Error loading user preferences:', error);
      setPreferences({ units: 'metric', language: 'en' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [user, isGuest]);

  const refreshPreferences = () => {
    loadPreferences();
  };

  return {
    preferences,
    loading,
    refreshPreferences
  };
};
