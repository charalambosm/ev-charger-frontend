// App.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoadingSpinner from "./src/components/LoadingSpinner";

import { AuthProvider, useAuth } from "./src/contexts";
import { MapScreen, ListScreen, DetailsScreen, LoginScreen, SignupScreen, ProfileScreen } from "./src/screens";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Important: create the client once, outside the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // cache for 5 min
      retry: 1,
    },
  },
});

function MainTabs() {
  const { user } = useAuth();
  
  return (
    <Tab.Navigator>
      <Tab.Screen name="Map" component={MapScreen} options={{ title: "Map" }} />
      <Tab.Screen name="List" component={ListScreen} options={{ title: "List" }} />
      {user ? (
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
      ) : (
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: "Profile" }} 
        />
      )}
    </Tab.Navigator>
  );
}

function AppContent() {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Loading..." />;
  }

  // Show main app if user is authenticated OR if they chose to continue as guest
  const shouldShowMainApp = user || isGuest;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!shouldShowMainApp ? (
          // User is not authenticated and hasn't chosen guest mode - show login screen first
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen} 
              options={{ headerShown: false }} 
            />
          </>
        ) : (
          // User is authenticated OR is a guest - show main app
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
