import React, { useMemo } from "react";
import { FlatList, View, Text, Pressable } from "react-native";
import { useStations } from "../hooks/useStations";
import { useFilters } from "../store/filters";
import { pick } from "../utils/i18n";

export default function ListScreen({ navigation }: any) {
  const { data } = useStations();
  const filters = useFilters();

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = filters.query.toLowerCase().trim();
    return data.filter(s => {
      const hay = [
        pick(s.title), pick(s.address), s.postcode, s.operator, s.town.en
      ].join(" ").toLowerCase();
      return q ? hay.includes(q) : true;
    });
  }, [data, filters.query]);

  return (
    <FlatList
      data={filtered}
      keyExtractor={(s) => s.ID}
      renderItem={({ item }) => (
        <Pressable onPress={() => navigation.navigate("Details", { id: item.ID })}>
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: "#eee" }}>
            <Text style={{ fontWeight: "700" }}>{pick(item.title)}</Text>
            <Text>{pick(item.address)}</Text>
            <Text>{item.operator} · {item.number_of_points} points</Text>
          </View>
        </Pressable>
      )}
    />
  );
}
