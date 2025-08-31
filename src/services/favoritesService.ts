// src/services/favoritesService.ts
import { auth } from '../config/firebase';
import { UserService } from './userService';

export interface FavoriteStation {
  stationId: string;
  stationName: string;
  stationAddress: string;
  stationOperator: string;
}

export interface CreateFavoriteData {
  stationId: string;
  stationName: string;
  stationAddress: string;
  stationOperator: string;
}

export class FavoritesService {
  // Get all favorite station IDs for current user
  static async getUserFavoriteStationIds(): Promise<string[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];
    
    return await UserService.getUserFavoriteStationIds(currentUser.uid);
  }

  // Check if a station is favorited by current user
  static async isStationFavorited(stationId: string): Promise<boolean> {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    
    return await UserService.isStationFavorited(currentUser.uid, stationId);
  }

  // Add a station to favorites
  static async addToFavorites(data: CreateFavoriteData): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to add favorites');
    }
    
    await UserService.addToFavorites(currentUser.uid, data.stationId);
  }

  // Remove a station from favorites
  static async removeFromFavorites(stationId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to remove favorites');
    }
    
    await UserService.removeFromFavorites(currentUser.uid, stationId);
  }

  // Toggle favorite status
  static async toggleFavorite(data: CreateFavoriteData): Promise<boolean> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to toggle favorites');
    }
    
    const isFavorited = await this.isStationFavorited(data.stationId);
    
    if (isFavorited) {
      await this.removeFromFavorites(data.stationId);
      return false;
    } else {
      await this.addToFavorites(data);
      return true;
    }
  }

  // Get favorite count for current user
  static async getFavoriteCount(): Promise<number> {
    const favoriteIds = await this.getUserFavoriteStationIds();
    return favoriteIds.length;
  }

  // Subscribe to user's favorites changes
  static subscribeToUserFavorites(
    callback: (favoriteStationIds: string[]) => void
  ) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      callback([]);
      return () => {};
    }
    
    // Subscribe to user profile changes to get real-time favorites updates
    return UserService.subscribeToCurrentUserProfile((profile) => {
      if (profile) {
        callback(profile.favorites || []);
      } else {
        callback([]);
      }
    });
  }
}

export default FavoritesService;
