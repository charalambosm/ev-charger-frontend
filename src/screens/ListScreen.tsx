import React, { useMemo, useState, useEffect } from "react";
import { FlatList, View, Text, Pressable, ScrollView, Dimensions, Image } from "react-native";
import { useStations } from "../hooks/useStations";
import { useFilters } from "../store/filters";
import { pick } from "../utils/i18n";
import { useTranslation } from 'react-i18next';
import { formatDistance } from "../utils/units";
import { useAuth } from "../contexts";
import { UserService } from "../services";
import { eventEmitter, EVENTS } from "../utils/eventEmitter";
import useUserLocation from "../hooks/useUserLocation";
import { haversineDistanceMeters } from "../utils/geo";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import ChargingStationMarker from "@/components/ChargingStationMarker";

export default function ListScreen({ navigation }: any) {
  const { data } = useStations();
  const filters = useFilters();
  const { coords } = useUserLocation();
  const { user, isGuest } = useAuth();
  const { t } = useTranslation();
  const [sortMode, setSortMode] = useState<"nearest" | "az">("az");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [userSelectedSort, setUserSelectedSort] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);

  // Load user preferences
  const loadPreferences = async () => {
    if (user && !isGuest) {
      try {
        const profile = await UserService.getCurrentUserProfile();
        setUserPreferences(profile?.preferences);
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [user, isGuest]);

  // Listen for preference changes
  useEffect(() => {
    const handlePreferenceChange = () => {
      loadPreferences();
    };

    eventEmitter.on(EVENTS.USER_PREFERENCES_CHANGED, handlePreferenceChange);

    return () => {
      eventEmitter.off(EVENTS.USER_PREFERENCES_CHANGED, handlePreferenceChange);
    };
  }, [user, isGuest]);

  // Initialize all districts and operators when data is loaded
  useEffect(() => {
    if (data && data.length > 0) {
      const allDistricts = Array.from(new Set(data.map((s) => pick(s.district)).filter(Boolean)));
      const allOperators = Array.from(new Set(data.map((s) => s.operator).filter(Boolean)));

      // Only initialize if not already done
      if (filters.districts.size === 0) {
        filters.initializeDistricts(allDistricts);
      }
      if (filters.operators.size === 0) {
        filters.initializeOperators(allOperators);
      }
    }
  }, [data, filters]);

  // Auto-switch to "nearest" when coords become available, but only if user hasn't made an explicit choice
  useEffect(() => {
    if (coords && sortMode === "az" && !userSelectedSort) {
      setSortMode("nearest");
    }
  }, [coords, sortMode, userSelectedSort]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = filters.query.toLowerCase().trim();
    return data
      .map(s => {
        const distanceMeters = coords ? haversineDistanceMeters(
          coords.latitude,
          coords.longitude,
          s.latitude,
          s.longitude
        ) : undefined;
        return { ...s, distanceMeters };
      })
      .filter(s => {
        // District filtering - show all if no specific districts are selected, otherwise filter by selected
        if (filters.districts.size > 0) {
          const districtName = pick(s.district).trim();
          if (!districtName || !filters.districts.has(districtName)) return false;
        }
        // Operator filtering - show all if no specific operators are selected, otherwise filter by selected
        if (filters.operators.size > 0) {
          if (!filters.operators.has(s.operator)) return false;
        }

        // Connection-level filtering with AND logic
        // A station is shown only if it has at least one connection that matches ALL selected criteria
        const hasMatchingConnection = s.connections.some(connection => {
          // Current type filtering (AC/DC)
          if (!filters.acOnly && !filters.dcOnly) return false; // No current type selected
          if (filters.acOnly && filters.dcOnly) {
            // Both selected - connection can be either AC or DC
          } else if (filters.dcOnly && !connection.current.includes("DC")) {
            return false;
          } else if (filters.acOnly && !connection.current.includes("AC")) {
            return false;
          }

          // Power filtering - connection must match selected power levels
          if (filters.powerKW.size > 0 && !filters.powerKW.has(connection.powerKW)) {
            return false;
          }

          // Connector type filtering - connection must match selected connector types
          if (filters.connectorTypes.size > 0) {
            const connectionType = connection.type;
            let mappedType = "Unknown/Other";

            if (connectionType === "CCS (Type 2)" || connectionType.includes("CCS")) {
              mappedType = "CCS (Type 2)";
            } else if (connectionType === "CHAdeMO" || connectionType.includes("CHAdeMO")) {
              mappedType = "CHAdeMO";
            } else if (connectionType === "Type 2 (Socket Only)" || connectionType.includes("Type 2")) {
              mappedType = "Type 2 (Socket Only)";
            }

            if (!filters.connectorTypes.has(mappedType)) {
              return false;
            }
          }

          // If we reach here, this connection matches all selected criteria
          return true;
        });

        if (!hasMatchingConnection) return false;

        // Search query filtering
        const hay = [
          pick(s.title), pick(s.address), pick(s.district), s.postcode, s.operator, s.town.en
        ].join(" ").toLowerCase();
        return q ? hay.includes(q) : true;
      });
  }, [data, filters.query, coords, filters.acOnly, filters.dcOnly, filters.powerKW, filters.connectorTypes, filters.districts, filters.operators]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortMode === "nearest") {
      if (coords) {
        list.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
        return list;
      }
      // Fallback to A–Z when no location available
      list.sort((a, b) => pick(a.title).localeCompare(pick(b.title)));
      return list;
    }
    if (sortMode === "az") {
      list.sort((a, b) => pick(a.title).localeCompare(pick(b.title)));
      return list;
    }
    return list;
  }, [filtered, sortMode, coords]);

  const formatDistanceWithUnits = (meters?: number) => {
    if (meters == null) return undefined;
    const units = userPreferences?.units || 'metric';
    return formatDistance(meters, units);
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={sorted}
        keyExtractor={(s) => s.ID}
        ListHeaderComponent={(
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: "#ddd", backgroundColor: "#fff" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
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
                <Text style={{ fontWeight: "700" }}>{t('list.sortBy')}</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowFilters((v) => !v)}
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
                <MaterialIcons name="filter-alt" size={18} color="#111" />
                <Text style={{ fontWeight: "700" }}>{t('filters.title')}</Text>
              </Pressable>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
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
                {item.distanceMeters != null && (
                    <Text style={{ fontSize: 14, color: "#666", marginBottom: 2 }}>
                      {formatDistanceWithUnits(item.distanceMeters)}
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
                        {individualConnections.map((conn, index) => (
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
                        {individualConnections.map((conn, index) => (
                          <Text key={index} style={{ fontSize: 10, color: "#444", textAlign: "center", flex: 1 }}>
                            {conn.type}
                          </Text>
                        ))}
                      </View>

                      {/* Power information */}
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4, width: "100%" }}>
                        {individualConnections.map((conn, index) => {
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
        )}
      />

      {/* Overlay to close popups when tapping outside */}
      {(showSort || showFilters) && (
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
            setShowFilters(false);
          }}
        />
      )}

      {/* Sort dropdown */}
      {showSort && (
        <View style={{
          position: "absolute",
          left: 12,
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
            <Text style={{ fontWeight: sortMode === "nearest" ? "600" : "400" }}>{t('map.nearestFirst')}</Text>
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
            <Text style={{ fontWeight: sortMode === "az" ? "600" : "400" }}>{t('map.alphabetical')}</Text>
          </Pressable>
        </View>
      )}

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
          width: Dimensions.get('window').width * 0.7,
          maxHeight: 400
        }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* AC/DC Segment */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: "600", marginBottom: 6 }}>{t('filters.current')}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => filters.selectAllCurrent()}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: filters.acOnly && filters.dcOnly ? "#2F80ED" : "#f1f1f1", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, minWidth: 80, justifyContent: "center" }}>
                    <MaterialIcons name="check-circle" size={20} color={filters.acOnly && filters.dcOnly ? "#fff" : "#111"} />
                    <Text style={{ color: filters.acOnly && filters.dcOnly ? "#fff" : "#111", fontSize: 16, fontWeight: "500" }}>{t('common.all')}</Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => {
                  // If AC is already selected and it's the only one, clear it
                  // If "All" is selected or AC isn't selected, select just AC
                  if (filters.acOnly && !filters.dcOnly) {
                    filters.set(s => ({ acOnly: false, dcOnly: false }));
                  } else {
                    filters.set(s => ({ acOnly: true, dcOnly: false }));
                  }
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: filters.acOnly && !filters.dcOnly ? "#2F80ED" : "#f1f1f1", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, minWidth: 80, justifyContent: "center" }}>
                    <MaterialIcons name="power" size={20} color={filters.acOnly && !filters.dcOnly ? "#fff" : "#111"} />
                    <Text style={{ color: filters.acOnly && !filters.dcOnly ? "#fff" : "#111", fontSize: 16, fontWeight: "500" }}>AC</Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => {
                  // If DC is already selected and it's the only one, clear it
                  // If "All" is selected or DC isn't selected, select just DC
                  if (filters.dcOnly && !filters.acOnly) {
                    filters.set(s => ({ acOnly: false, dcOnly: false }));
                  } else {
                    filters.set(s => ({ acOnly: false, dcOnly: true }));
                  }
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: filters.dcOnly && !filters.acOnly ? "#2F80ED" : "#f1f1f1", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, minWidth: 80, justifyContent: "center" }}>
                    <MaterialIcons name="bolt" size={20} color={filters.dcOnly && !filters.acOnly ? "#fff" : "#111"} />
                    <Text style={{ color: filters.dcOnly && !filters.acOnly ? "#fff" : "#111", fontSize: 16, fontWeight: "500" }}>DC</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Power presets with color legend */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: "600", marginBottom: 6 }}>{t('filters.power')}</Text>
              <View style={{ gap: 8 }}>
                <Pressable onPress={() => filters.selectAllPower()}>
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: filters.powerKW.size === 4 ? "#2F80ED" : "#f1f1f1",
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    minWidth: 100,
                    justifyContent: "center"
                  }}>
                    <MaterialIcons name="check-circle" size={20} color={filters.powerKW.size === 4 ? "#fff" : "#111"} />
                    <Text style={{ color: filters.powerKW.size === 4 ? "#fff" : "#111", fontSize: 16, fontWeight: "500" }}>{t('common.all')}</Text>
                  </View>
                </Pressable>
                 
                 {/* Group power options into rows of 2 */}
                 {(() => {
                   const powerOptions = [
                  { power: 7, label: "7kW", color: "#93c5fd" },
                  { power: 22, label: "22kW", color: "#3b82f6" },
                  { power: 50, label: "50kW", color: "#8b5cf6" },
                  { power: 150, label: "150kW", color: "#f97316" }
                   ];
                   
                   const rows = [];
                   for (let i = 0; i < powerOptions.length; i += 2) {
                     const row = powerOptions.slice(i, i + 2);
                     rows.push(row);
                   }

                   return rows.map((row, rowIndex) => (
                     <View key={rowIndex} style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
                       {row.map((item) => {
                         const isSelected = filters.powerKW.has(item.power) && filters.powerKW.size === 1;
                         const backgroundColor = isSelected ? "#2F80ED" : "#f1f1f1";
                         
                         return (
                           <Pressable key={item.power} onPress={() => {
                    // If this specific power is selected and it's the only one, clear it
                    // If "All" is selected (size === 4) or this power isn't selected, select just this power
                    if (filters.powerKW.has(item.power) && filters.powerKW.size === 1) {
                      filters.clearPower();
                    } else {
                      filters.set(s => ({ powerKW: new Set([item.power]) }));
                    }
                  }}>
                    <View style={{
                               paddingVertical: 12,
                               paddingHorizontal: 8,
                      borderRadius: 8,
                               backgroundColor: backgroundColor,
                               width: (Dimensions.get('window').width * 0.7 - 32) / 2, // Half of filter window width minus padding and gap
                               height: 110,
                               justifyContent: "center",
                               alignItems: "center"
                             }}>
                               <View style={{ width: 50, height: 50, marginBottom: 8 }}>
                                 <ChargingStationMarker size={50} connections={[{ powerKW: item.power, status: 'Available' }]} />
                               </View>
                               <Text style={{
                                 color: isSelected ? "#fff" : "#111",
                                 fontSize: 16,
                                 fontWeight: "500",
                                 textAlign: "center"
                               }}>{item.label}</Text>
                    </View>
                  </Pressable>
                         );
                       })}
                       
                       {/* Fill empty slots in the last row if needed */}
                       {row.length < 2 && Array.from({ length: 2 - row.length }).map((_, index) => (
                         <View key={`empty-${index}`} style={{ flex: 1 }} />
                       ))}
                     </View>
                   ));
                 })()}
              </View>
            </View>

            {/* Type (connector) multi-select */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontWeight: "600", marginBottom: 6 }}>{t('filters.type')}</Text>
              <View style={{ gap: 8 }}>
                <Pressable onPress={() => filters.selectAllConnectorTypes()}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: filters.connectorTypes.size === 4 ? "#2F80ED" : "#f1f1f1", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, minWidth: 120, justifyContent: "center" }}>
                    <MaterialIcons name="check-circle" size={20} color={filters.connectorTypes.size === 4 ? "#fff" : "#111"} />
                    <Text style={{ color: filters.connectorTypes.size === 4 ? "#fff" : "#111", fontSize: 16, fontWeight: "500" }}>{t('common.all')}</Text>
                  </View>
                </Pressable>
                 
                 {/* Group connector types into rows of 2 */}
                 {(() => {
                   const connectorTypes = [
                     { type: "CCS (Type 2)", icon: "ev-plug-ccs2" },
                     { type: "CHAdeMO", icon: "ev-plug-chademo" },
                     { type: "Type 2 (Socket Only)", icon: "ev-plug-type2" },
                     { type: "Unknown/Other", icon: "power-plug" }
                   ];
                   
                   const rows = [];
                   for (let i = 0; i < connectorTypes.length; i += 2) {
                     const row = connectorTypes.slice(i, i + 2);
                     rows.push(row);
                   }

                   return rows.map((row, rowIndex) => (
                     <View key={rowIndex} style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
                       {row.map((item) => {
                         const isSelected = filters.connectorTypes.has(item.type) && filters.connectorTypes.size === 1;
                         const backgroundColor = isSelected ? "#2F80ED" : "#f1f1f1";
                         
                         return (
                           <Pressable key={item.type} onPress={() => {
                    // If this specific type is selected and it's the only one, clear it
                    // If "All" is selected (size === 4) or this type isn't selected, select just this type
                             if (filters.connectorTypes.has(item.type) && filters.connectorTypes.size === 1) {
                      filters.clearConnectorTypes();
                    } else {
                               filters.set(s => ({ connectorTypes: new Set([item.type]) }));
                             }
                           }}>
                             <View style={{
                               paddingVertical: 12,
                               paddingHorizontal: 8,
                               borderRadius: 8,
                               backgroundColor: backgroundColor,
                               width: (Dimensions.get('window').width * 0.7 - 32) / 2, // Half of filter window width minus padding and gap
                               height: 110,
                               justifyContent: "center",
                               alignItems: "center"
                             }}>
                               <View style={{ width: 50, height: 50, marginBottom: 8 }}>
                                 <MaterialCommunityIcons 
                                   name={item.icon as any} 
                                   size={50} 
                                   color={isSelected ? "#fff" : "#111"} 
                                 />
                               </View>
                               <Text style={{
                                 color: isSelected ? "#fff" : "#111",
                                 fontSize: 16,
                                 fontWeight: "500",
                                 textAlign: "center"
                               }}>{item.type}</Text>
                    </View>
                  </Pressable>
                         );
                       })}
                       
                       {/* Fill empty slots in the last row if needed */}
                       {row.length < 2 && Array.from({ length: 2 - row.length }).map((_, index) => (
                         <View key={`empty-${index}`} style={{ flex: 1 }} />
                       ))}
                     </View>
                   ));
                 })()}
              </View>
            </View>

                         {/* District multi-select */}
             {(() => {
               const allDistricts = Array.from(new Set((data ?? []).map((s) => pick(s.district)).filter(Boolean))).sort();
               return (
                 <View style={{ marginBottom: 12 }}>
                                          <Text style={{ fontWeight: "600", marginBottom: 6 }}>{t('filters.districts')}</Text>
                   <View style={{ gap: 8 }}>
                     <Pressable onPress={() => filters.selectAllDistricts()}>
                       <View style={{
                         paddingVertical: 10,
                         paddingHorizontal: 16,
                         borderRadius: 8,
                         backgroundColor: filters.districts.size === allDistricts.length ? "#2F80ED" : "#f1f1f1",
                         flexDirection: "row",
                         alignItems: "center",
                         gap: 8,
                         minWidth: 100,
                         justifyContent: "center"
                       }}>
                         <MaterialIcons name="check-circle" size={20} color={filters.districts.size === allDistricts.length ? "#fff" : "#111"} />
                         <Text style={{ color: filters.districts.size === allDistricts.length ? "#fff" : "#111", fontSize: 16, fontWeight: "500" }}>{t('common.all')}</Text>
                       </View>
                     </Pressable>
                     
                     {/* Group districts into rows of 2 */}
                     {(() => {
                       const rows = [];
                       for (let i = 0; i < allDistricts.length; i += 2) {
                         const row = allDistricts.slice(i, i + 2);
                         rows.push(row);
                       }

                       return rows.map((row, rowIndex) => (
                         <View key={rowIndex} style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
                           {row.map((d) => {
                             const isSelected = filters.districts.has(d) && filters.districts.size === 1;
                             const backgroundColor = isSelected ? "#2F80ED" : "#f1f1f1";
                             
                             // Map district names to image files (supports both English and Greek)
                             const getDistrictImage = (districtName: string) => {
                               const imageMap: { [key: string]: any } = {
                                 // English names
                                 'Nicosia': require("../../assets/nicosia.png"),
                                 'Paphos': require("../../assets/paphos.png"),
                                 'Limassol': require("../../assets/limassol.png"),
                                 'Famagusta': require("../../assets/famagusta.png"),
                                 'Larnaca': require("../../assets/larnaca.png"),
                                 // Greek names
                                 'Λευκωσία': require("../../assets/nicosia.png"),
                                 'Πάφος': require("../../assets/paphos.png"),
                                 'Λεμεσός': require("../../assets/limassol.png"),
                                 'Αμμόχωστος': require("../../assets/famagusta.png"),
                                 'Λάρνακα': require("../../assets/larnaca.png")
                               };
                               return imageMap[districtName];
                             };

                             const districtImage = getDistrictImage(d);

                             return (
                               <Pressable key={d} onPress={() => {
                                 // If this specific district is selected and it's the only one, clear it
                                 // If "All" is selected or this district isn't selected, select just this district
                                 if (filters.districts.has(d) && filters.districts.size === 1) {
                                   filters.clearDistricts();
                                 } else {
                                   filters.set(s => ({ districts: new Set([d]) }));
                                 }
                               }}>
                                 <View style={{
                                   paddingVertical: 12,
                                   paddingHorizontal: 8,
                                   borderRadius: 8,
                                   backgroundColor: backgroundColor,
                                   width: (Dimensions.get('window').width * 0.7 - 32) / 2, // Half of filter window width minus padding and gap
                                   height: 110,
                                   justifyContent: "center",
                                   alignItems: "center"
                                 }}>
                                   {districtImage ? (
                                     <View style={{ width: 50, height: 50, marginBottom: 8 }}>
                                       <Image
                                         source={districtImage}
                                         style={{
                                           width: "100%",
                                           height: "100%",
                                           opacity: isSelected ? 1 : 0.7
                                         }}
                                         resizeMode="contain"
                                       />
                                     </View>
                                   ) : (
                                     <View style={{ width: 50, height: 50, marginBottom: 8 }}>
                                       <MaterialIcons name="location-city" size={50} color={isSelected ? "#fff" : "#111"} />
                                     </View>
                                   )}
                                   <Text style={{
                                     color: isSelected ? "#fff" : "#111",
                                     fontSize: 16,
                                     fontWeight: "500",
                                     textAlign: "center"
                                   }}>{d}</Text>
                                 </View>
                               </Pressable>
                             );
                           })}
                           
                           {/* Fill empty slots in the last row if needed */}
                           {row.length < 2 && Array.from({ length: 2 - row.length }).map((_, index) => (
                             <View key={`empty-${index}`} style={{ flex: 1 }} />
                           ))}
                         </View>
                       ));
                     })()}
                   </View>
                 </View>
               );
             })()}

            {/* Operator multi-select */}
            {(() => {
              const allOps = Array.from(new Set((data ?? []).map((s) => s.operator).filter(Boolean))).sort();
              return (
                <View style={{ marginBottom: 12 }}>
                                        <Text style={{ fontWeight: "600", marginBottom: 6 }}>{t('filters.operators')}</Text>
                  <View style={{ gap: 8 }}>
                    <Pressable onPress={() => filters.selectAllOperators()}>
                      <View style={{
                        paddingVertical: 10,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        backgroundColor: filters.operators.size === allOps.length ? "#2F80ED" : "#f1f1f1",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 100,
                        justifyContent: "center"
                      }}>
                        <MaterialIcons name="check-circle" size={20} color={filters.operators.size === allOps.length ? "#fff" : "#111"} />
                        <Text style={{ color: filters.operators.size === allOps.length ? "#fff" : "#111", fontSize: 16, fontWeight: "500" }}>{t('common.all')}</Text>
                      </View>
                    </Pressable>

                    {/* Group operators into rows of 2 */}
                    {(() => {
                      const rows = [];
                      for (let i = 0; i < allOps.length; i += 2) {
                        const row = allOps.slice(i, i + 2);
                        rows.push(row);
                      }

                      return rows.map((row, rowIndex) => (
                        <View key={rowIndex} style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
                          {row.map((op) => {
                            const isSelected = filters.operators.has(op);
                            const backgroundColor = isSelected && filters.operators.size === 1 ? "#2F80ED" : "#f1f1f1";

                            return (
                              <Pressable key={op} onPress={() => {
                                // If this specific operator is selected and it's the only one, clear it
                                // If "All" is selected or this operator isn't selected, select just this operator
                                if (filters.operators.has(op) && filters.operators.size === 1) {
                                  filters.clearOperators();
                                } else {
                                  filters.set(s => ({ operators: new Set([op]) }));
                                }
                              }}>
                                <View style={{
                                  paddingVertical: 12,
                                  paddingHorizontal: 8,
                                  borderRadius: 8,
                                  backgroundColor: backgroundColor,
                                  width: (Dimensions.get('window').width * 0.7 - 32) / 2, // Half of filter window width minus padding and gap
                                  height: 110,
                                  justifyContent: "center",
                                  alignItems: "center"
                                }}>
                                  {(() => {
                                    // Don't show logo for 'Mall Operators' or 'Unknown'
                                    if (op === 'Mall Operators' || op === 'Unknown') {
                                      return (
                                        <Text style={{
                                          color: isSelected && filters.operators.size === 1 ? "#fff" : "#111",
                                          fontSize: 16,
                                          fontWeight: "500",
                                          textAlign: "center"
                                        }}>{op}</Text>
                                      );
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

                                    const logoSource = logoMap[op];

                                    if (logoSource) {
                                      return (
                                          <Image
                                            source={logoSource}
                                            style={{
                                             width: "100%",
                                             height: "100%",
                                              opacity: isSelected && filters.operators.size === 1 ? 1 : 0.7
                                            }}
                                            resizeMode="contain"
                                          />
                                      );
                                    }

                                    // Fallback to text if no logo found
                                    return (
                                      <Text style={{
                                        color: isSelected && filters.operators.size === 1 ? "#fff" : "#111",
                                        fontSize: 16,
                                        fontWeight: "500",
                                        textAlign: "center"
                                      }}>{op}</Text>
                                    );
                                  })()}
                                </View>
                              </Pressable>
                            );
                          })}

                          {/* Fill empty slots in the last row if needed */}
                          {row.length < 2 && Array.from({ length: 2 - row.length }).map((_, index) => (
                            <View key={`empty-${index}`} style={{ flex: 1 }} />
                          ))}
                        </View>
                      ));
                    })()}
                  </View>
                </View>
              );
            })()}


          </ScrollView>
        </View>
      )}
    </View>
  );
}
