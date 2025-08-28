import React, { useMemo, useState, useEffect } from "react";
import { FlatList, View, Text, Pressable, ScrollView } from "react-native";
import { useStations } from "../hooks/useStations";
import { useFilters } from "../store/filters";
import { pick } from "../utils/i18n";
import useUserLocation from "../hooks/useUserLocation";
import { haversineDistanceMeters } from "../utils/geo";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function ListScreen({ navigation }: any) {
  const { data } = useStations();
  const filters = useFilters();
  const { coords } = useUserLocation();
  const [sortMode, setSortMode] = useState<"nearest" | "az">("az");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  // Update sort mode to "nearest" when coords become available
  useEffect(() => {
    if (coords && sortMode === "az") {
      setSortMode("nearest");
    }
  }, [coords, sortMode]);

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
        // Show all stations if both AC and DC are selected, otherwise filter by selected type
        if (!filters.acOnly && !filters.dcOnly) return false; // No current type selected
        if (filters.acOnly && filters.dcOnly) {
          // Both selected - show all stations (no filtering needed)
        } else if (filters.dcOnly && !s.connections.some(c => c.current.includes("DC"))) return false;
        else if (filters.acOnly && !s.connections.some(c => c.current.includes("AC"))) return false;
        if (filters.powerKW.size > 0 && !s.connections.some(c => filters.powerKW.has(c.powerKW!))) return false;
        // Show all stations if no connector types are selected, otherwise filter by selected types
        if (filters.connectorTypes.size > 0) {
          const stationConnectorTypes = new Set(s.connections.map(c => c.type).filter(Boolean));
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
        if (filters.districts.size > 0) {
          const districtName = pick(s.district).trim();
          if (!districtName || !filters.districts.has(districtName)) return false;
        }
        if (filters.operators.size > 0) {
          if (!filters.operators.has(s.operator)) return false;
        }
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

  const formatDistance = (meters?: number) => {
    if (meters == null) return undefined;
    if (meters < 950) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={sorted}
        keyExtractor={(s) => s.ID}
        ListHeaderComponent={(
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: "#eee", backgroundColor: "#fff" }}>
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
                <Text style={{ fontWeight: "700" }}>Sort by</Text>
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
                 <Text style={{ fontWeight: "700" }}>Filters</Text>
               </Pressable>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate("Details", { id: item.ID })}>
            <View style={{ padding: 12, borderBottomWidth: 1, borderColor: "#eee" }}>
              <Text style={{ fontWeight: "700" }}>
                {pick(item.title)}
                {item.distanceMeters != null && (
                  <Text style={{ color: "#666" }}> · {formatDistance(item.distanceMeters)}</Text>
                )}
              </Text>
              <Text>{pick(item.address)}</Text>
              <Text>{item.operator} · {item.number_of_points} points</Text>
            </View>
          </Pressable>
        )}
             />

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
               <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
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
