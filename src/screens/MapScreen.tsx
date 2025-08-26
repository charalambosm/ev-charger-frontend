import React, { useMemo, useState } from "react";
import { View, Text, ActivityIndicator, Pressable, Linking, Platform } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Region } from "react-native-maps";
import ClusteredMapView from "react-native-map-clustering";
import { useStations, toFeatures } from "../hooks/useStations";
import { useFilters } from "../store/filters";
import { pick } from "../utils/i18n";
import type { StationFeature } from "../types/ocm";

export default function MapScreen({ navigation }: any) {
  const { data, isLoading, error } = useStations();
  const filters = useFilters();
  const [region, setRegion] = useState<Region>({
    latitude: 35.1633,
    longitude: 33.3642,
    latitudeDelta: 0.6,
    longitudeDelta: 0.6
  });

  const features = useMemo(() => {
    if (!data) return [];
    const feats = toFeatures(data);

    return feats.filter(f => {
      const s = f.station;

      if (filters.dcOnly && !f.fastDC) return false;
      if (filters.onlyOperational && !s.connections.some(c => c.status.toLowerCase().includes("oper"))) return false;
      if (filters.minPowerKW != null && !s.connections.some(c => c.powerKW >= (filters.minPowerKW!))) return false;
      if (filters.connectorTypes.size > 0) {
        const has = [...filters.connectorTypes].some(ct => f.connectorSet.has(ct));
        if (!has) return false;
      }
      const q = filters.query.trim().toLowerCase();
      if (q) {
        const hay = [
          s.ID, s.UUID,
          pick(s.title).toLowerCase(),
          pick(s.address).toLowerCase(),
          s.postcode,
          f.townEn.toLowerCase(),
          f.operator.toLowerCase()
        ].join(" ");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, filters]);

  if (isLoading) return <ActivityIndicator style={{ marginTop: 32 }} />;
  if (error) return <Text style={{ color: "red", margin: 16 }}>Failed to load chargers.</Text>;

  const onMarkerPress = (f: StationFeature) => {
    navigation.navigate("Details", { id: f.id });
  };

  return (
    <View style={{ flex: 1 }}>
      <ClusteredMapView
        style={{ flex: 1 }}
        region={region}
        onRegionChangeComplete={setRegion}
        provider={Platform.OS === "ios" ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
        showsUserLocation
        showsCompass
        animationEnabled
        spiralEnabled
      >
        {features.map((f) => (
          <Marker
            key={f.id}
            coordinate={{ latitude: f.coord.lat, longitude: f.coord.lng }}
            pinColor={f.fastDC ? "red" : undefined}
            onPress={() => onMarkerPress(f)}
          >
            <View style={{ backgroundColor: "white", padding: 4, borderRadius: 8 }}>
              <Text numberOfLines={1} style={{ fontWeight: "600", maxWidth: 160 }}>
                {pick(f.station.title)}
              </Text>
              <Text style={{ fontSize: 12 }}>
                {f.fastDC ? "⚡ Fast" : "AC"} · {f.station.number_of_points} pts
              </Text>
            </View>
          </Marker>
        ))}
      </ClusteredMapView>

      {/* Minimal filter bar */}
      <View style={{
        position: "absolute", top: 16, left: 12, right: 12,
        backgroundColor: "rgba(255,255,255,0.95)", padding: 10, borderRadius: 12, gap: 6
      }}>
        <Text style={{ fontWeight: "700" }}>Filters</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={() => filters.set(s => ({ dcOnly: !s.dcOnly }))}>
            <Text style={{ padding: 6, borderRadius: 8, backgroundColor: filters.dcOnly ? "#ddd" : "#f1f1f1" }}>
              DC only
            </Text>
          </Pressable>
          <Pressable onPress={() => filters.set(s => ({ onlyOperational: !s.onlyOperational }))}>
            <Text style={{ padding: 6, borderRadius: 8, backgroundColor: filters.onlyOperational ? "#ddd" : "#f1f1f1" }}>
              Operational
            </Text>
          </Pressable>
          <Pressable onPress={() => filters.set(() => ({ minPowerKW: 50 }))}>
            <Text style={{ padding: 6, borderRadius: 8, backgroundColor: filters.minPowerKW === 50 ? "#ddd" : "#f1f1f1" }}>
              ≥50kW
            </Text>
          </Pressable>
          <Pressable onPress={() => filters.reset()}>
            <Text style={{ padding: 6, borderRadius: 8, backgroundColor: "#f1f1f1" }}>
              Reset
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
