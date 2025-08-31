// src/services/userService.ts
import FirestoreService, { collections } from './firestore';
import { auth } from '../config/firebase';

export interface UserProfile {
  id: string;
  uid: string; // Firebase Auth UID
  email: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  favorites?: string[]; // Array of station IDs
  preferences?: {
    language?: string;
    units?: 'metric' | 'imperial';
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface CreateUserProfileData {
  email: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  favorites?: string[];
  preferences?: {
    language?: string;
    units?: 'metric' | 'imperial';
  };
}

export class UserService {
  // Get current user's profile
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    
    return await FirestoreService.getDocument<UserProfile>(
      collections.users,
      currentUser.uid
    );
  }

  // Create a new user profile
  static async createUserProfile(userId: string, data: CreateUserProfileData): Promise<string> {
    const userData = {
      ...data,
      uid: userId, // Store the Firebase Auth UID
      favorites: data.favorites || [], // Initialize empty favorites array if not provided
      preferences: {
        language: data.preferences?.language || 'en', // Default to English ('en')
        units: data.preferences?.units || 'metric', // Default to metric
        ...data.preferences, // Allow override of defaults
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Use setDoc with the userId as the document ID instead of addDoc
    // This ensures the document ID matches the Firebase Auth UID
    const docRef = FirestoreService.getDocumentRef(collections.users, userId);
    await FirestoreService.setDocument(collections.users, userId, userData);
    
    return userId;
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    await FirestoreService.updateDocument(
      collections.users,
      userId,
      updates
    );
  }

  // Update user preferences
  static async updateUserPreferences(userId: string, preferences: UserProfile['preferences']): Promise<void> {
    await FirestoreService.updateDocument(
      collections.users,
      userId,
      { preferences }
    );
  }

  // Update last login timestamp
  static async updateLastLogin(userId: string): Promise<void> {
    await FirestoreService.updateDocument(
      collections.users,
      userId,
      { lastLoginAt: new Date() }
    );
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<UserProfile | null> {
    return await FirestoreService.getDocument<UserProfile>(
      collections.users,
      userId
    );
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    const users = await FirestoreService.getDocuments<UserProfile>(
      collections.users,
      {
        where: [{ field: 'email', operator: '==', value: email }],
        limit: 1
      }
    );
    
    return users.length > 0 ? users[0] : null;
  }

  // Delete user profile
  static async deleteUserProfile(userId: string): Promise<void> {
    await FirestoreService.deleteDocument(
      collections.users,
      userId
    );
  }

  // Subscribe to current user's profile changes
  static subscribeToCurrentUserProfile(
    callback: (profile: UserProfile | null) => void
  ) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      callback(null);
      return () => {};
    }
    
    return FirestoreService.subscribeToDocument<UserProfile>(
      collections.users,
      currentUser.uid,
      callback
    );
  }

  // Check if user profile exists
  static async userProfileExists(userId: string): Promise<boolean> {
    const profile = await this.getUserById(userId);
    return profile !== null;
  }

  // Initialize user profile if it doesn't exist
  static async initializeUserProfileIfNeeded(userId: string, email: string): Promise<void> {
    const exists = await this.userProfileExists(userId);
    if (!exists) {
      await this.createUserProfile(userId, {
        email,
        firstName: '',
        lastName: '',
        // favorites and preferences will be set with defaults in createUserProfile
      });
    }
  }

  // Add a station to user's favorites
  static async addToFavorites(userId: string, stationId: string): Promise<void> {
    const profile = await this.getUserById(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const currentFavorites = profile.favorites || [];
    if (!currentFavorites.includes(stationId)) {
      await this.updateUserProfile(userId, {
        favorites: [...currentFavorites, stationId]
      });
    }
  }

  // Remove a station from user's favorites
  static async removeFromFavorites(userId: string, stationId: string): Promise<void> {
    const profile = await this.getUserById(userId);
    if (!profile) {
      throw new Error('User profile not found');
    }

    const currentFavorites = profile.favorites || [];
    const updatedFavorites = currentFavorites.filter(id => id !== stationId);
    
    await this.updateUserProfile(userId, {
      favorites: updatedFavorites
    });
  }

  // Check if a station is in user's favorites
  static async isStationFavorited(userId: string, stationId: string): Promise<boolean> {
    const profile = await this.getUserById(userId);
    if (!profile) return false;
    
    const favorites = profile.favorites || [];
    return favorites.includes(stationId);
  }

  // Get user's favorite station IDs
  static async getUserFavoriteStationIds(userId: string): Promise<string[]> {
    const profile = await this.getUserById(userId);
    if (!profile) return [];
    
    return profile.favorites || [];
  }
}

export default UserService;
