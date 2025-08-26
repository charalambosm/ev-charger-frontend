import React, { useMemo } from "react";
import { View, Text, Linking, ScrollView } from "react-native";
import { useStations } from "../hooks/useStations";
import { pick } from "../utils/i18n";

export default function DetailsScreen({ route }: any) {
  const { id } = route.params as { id: string };
  const { data } = useStations();
  const s = useMemo(() => data?.find(x => x.ID === id), [data, id]);

  if (!s) return <Text style={{ margin: 16 }}>Station not found.</Text>;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: "800" }}>{pick(s.title)}</Text>
      <Text>{pick(s.address)} {s.postcode && `, ${s.postcode}`}</Text>
      <Text>{s.town?.en}</Text>
      <Text>Operator: {s.operator}</Text>
      <Text>Points: {s.number_of_points}</Text>
      <Text>Status: {s.status}</Text>
      <Text>Usage cost: {s.usage_cost}</Text>

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: "700" }}>Connectors</Text>
        {s.connections.map((c, i) => (
          <Text key={i}>
            • {c.type} · {c.current} · {c.powerKW} kW · {c.status} · x{c.quantity}
          </Text>
        ))}
      </View>

      {!!s.related_url && (
        <Text
          style={{ color: "dodgerblue", marginTop: 12 }}
          onPress={() => Linking.openURL(s.related_url)}
        >
          Open related link
        </Text>
      )}
    </ScrollView>
  );
}
