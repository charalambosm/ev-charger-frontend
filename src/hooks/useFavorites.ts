// src/hooks/useFavorites.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { FavoritesService, CreateFavoriteData } from '../services';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favoriteStationIds, setFavoriteStationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load favorites on mount and when user changes
  useEffect(() => {
    if (!user) {
      setFavoriteStationIds([]);
      return;
    }

    setLoading(true);
    setError(null);

    const loadFavorites = async () => {
      try {
        const userFavoriteIds = await FavoritesService.getUserFavoriteStationIds();
        setFavoriteStationIds(userFavoriteIds);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load favorites');
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = FavoritesService.subscribeToUserFavorites((userFavoriteIds) => {
      setFavoriteStationIds(userFavoriteIds);
    });

    return unsubscribe;
  }, [user]);

  const addToFavorites = async (data: CreateFavoriteData): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated to add favorites');
      return false;
    }

    try {
      setError(null);
      await FavoritesService.addToFavorites(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to favorites');
      return false;
    }
  };

  const removeFromFavorites = async (stationId: string): Promise<boolean> => {
    if (!user) {
      setError('User must be authenticated to remove favorites');
      return false;
    }

    try {
      setError(null);
      await FavoritesService.removeFromFavorites(stationId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from favorites');
      return false;
    }
  };

  const toggleFavorite = async (data: CreateFavoriteData): Promise<boolean> => {
    try {
      setError(null);
      return await FavoritesService.toggleFavorite(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
      return false;
    }
  };

  const isStationFavorited = (stationId: string): boolean => {
    return favoriteStationIds.includes(stationId);
  };

  const getFavoriteCount = (): number => {
    return favoriteStationIds.length;
  };



  const clearError = () => setError(null);

  return {
    favoriteStationIds,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isStationFavorited,
    getFavoriteCount,
    clearError,
  };
};
