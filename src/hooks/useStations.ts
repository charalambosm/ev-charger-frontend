import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchStations } from "../api/api";
import type { Station, StationFeature } from "../types/ocm";

const CACHE_KEY = "stations-cache-v1";

function toFeatures(list: Station[]): StationFeature[] {
  return list.map((s) => ({
    id: s.ID,
    coord: { lat: s.latitude, lng: s.longitude },
    fastDC: s.connections.some(c => c.current.includes("DC") && c.powerKW >= 50),
    connectorSet: new Set(s.connections.map(c => c.type)),
    townEn: s.town.en || "",
    operator: s.operator || "Unknown",
    station: s
  }));
}

export function useStations() {
  return useQuery<Station[]>({
    queryKey: ["stations"],
    queryFn: async () => {
      const data = await fetchStations();
      // cache
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      return data;
    },
    staleTime: 1000 * 60 * 5
  });
}

export { toFeatures };
