import React, { useMemo, useState, useEffect } from 'react';
import { FlatList, View, Text, Pressable, SafeAreaView, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useAuth } from '../contexts';
import { useFavorites } from '../hooks';
import { Station } from '../types/ocm';
import useUserLocation from '../hooks/useUserLocation';
import { haversineDistanceMeters } from '../utils/geo';
import { pick } from '../utils/i18n';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

const FavoritesScreen: React.FC = ({ navigation }: any) => {
  const { user, isGuest } = useAuth();
  const { favoriteStationIds, loading, error } = useFavorites();
  const [favoriteStations, setFavoriteStations] = useState<Station[]>([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const { coords } = useUserLocation();
  const [sortMode, setSortMode] = useState<"nearest" | "az">("az");
  const [showSort, setShowSort] = useState(false);
  const [userSelectedSort, setUserSelectedSort] = useState(false);

  // Auto-switch to "nearest" when coords become available, but only if user hasn't made an explicit choice
  useEffect(() => {
    if (coords && sortMode === "az" && !userSelectedSort) {
      setSortMode("nearest");
    }
  }, [coords, sortMode, userSelectedSort]);

  // Fetch the actual station data for favorite IDs
  useEffect(() => {
    if (favoriteStationIds && favoriteStationIds.length > 0) {
      fetchFavoriteStations();
    } else {
      setFavoriteStations([]);
    }
  }, [favoriteStationIds]);

  const fetchFavoriteStations = async () => {
    setStationsLoading(true);
    try {
      // Import the stations data from assets - data is already in correct format
      const stations: Station[] = require('../../assets/charging_points.json');
      
      console.log('Total stations loaded:', stations.length);
      console.log('Favorite station IDs:', favoriteStationIds);
      
      // Filter stations to only show favorites
      const filteredStations = stations.filter(station => 
        favoriteStationIds.includes(station.ID)
      );
      
      console.log('Filtered favorite stations:', filteredStations.length);
      
      setFavoriteStations(filteredStations);
    } catch (error) {
      console.error('Error fetching favorite stations:', error);
    } finally {
      setStationsLoading(false);
    }
  };

  const sorted = useMemo(() => {
    const list = [...favoriteStations];
    if (sortMode === "nearest") {
      if (coords) {
        list.sort((a, b) => {
          const distanceA = haversineDistanceMeters(
            coords.latitude,
            coords.longitude,
            a.latitude,
            a.longitude
          );
          const distanceB = haversineDistanceMeters(
            coords.latitude,
            coords.longitude,
            b.latitude,
            b.longitude
          );
          return distanceA - distanceB;
        });
        return list;
      }
      // Fallback to A–Z when no location available
      list.sort((a, b) => a.title.en.localeCompare(b.title.en));
      return list;
    }
    if (sortMode === "az") {
      list.sort((a, b) => a.title.en.localeCompare(b.title.en));
      return list;
    }
    return list;
  }, [favoriteStations, sortMode, coords]);

  const formatDistance = (meters?: number) => {
    if (meters == null) return undefined;
    if (meters < 950) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const renderStationItem = ({ item }: { item: any }) => {
    const distanceMeters = coords ? haversineDistanceMeters(
      coords.latitude,
      coords.longitude,
      item.latitude,
      item.longitude
    ) : undefined;

    return (
      <Pressable onPress={() => navigation.navigate("Details", { id: item.ID })}>
        <View style={{ paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderColor: "#ddd", backgroundColor: "#fff" }}>
          {/* Header with title, address, operator, and logo */}
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", fontSize: 18, marginBottom: 2 }}>
                {pick(item.title)}
              </Text>
              <Text style={{ fontSize: 14, color: "#444", marginBottom: 2 }}>
                {pick(item.address)}, {pick(item.town)}
              </Text>
              <Text style={{ fontSize: 14, color: "#666", marginBottom: 2 }}>
                {item.operator}
              </Text>
              {/* Distance label */}
            {distanceMeters != null && (
                <Text style={{ fontSize: 14, color: "#666", marginBottom: 2 }}>
                  {formatDistance(distanceMeters)}
                </Text>
              )}
            </View>
            {/* Logo */}
            <View style={{
              width: 80,
              height: 80,
              justifyContent: "center",
              alignItems: "center"
            }}>
              {(() => {
                const operator = item.operator;
                // Don't show logo for 'Mall Operators' or 'Unknown'
                if (operator === 'Mall Operators' || operator === 'Unknown') {
                  return null;
                }

                // Map operator names to logo files
                const logoMap: { [key: string]: any } = {
                  'Unicars': require("../../assets/logo_unicars.png"),
                  'Porsche Destination': require("../../assets/logo_porsche.jpg"),
                  'Petrolina PCharge': require("../../assets/logo_petrolina.png"),
                  'Lidl': require("../../assets/logo_lidl.png"),
                  'IKEA': require("../../assets/logo_ikea.png"),
                  'EvLoader': require("../../assets/logo_evloader.png"),
                  'EKO': require("../../assets/logo_eko.png"),
                  'EV Power': require("../../assets/logo_evpower.png"),
                  'EAC eCharge': require("../../assets/logo_eac.png"),
                  'BMW (Pilakoutas Group)': require("../../assets/logo_pilakoutas.webp")
                };

                const logoSource = logoMap[operator];

                if (logoSource) {
                  return (
                    <Image
                      source={logoSource}
                      style={{ width: 80, height: 80 }}
                      resizeMode="contain"
                    />
                  );
                }

                return null;
              })()}
            </View>
          </View>

          {/* Main content area */}
          <View style={{
            borderWidth: 1.2,
            borderColor: "#000",
            borderRadius: 8,
            padding: 8,
          }}>
            {(() => {
              // Display each connection individually
              const individualConnections = item.connections.slice(0, 3); // Show max 3 connections

              return (
                <View style={{ alignItems: "center" }}>
                  {/* Connector types with icons */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4, width: "100%" }}>
                    {individualConnections.map((conn: any, index: number) => (
                      <View key={index} style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1, justifyContent: "center" }}>
                        <Text style={{ fontSize: 10, fontWeight: "600" }}>
                          {conn.quantity || 1}x
                        </Text>
                        <MaterialCommunityIcons
                          name={(conn.type === "CCS (Type 2)" ? "ev-plug-ccs2" :
                            conn.type === "CHAdeMO" ? "ev-plug-chademo" :
                              conn.type === "Type 2 (Socket Only)" ? "ev-plug-type2" :
                                "power-plug") as any}
                          size={40}
                          color="#000"
                        />
                      </View>
                    ))}
                  </View>

                  {/* Type names */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                    {individualConnections.map((conn: any, index: number) => (
                      <Text key={index} style={{ fontSize: 10, color: "#444", textAlign: "center", flex: 1 }}>
                        {conn.type}
                      </Text>
                    ))}
                  </View>

                  {/* Power information */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4, width: "100%" }}>
                    {individualConnections.map((conn: any, index: number) => {
                      const power = conn.powerKW || 0;
                      const currentType = conn.current?.includes("DC") ? "DC" : "AC";
                      return (
                        <Text key={index} style={{ fontSize: 10, color: "#444", textAlign: "center", flex: 1 }}>
                          {power > 0 ? `${Math.round(power)}kW ${currentType}` : `${currentType}`}
          </Text>
                      );
                    })}
                  </View>
                </View>
              );
            })()}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>⭐</Text>
      <Text style={styles.emptyTitle}>No Favorite Stations</Text>
      <Text style={styles.emptySubtitle}>
        {isGuest 
          ? 'Sign in to save your favorite charging stations'
          : 'Start adding charging stations to your favorites to see them here'
        }
      </Text>
    </View>
  );

  if (!user && !isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Favorites</Text>
          </View>
          <View style={styles.signInPrompt}>
            <Text style={styles.signInText}>
              Sign in to access your favorite charging stations
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || stationsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Favorites</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading favorites...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Favorites</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Error loading favorites. Please try again.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <FlatList
          data={sorted}
          keyExtractor={(s) => s.ID}
          ListHeaderComponent={(
            <View style={{ padding: 12, borderBottomWidth: 1, borderColor: "#eee", backgroundColor: "#fff" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.title}>Favorites</Text>
                <Pressable
                  onPress={() => setShowSort((v) => !v)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.05)",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6
                  })}
                >
                  <MaterialIcons name="sort" size={18} color="#111" />
                  <Text style={{ fontWeight: "700" }}>Sort by</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={renderEmptyState}
          renderItem={renderStationItem}
        />

        {/* Overlay to close popups when tapping outside */}
        {showSort && (
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "transparent",
              zIndex: 999
            }}
            onPress={() => {
              setShowSort(false);
            }}
          />
        )}

        {/* Sort dropdown */}
        {showSort && (
          <View style={{
            position: "absolute",
            right: 12,
            top: 60,
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 8,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            zIndex: 1000
          }}>
            <Pressable 
              onPress={() => {
                setSortMode("nearest");
                setUserSelectedSort(true);
                setShowSort(false);
              }}
              style={({ pressed }) => ({
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: sortMode === "nearest" ? "#ccc" : pressed ? "#f1f1f1" : "transparent"
              })}
            >
              <Text style={{ fontWeight: sortMode === "nearest" ? "600" : "400" }}>Distance</Text>
            </Pressable>
            <Pressable 
              onPress={() => {
                setSortMode("az");
                setUserSelectedSort(true);
                setShowSort(false);
              }}
              style={({ pressed }) => ({
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: sortMode === "az" ? "#ccc" : pressed ? "#f1f1f1" : "transparent"
              })}
            >
              <Text style={{ fontWeight: sortMode === "az" ? "600" : "400" }}>A-Z</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  signInPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  signInText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default FavoritesScreen;
