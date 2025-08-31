import React, { useMemo, useState, useEffect } from "react";
import { View, Text, Linking, ScrollView, Pressable, Image, Dimensions, Alert } from "react-native";
import { useStations } from "../hooks/useStations";
import { pick } from "../utils/i18n";
import useUserLocation from "../hooks/useUserLocation";
import { haversineDistanceMeters } from "../utils/geo";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFavorites } from "../hooks/useFavorites";
import { useAuth } from "../contexts";

export default function DetailsScreen({ route }: any) {
  const { id } = route.params as { id: string };
  const { data } = useStations();
  const { coords } = useUserLocation();
  const { user } = useAuth();
  const { isStationFavorited, toggleFavorite, loading: favoritesLoading } = useFavorites();
  const s = useMemo(() => data?.find(x => x.ID === id), [data, id]);

  if (!s) return <Text style={{ margin: 16 }}>Station not found.</Text>;

  // Calculate distance if user location is available
  const distance = useMemo(() => {
    if (!coords) return null;
    const meters = haversineDistanceMeters(
      coords.latitude,
      coords.longitude,
      s.latitude,
      s.longitude
    );
    return meters < 950 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
  }, [coords, s.latitude, s.longitude]);

  // Map operator names to logo files
  const getOperatorLogo = (operator: string) => {
    const logoMap: { [key: string]: any } = {
      'Unicars': require("../../assets/logo_unicars.png"),
      'Porsche Destination': require("../../assets/logo_porsche.jpg"),
      'Petrolina PCharge': require("../../assets/logo_petrolina.png"),
      'Lidl': require("../../assets/logo_lidl.svg"),
      'IKEA': require("../../assets/logo_ikea.svg"),
      'EvLoader': require("../../assets/logo_evloader.png"),
      'EKO': require("../../assets/logo_eko.png"),
      'EV Power': require("../../assets/logo_evpower.png"),
      'EAC eCharge': require("../../assets/logo_eac.png"),
      'BMW (Pilakoutas Group)': require("../../assets/logo_pilakoutas.webp")
    };
    return logoMap[operator];
  };

  const operatorLogo = getOperatorLogo(s.operator);

  const [availableMaps, setAvailableMaps] = useState<{ [key: string]: string }>({});

  // Check which map apps are installed
  useEffect(() => {
    const checkAvailableMaps = async () => {
      const latitude = s.latitude;
      const longitude = s.longitude;
      const address = `${pick(s.address)}, ${s.town?.en}`;

      // Define map apps with their URL schemes and display URLs
      const mapApps = {
        'Apple Maps': {
          scheme: 'maps://',
          url: `http://maps.apple.com/?q=${address}&ll=${latitude},${longitude}`
        },
        'Waze': {
          scheme: 'waze://',
          url: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
        },
        'Here WeGo': {
          scheme: 'here-location://',
          url: `https://wego.here.com/directions/mix/${latitude},${longitude}`
        }
      };

      const available: { [key: string]: string } = {};

      // Check each app
      for (const [appName, appData] of Object.entries(mapApps)) {
        try {
          const canOpen = await Linking.canOpenURL(appData.scheme);
          if (canOpen) {
            available[appName] = appData.url;
          }
        } catch (error) {
          // If canOpenURL fails, we'll skip this app
          console.log(`Could not check if ${appName} is installed:`, error);
        }
      }

      // Always include web-based options as fallbacks
      available['Google Maps'] = `https://maps.google.com/?q=${latitude},${longitude}`;

      setAvailableMaps(available);
    };

    checkAvailableMaps();
  }, [s.latitude, s.longitude, s.address, s.town]);

  const openDirections = () => {
    if (Object.keys(availableMaps).length === 0) {
      // If no maps are checked yet, show a simple alert
      Alert.alert(
        'Navigation',
        'Opening Google Maps...',
        [
          {
            text: 'OK',
            onPress: () => Linking.openURL(`https://maps.google.com/?q=${s.latitude},${s.longitude}`)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return;
    }

    // Create alert options from available maps
    const alertOptions: Array<{ text: string; onPress: () => void } | { text: string; style: 'cancel' }> = Object.entries(availableMaps).map(([appName, url]) => ({
      text: appName,
      onPress: () => Linking.openURL(url)
    }));

    // Add cancel option
    alertOptions.push({
      text: 'Cancel',
      style: 'cancel'
    });

    Alert.alert(
      'Choose Navigation App',
      'Select your preferred map application for directions:',
      alertOptions
    );
  };

  const reportIssue = () => {
    // TODO: Implement report issue functionality
    console.log('Report issue for station:', s.ID);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F5F6FA" }}>
      <View style={{ padding: 16, gap: 16 }}>
        {/* Header Card */}
        <View style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: "#E5E7EB"
        }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 8 }}>
            {pick(s.title)}
          </Text>

          <Text style={{ fontSize: 14, color: "#374151", marginBottom: 16 }}>
            {pick(s.address)}, {s.town?.en}
          </Text>

          {/* Favorite Button */}
          {user && (
            <View style={{ marginBottom: 16 }}>
              <Pressable
                onPress={() => {
                  toggleFavorite({
                    stationId: s.ID,
                    stationName: pick(s.title),
                    stationAddress: `${pick(s.address)}, ${s.town?.en}`,
                    stationOperator: s.operator,
                  });
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isStationFavorited(s.ID) ? '#fbbf24' : '#f3f4f6',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  opacity: pressed ? 0.7 : 1,
                })}
                disabled={favoritesLoading}
              >
                <MaterialIcons
                  name={isStationFavorited(s.ID) ? 'favorite' : 'favorite-border'}
                  size={20}
                  color={isStationFavorited(s.ID) ? '#ffffff' : '#6b7280'}
                />
                <Text style={{
                  marginLeft: 8,
                  fontSize: 14,
                  fontWeight: '600',
                  color: isStationFavorited(s.ID) ? '#ffffff' : '#6b7280',
                }}>
                  {isStationFavorited(s.ID) ? 'Favorited' : 'Add to Favorites'}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Meta Grid */}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Postcode</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>{s.postcode}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Town</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>{s.town?.en}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Country</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>Cyprus</Text>
            </View>
          </View>

          {/* Distance */}
          {distance && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Distance</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>{distance}</Text>
            </View>
          )}
        </View>

        {/* Operator Card */}
        <View style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: "#E5E7EB"
        }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Operator Logo */}
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: "#111827",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 16
            }}>
              {operatorLogo ? (
                <Image
                  source={operatorLogo}
                  style={{ width: 40, height: 40 }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>LOGO</Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Operator</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>{s.operator}</Text>
            </View>

            {/* Connections Count Badge */}
            <View style={{
              backgroundColor: "#2563EB",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 8,
              minWidth: 56,
              alignItems: "center"
            }}>
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>
                {s.connections.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Connections Card */}
        <View style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: "#E5E7EB"
        }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 16 }}>
            Connections
          </Text>

          {s.connections.map((connection, index) => (
            <View key={index} style={{
              backgroundColor: "#F9FAFB",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB"
            }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {/* Connection Icon */}
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  // backgroundColor: "#111827",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 20
                }}>
                  <MaterialCommunityIcons
                    name={(connection.type === "CCS (Type 2)" ? "ev-plug-ccs2" :
                      connection.type === "CHAdeMO" ? "ev-plug-chademo" :
                        connection.type === "Type 2 (Socket Only)" ? "ev-plug-type2" :
                          "power-plug") as any}
                    size={36}
                    color="#111827"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 4 }}>
                    {connection.type}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#374151" }}>
                    {connection.powerKW} kW • {connection.current} • qty {connection.quantity || 1}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Get Directions Button */}
        <Pressable
          onPress={openDirections}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#059669" : "#10B981",
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center"
          })}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginRight: 8 }}>
            Get Directions
          </Text>
          <MaterialIcons name="directions" size={20} color="#FFFFFF" />
        </Pressable>

        {/* Report Data Issue Button */}
        <Pressable
          onPress={reportIssue}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#DC2626" : "#EF4444",
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center"
          })}
        >
          <MaterialIcons name="report-problem" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
            Report Data Issue
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
