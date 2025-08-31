// src/services/index.ts
export { default as FirestoreService } from './firestore';
export { default as UserService } from './userService';
export { default as FavoritesService } from './favoritesService';

// Export types
export type {
  FirestoreDocument,
  QueryOptions,
} from './firestore';

export type {
  UserProfile,
  CreateUserProfileData,
} from './userService';

export type {
  FavoriteStation,
  CreateFavoriteData,
} from './favoritesService';

// Export collections
export { collections } from './firestore';
