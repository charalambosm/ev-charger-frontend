// App.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoadingSpinner from "./src/components/LoadingSpinner";

import { AuthProvider, useAuth } from "./src/contexts";
import { MapScreen, ListScreen, DetailsScreen, LoginScreen, SignupScreen, ProfileScreen, ForgotPasswordScreen, EmailVerificationScreen } from "./src/screens";

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
  const { user } = useAuth();
  return (
    <Tab.Navigator>
      <Tab.Screen name="Map" component={MapScreen} options={{ title: "Map" }} />
      <Tab.Screen name="List" component={ListScreen} options={{ title: "List" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { user, loading, isGuest, isEmailVerified } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Loading..." />;
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
            <Stack.Screen name="Details" component={DetailsScreen} options={{ title: "Station Details" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </AuthProvider>
  );
}
