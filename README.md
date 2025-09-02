# EV Charger Map Cyprus 🔌🗺️

A comprehensive React Native mobile application that helps electric vehicle drivers in Cyprus locate, navigate to, and manage charging stations across the island. Built with Expo, featuring real-time maps, user authentication, and a robust favorites system.

## ✨ Features

### 🗺️ **Interactive Map**
- Real-time charging station locations across Cyprus
- Interactive map with clustering for better performance
- Station details with connection types, power ratings, and availability
- Distance calculations from user location
- Support for multiple map providers

### 🔐 **User Authentication**
- Secure Firebase Authentication integration
- Email/password registration and login
- Email verification system
- Password recovery functionality
- Guest mode for browsing without account creation
- Persistent user sessions

### ⭐ **Favorites System**
- Save and manage favorite charging stations
- Real-time synchronization across devices
- Quick access to frequently used locations
- Cloud storage with Firestore

### 📱 **Multi-Language Support**
- English and Greek language support
- Localized content for all user-facing text
- Automatic language detection based on device settings

### 🔍 **Advanced Search & Filtering**
- Filter stations by connector type, power rating, and operator
- Search by location, town, or district
- Real-time filtering with instant results
- Distance-based sorting

### 📍 **Location Services**
- GPS-based location detection
- Route planning to charging stations
- Distance calculations and ETA estimates
- Offline location caching

## 🚀 Tech Stack

- **Frontend Framework**: React Native 0.79.6
- **Development Platform**: Expo SDK 53
- **Navigation**: React Navigation v7
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Backend**: Firebase (Authentication, Firestore)
- **Maps**: React Native Maps with clustering
- **Internationalization**: i18next
- **Type Safety**: TypeScript
- **Build Tool**: EAS Build

## 📱 Supported Platforms

- **iOS**: 13.0+ (iPhone & iPad)
- **Android**: 6.0+ (API level 23+)
- **Web**: Progressive Web App support

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/charalambosm/ev-charger-frontend.git
   cd ev-charger-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place them in the project root
   - Update Firebase configuration in `src/config/firebase.ts`
   - ⚠️ **Important**: These files are automatically ignored by git for security reasons
   - 📋 **Templates**: Use `google-services.json.template` and `GoogleService-Info.plist.template` as reference

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firebase Setup

1. Enable Authentication with Email/Password
2. Enable Firestore Database
3. Set up security rules for user data
4. Configure email templates for verification

## 📁 Project Structure

```
src/
├── api/                 # API integration layer
├── components/          # Reusable UI components
├── config/             # Configuration files
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── screens/            # Application screens
├── services/           # Business logic services
├── store/              # State management (Zustand)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🎯 Key Components

### Authentication System
- **AuthContext**: Global authentication state management
- **LoginScreen**: User authentication interface
- **SignupScreen**: Account creation with validation
- **EmailVerificationScreen**: Email verification flow

### Map & Location
- **MapScreen**: Interactive map with station markers
- **ChargingStationMarker**: Custom map markers with clustering
- **useUserLocation**: GPS location management hook

### Data Management
- **useStations**: Charging station data fetching
- **useFavorites**: User favorites management
- **favoritesService**: Cloud favorites synchronization

## 🚀 Building for Production

### EAS Build

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for platforms
eas build --platform ios
eas build --platform android
```

## 📄 License

This project is licensed under the 0BSD License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Open Charge Map API** for charging station data
- **Expo team** for the amazing development platform
- **React Native community** for continuous improvements
- **Firebase** for backend services

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/charalambosm/ev-charger-frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/charalambosm/ev-charger-frontend/discussions)
- **Email**: support@evchargermapcy.com

---

**Made with ❤️ for the EV community in Cyprus**

*Help us make electric vehicle charging more accessible across the island!*
