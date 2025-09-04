import React, { useMemo, useState, useEffect } from "react";
import { View, Text, Linking, ScrollView, Pressable, Image, Dimensions, Alert } from "react-native";
import { useStations } from "../hooks/useStations";
import { pick } from "../utils/i18n";
import { useTranslation } from 'react-i18next';
import { formatDistance } from "../utils/units";
import { UserService } from "../services";
import useUserLocation from "../hooks/useUserLocation";
import { haversineDistanceMeters } from "../utils/geo";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFavorites } from "../hooks/useFavorites";
import { useAuth } from "../contexts";

export default function DetailsScreen({ route }: any) {
  const { id } = route.params as { id: string };
  const { data } = useStations();
  const { coords } = useUserLocation();
  const { user, isGuest } = useAuth();
  const { t } = useTranslation();
  const { isStationFavorited, toggleFavorite, loading: favoritesLoading } = useFavorites();
  const s = useMemo(() => data?.find(x => x.ID === id), [data, id]);
  const [userPreferences, setUserPreferences] = useState<any>(null);

  // Load user preferences
  useEffect(() => {
    if (user && !isGuest) {
      const loadPreferences = async () => {
        try {
          const profile = await UserService.getCurrentUserProfile();
          setUserPreferences(profile?.preferences);
        } catch (error) {
          console.error('Error loading user preferences:', error);
        }
      };
      loadPreferences();
    }
  }, [user, isGuest]);

  if (!s) return <Text style={{ margin: 16 }}>{t('details.stationNotFound')}</Text>;

  // Calculate distance if user location is available
  const distance = useMemo(() => {
    if (!coords) return null;
    const meters = haversineDistanceMeters(
      coords.latitude,
      coords.longitude,
      s.latitude,
      s.longitude
    );
    const units = userPreferences?.units || 'metric';
    return formatDistance(meters, units);
  }, [coords, s.latitude, s.longitude, userPreferences?.units]);

  // Map operator names to logo files
  const getOperatorLogo = (operator: string) => {
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
    const email = 'evchargermapcyprus@googlegroups.com';
    const subject = `Report Issue for Station ID ${s.ID}`;
    const body = `Please describe the issue:\n\n\n\n--- Station Details ---\nStation: ${pick(s.title)}\nAddress: ${pick(s.address)}\nPostcode: ${s.postcode}\nTown: ${s.town?.en}\nDistrict: ${pick(s.district)}\nOperator: ${s.operator}\nConnections: ${s.connections.map(c => c.type).join(', ')}`;
    
    // Create mailto URL
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Try to open the email app
    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(mailtoUrl);
        } else {
          // Fallback: show alert with email details
          Alert.alert(
            'Email App Not Available',
            `Please send an email manually to:\n\n${email}\n\nSubject: ${subject}`,
            [
              {
                text: 'Copy Email Address',
                onPress: () => {
                  // Note: Clipboard API would need to be imported and used here
                  // For now, just show the email address
                  Alert.alert('Email Address', email);
                }
              },
              {
                text: 'OK',
                style: 'cancel'
              }
            ]
          );
        }
      })
      .catch((error) => {
        console.error('Error opening email app:', error);
        Alert.alert(
          'Error',
          'Could not open email app. Please send an email manually to evchargermapcyprus@googlegroups.com'
        );
      });
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
                  backgroundColor: isStationFavorited(s.ID) ? '#ef4444' : '#f3f4f6',
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
                  {isStationFavorited(s.ID) ? t('details.removeFromFavorites') : t('details.addToFavorites')}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Meta Grid */}
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{t('details.postcode')}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>{s.postcode}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{t('details.town')}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>{s.town?.en}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{t('details.country')}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>Cyprus</Text>
            </View>
          </View>

          {/* Distance */}
          {distance && (
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{t('details.distance')}</Text>
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
            {operatorLogo && (
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 16
              }}>
                <Image
                  source={operatorLogo}
                  style={{ width: 56, height: 56 }}
                  resizeMode="contain"
                />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{t('details.operator')}</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>{s.operator}</Text>
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
            {t('details.connections')}
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
            {t('details.getDirections')}
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
            {t('details.reportIssue')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
