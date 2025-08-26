// App.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import MapScreen from "./src/screens/MapScreen";
import ListScreen from "./src/screens/ListScreen";
import DetailsScreen from "./src/screens/DetailsScreen";

const Stack = createNativeStackNavigator();

// Important: create the client once, outside the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // cache for 5 min
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Map" component={MapScreen} options={{ title: "EV Chargers" }} />
          <Stack.Screen name="List" component={ListScreen} options={{ title: "All Stations" }} />
          <Stack.Screen name="Details" component={DetailsScreen} options={{ title: "Station Details" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
