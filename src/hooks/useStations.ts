import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchStations } from "../api/api";
import type { Station, StationFeature } from "../types/ocm";
import useUserLocation from "./useUserLocation";
import { haversineDistanceMeters } from "../utils/geo";

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

export function useSortedStations() {
  const q = useStations();
  const { coords } = useUserLocation();

  const sorted = useMemo(() => {
    const data = q.data;
    if (!data) return data;
    if (!coords) return data;
    const withDistances = data.map((s) => ({
      ...s,
      distanceMeters: haversineDistanceMeters(
        coords.latitude,
        coords.longitude,
        s.latitude,
        s.longitude
      )
    }));
    withDistances.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
    return withDistances;
  }, [q.data, coords]);

  return { ...q, data: sorted } as typeof q;
}

export { toFeatures };
