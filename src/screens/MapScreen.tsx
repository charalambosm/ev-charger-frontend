import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, Pressable, Linking, Platform, ScrollView } from "react-native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Region } from "react-native-maps";
import ClusteredMapView from "react-native-map-clustering";
import { useSortedStations, toFeatures } from "../hooks/useStations";
import { useFilters } from "../store/filters";
import { pick } from "../utils/i18n";
import type { StationFeature } from "../types/ocm";
import useUserLocation from "../hooks/useUserLocation";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { haversineDistanceMeters } from "../utils/geo";

export default function MapScreen({ navigation }: any) {
  const { data, isLoading, error } = useSortedStations();
  const filters = useFilters();
  const { coords, status } = useUserLocation();
  const [showFilters, setShowFilters] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 35.1633,
    longitude: 33.3642,
    latitudeDelta: 0.6,
    longitudeDelta: 0.6
  });

  // Update map region when user location becomes available/changes
  useEffect(() => {
    if (coords) {
      setRegion(prev => ({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: prev.latitudeDelta ?? 0.05,
        longitudeDelta: prev.longitudeDelta ?? 0.05
      }));
    }
  }, [coords]);

  const features = useMemo(() => {
    if (!data) return [];
    const feats = toFeatures(data);

    if (coords) {
      feats.forEach(f => {
        f.station.distanceMeters = haversineDistanceMeters(
          coords.latitude,
          coords.longitude,
          f.station.latitude,
          f.station.longitude
        );
      });
    } else {
      // ensure previous values don't linger if coords become unavailable
      feats.forEach(f => {
        if (f.station.distanceMeters != null) delete f.station.distanceMeters;
      });
    }

    return feats.filter(f => {
      const s = f.station;

      // Show all stations if both AC and DC are selected, otherwise filter by selected type
      if (!filters.acOnly && !filters.dcOnly) return false; // No current type selected
      if (filters.acOnly && filters.dcOnly) {
        // Both selected - show all stations (no filtering needed)
      } else if (filters.dcOnly && !s.connections.some(c => c.current.includes("DC"))) return false;
      else if (filters.acOnly && !s.connections.some(c => c.current.includes("AC"))) return false;
      if (filters.powerKW.size > 0 && !s.connections.some(c => filters.powerKW.has(c.powerKW!))) return false;
      if (filters.districts.size > 0) {
        const districtName = pick(s.district).trim();
        if (!districtName || !filters.districts.has(districtName)) return false;
      }
      if (filters.operators.size > 0) {
        if (!filters.operators.has(s.operator)) return false;
      }
      // Show all stations if no connector types are selected, otherwise filter by selected types
      if (filters.connectorTypes.size > 0) {
        const stationConnectorTypes = new Set(f.station.connections.map(c => c.type).filter(Boolean));
        const mappedTypes = new Set<string>();
        
        // Map actual connector types to our predefined categories
        stationConnectorTypes.forEach(type => {
          if (type === "CCS (Type 2)" || type.includes("CCS")) {
            mappedTypes.add("CCS (Type 2)");
          } else if (type === "CHAdeMO" || type.includes("CHAdeMO")) {
            mappedTypes.add("CHAdeMO");
          } else if (type === "Type 2 (Socket Only)" || type.includes("Type 2")) {
            mappedTypes.add("Type 2 (Socket Only)");
          } else {
            mappedTypes.add("Unknown/Other");
          }
        });
        
        const has = [...filters.connectorTypes].some(ct => mappedTypes.has(ct));
        if (!has) return false;
      }
      const q = filters.query.trim().toLowerCase();
      if (q) {
        const hay = [
          s.ID, s.UUID,
          pick(s.title).toLowerCase(),
          pick(s.address).toLowerCase(),
          pick(s.district).toLowerCase(),
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
          >
            <Callout onPress={() => onMarkerPress(f)}>
              <View style={{ maxWidth: 260 }}>
                <Text numberOfLines={1} style={{ fontWeight: "700" }}>{pick(f.station.title)}</Text>
                <Text style={{ color: "#444" }} numberOfLines={2}>{pick(f.station.address)}</Text>
                <Text style={{ color: "#666", marginTop: 2 }}>{f.station.operator}</Text>
                {(() => {
                  const uniqueTypes = Array.from(new Set(f.station.connections.map(c => c.type))).filter(Boolean);
                  const powers = f.station.connections.map(c => c.powerKW).filter((n) => typeof n === 'number' && !isNaN(n));
                  const minP = powers.length ? Math.min(...powers) : undefined;
                  const maxP = powers.length ? Math.max(...powers) : undefined;
                  const hasDC = f.station.connections.some(c => c.current.includes("DC"));
                  const hasAC = f.station.connections.some(c => c.current.includes("AC"));
                  const powerLabel = maxP != null ? (minP != null && minP !== maxP ? `${minP}–${maxP} kW` : `${maxP} kW`) : "n/a";
                  const distanceLabel = typeof f.station.distanceMeters === 'number'
                    ? (f.station.distanceMeters < 950 ? `${Math.round(f.station.distanceMeters)} m` : `${(f.station.distanceMeters / 1000).toFixed(1)} km`)
                    : undefined;
                  const cost = f.station.usage_cost?.trim();
                  const lastUpdated = f.station.last_seen ? new Date(f.station.last_seen) : undefined;
                  const lastUpdatedStr = lastUpdated ? lastUpdated.toLocaleDateString() : undefined;
                  return (
                    <View>
                      <Text numberOfLines={2} style={{ marginTop: 6 }}>
                        {hasDC ? '⚡ DC' : ''}{hasDC && hasAC ? ' · ' : ''}{hasAC ? '🔌 AC' : ''}
                        { (hasDC || hasAC) ? ' · ' : ''}{uniqueTypes.join(', ')}
                      </Text>
                      <Text style={{ marginTop: 2 }}>
                        {powerLabel}
                        {distanceLabel ? <Text style={{ color: '#666' }}> · {distanceLabel}</Text> : null}
                      </Text>
                      <Text style={{ marginTop: 2 }}>
                        {cost ? `Cost: ${cost}` : 'Cost: n/a'}
                        {lastUpdatedStr ? <Text style={{ color: '#666' }}> · Updated: {lastUpdatedStr}</Text> : null}
                      </Text>
                    </View>
                  );
                })()}
                <Text style={{ color: "#2F80ED", marginTop: 6 }}>View details ›</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </ClusteredMapView>

      {/* Re-center button */}
      {status === 'granted' && (
      <Pressable
        onPress={() => {
          if (!coords) return;
          setRegion(prev => ({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: prev.latitudeDelta ?? 0.05,
            longitudeDelta: prev.longitudeDelta ?? 0.05
          }));
        }}
        disabled={!coords}
        style={({ pressed }) => ({
          position: "absolute",
          right: 32,
          bottom: 32,
          backgroundColor: pressed ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.95)",
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderRadius: 20,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          opacity: coords ? 1 : 0.6
        })}
      >
        <MaterialIcons name="my-location" size={22} color="#2F80ED" />
      </Pressable>
      )}

      {/* Filters toggle button */}
      <Pressable
        onPress={() => setShowFilters((v) => !v)}
        style={({ pressed }) => ({
          position: "absolute",
          right: 12,
          top: 16,
          backgroundColor: pressed ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.95)",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 }
        })}
      >
        <MaterialIcons name="filter-alt" size={18} color="#111" />
        <Text style={{ fontWeight: "700" }}>Filters</Text>
      </Pressable>

      {/* Filters dropdown */}
      {showFilters && (
        <View style={{
          position: "absolute",
          right: 12,
          top: 60,
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 12,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          zIndex: 1000,
          maxWidth: 280,
          maxHeight: 400
        }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* AC/DC Segment */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: "600", marginBottom: 6 }}>Current</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => filters.set(s => ({ acOnly: !s.acOnly }))}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: filters.acOnly ? "#ccc" : "#f1f1f1", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}>
                    <MaterialIcons name="power" size={18} color="#111" />
                    <Text>AC</Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => filters.set(s => ({ dcOnly: !s.dcOnly }))}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: filters.dcOnly ? "#ccc" : "#f1f1f1", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 }}>
                    <MaterialIcons name="bolt" size={18} color="#111" />
                    <Text>DC</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Power presets */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: "600", marginBottom: 6 }}>Power</Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {[7, 22, 50, 150].map((p, idx) => (
                  <Pressable key={idx} onPress={() => filters.togglePower(p)}>
                    <Text style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: filters.powerKW.has(p) ? "#ccc" : "#f1f1f1" }}>
                      {p}kW
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Type (connector) multi-select */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: "600", marginBottom: 6 }}>Type</Text>
              <View style={{ gap: 8 }}>
                {["CCS (Type 2)", "CHAdeMO", "Type 2 (Socket Only)", "Unknown/Other"].map((t) => (
                  <Pressable key={t} onPress={() => filters.set((state) => {
                    const next = new Set(state.connectorTypes);
                    if (next.has(t)) next.delete(t); else next.add(t);
                    return { connectorTypes: next };
                  })}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: filters.connectorTypes.has(t) ? "#ccc" : "#f1f1f1", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 }}>
                      <MaterialCommunityIcons name={(t === "CCS (Type 2)" ? "ev-plug-ccs2" : t === "CHAdeMO" ? "ev-plug-chademo" : t === "Type 2 (Socket Only)" ? "ev-plug-type2" : "power-plug") as any} size={18} color="#111" />
                      <Text>{t}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* District multi-select */}
            {(() => {
              const allDistricts = Array.from(new Set((data ?? []).map((s) => pick(s.district)).filter(Boolean))).sort();
              return (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontWeight: "600", marginBottom: 6 }}>Districts</Text>
                  <View style={{ gap: 8 }}>
                    {allDistricts.map((d) => (
                      <Pressable key={d} onPress={() => filters.toggleDistrict(d)}>
                        <Text style={{ paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: filters.districts.has(d) ? "#ccc" : "#f1f1f1" }}>{d}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })()}

            {/* Operator multi-select */}
            {(() => {
              const allOps = Array.from(new Set((data ?? []).map((s) => s.operator).filter(Boolean))).sort();
              return (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontWeight: "600", marginBottom: 6 }}>Operators</Text>
                  <View style={{ gap: 8 }}>
                    {allOps.map((op) => (
                      <Pressable key={op} onPress={() => filters.toggleOperator(op)}>
                        <Text style={{ paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: filters.operators.has(op) ? "#ccc" : "#f1f1f1" }}>{op}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })()}

            {/* Reset */}
            <View style={{ alignItems: "center", marginTop: 4 }}>
              <Pressable onPress={() => filters.reset()}>
                <Text style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#f1f1f1" }}>Reset</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}
