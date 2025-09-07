// App.tsx
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { View, Text } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import LoadingSpinner from "./src/components/LoadingSpinner";

import { AuthProvider, useAuth } from "./src/contexts";
import { MapScreen, ListScreen, FavoritesScreen, DetailsScreen, LoginScreen, SignupScreen, ProfileScreen, ForgotPasswordScreen, EmailVerificationScreen } from "./src/screens";
import { UserService } from "./src/services";
import { initializeLanguage } from "./src/utils/i18n";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function MainTabs() {
  const { user, isGuest } = useAuth();
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load user profile for initials
  useEffect(() => {
    if (user && !isGuest) {
      const loadProfile = async () => {
        try {
          const profile = await UserService.getCurrentUserProfile();
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile for tab bar:', error);
        }
      };
      loadProfile();
    }
  }, [user, isGuest]);
  
  // Create profile icon component
  const ProfileIcon = ({ color, size }: { color: string; size: number }) => {
    if (isGuest || !user) {
      return <MaterialIcons name="person" size={size} color={color} />;
    }
    
    // Extract initials similar to ProfileScreen logic
    const initials = (userProfile?.firstName?.charAt(0).toUpperCase() || '') + 
                     (userProfile?.lastName?.charAt(0).toUpperCase() || '') || 
                     user?.email?.charAt(0).toUpperCase() || 'U';
    
    return (
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{
          color: 'white',
          fontSize: size * 0.4,
          fontWeight: 'bold',
        }}>
          {initials}
        </Text>
      </View>
    );
  };
  
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ 
          title: t('navigation.map'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" size={size} color={color} />
          )
        }} 
      />
      <Tab.Screen 
        name="List" 
        component={ListScreen} 
        options={{ 
          title: t('navigation.list'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="list" size={size} color={color} />
          )
        }} 
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen} 
        options={{ 
          title: t('navigation.favorites'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="favorite" size={size} color={color} />
          )
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: t('navigation.profile'),
          tabBarIcon: ({ color, size }) => (
            <ProfileIcon color={color} size={size} />
          )
        }} 
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { user, loading, isGuest, isEmailVerified } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return <LoadingSpinner text={t('common.loading')} />;
  }

  // Check if user should see main app
  const shouldShowMainApp = (user && isEmailVerified) || isGuest;
  
  // Check if user needs email verification
  const needsEmailVerification = user && !isEmailVerified && !isGuest;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!shouldShowMainApp && !needsEmailVerification ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          </>
        ) : needsEmailVerification ? (
          <>
            <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Details" component={DetailsScreen} options={{ title: t('details.title') }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize language on app start
    initializeLanguage();
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </AuthProvider>
  );
}
