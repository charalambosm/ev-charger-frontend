# Firestore Integration

This app now includes full Firestore integration for managing user data, favorites, and charging history.

## Features Added

### 1. Core Firestore Service (`src/services/firestore.ts`)
- Generic CRUD operations for any collection
- Real-time subscriptions with `onSnapshot`
- Batch write operations
- Transaction support
- Query building with where clauses, ordering, and pagination

### 2. User Profile Management (`src/services/userService.ts`)
- Create and manage user profiles
- Store user preferences (language: 'en' for English, 'gr' for Greek, units: 'metric'/'imperial') with sensible defaults
- Track user metadata (creation date, last login, etc.)
- Firebase Auth UID integration for secure document access
- Automatic initialization of favorites array and default preferences

### 3. Favorites System (`src/services/favoritesService.ts`)
- Add/remove charging stations to favorites
- Store favorites as array of station IDs in user profile
- Real-time updates via user profile subscription
- Simplified and efficient data structure

### 4. Language Selection UI (`src/screens/ProfileScreen.tsx`)
- Dedicated modal for language selection (English/Greek only)
- Stores 'en' for English and 'gr' for Greek in Firestore
- Visual feedback for currently selected language
- Immediate update without additional confirmation



## Usage Examples

### Using the Favorites Hook

```tsx
import { useFavorites } from '../hooks/useFavorites';

function MyComponent() {
  const { 
    favorites, 
    loading, 
    error, 
    toggleFavorite, 
    isStationFavorited 
  } = useFavorites();

  const handleFavorite = async () => {
    const success = await toggleFavorite({
      stationId: 'station123',
      stationName: 'Charging Station',
      stationAddress: '123 Main St',
      stationOperator: 'EV Power'
    });
    
    if (success) {
      console.log('Favorite toggled successfully');
    }
  };

  return (
    <View>
      {favorites.map(favorite => (
        <Text key={favorite.id}>{favorite.stationName}</Text>
      ))}
    </View>
  );
}
```



### Direct Service Usage

```tsx
import { FavoritesService } from '../services';

// Add to favorites
const favoriteId = await FavoritesService.addToFavorites({
  stationId: 'station123',
  stationName: 'Charging Station',
  stationAddress: '123 Main St',
  stationOperator: 'EV Power'
});

// Get user favorites
const favorites = await FavoritesService.getUserFavorites();

// Subscribe to real-time updates
const unsubscribe = FavoritesService.subscribeToUserFavorites((favorites) => {
  console.log('Favorites updated:', favorites);
});

// Clean up subscription
unsubscribe();
```

## Database Structure

### Collections

1. **users** - User profiles, preferences, and favorites (as array)
2. **userPreferences** - Extended user preferences
3. **chargingStations** - Charging station data (future use)

### Default Values

When a new user profile is created, the following defaults are automatically set:

- **Language**: `'en'` (English)
- **Units**: `'metric'` (Metric system)
- **Favorites**: `[]` (Empty array)
- **Preferences**: Object with language and units defaults

These defaults ensure a consistent user experience and can be overridden by the user later.

### Security Rules

Make sure to set up proper Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    
    
    
  }
}
```

## Real-time Features

The app includes real-time updates for:
- User profile changes
- Favorites additions/removals

All subscriptions automatically clean up when components unmount.

## Error Handling

All services include comprehensive error handling:
- Authentication checks
- Network error handling
- User-friendly error messages
- Graceful fallbacks

## Performance Considerations

- Pagination support for large datasets
- Efficient queries with proper indexing
- Batch operations for multiple updates
- Real-time subscriptions only when needed

## Future Enhancements

- Offline support with Firestore offline persistence
- Advanced search with Algolia integration
- Push notifications for charging session updates
- Data analytics and reporting
- Multi-language support for user preferences
