import axios from "axios";
import { z } from "zod";
import type { Station } from "../types/ocm";
import localStations from "../../assets/charging_points_export.json";

const stationSchema: z.ZodType<Station> = z.object({
  ID: z.string(),
  UUID: z.string(),
  title: z.object({ en: z.string().default(""), el: z.string().default("") }),
  latitude: z.number(),
  longitude: z.number(),
  address: z.object({ en: z.string().default(""), el: z.string().default("") }),
  postcode: z.number(),
  town: z.object({ en: z.string().default(""), el: z.string().default("") }),
  operator: z.string().default("Unknown"), // TODO: Change to Localized
  connections: z.array(z.object({
    type: z.string(),
    powerKW: z.number(),
    current: z.string(),
    status: z.string(),
    quantity: z.number(),
  })),
  number_of_points: z.number(),
  usage_cost: z.string().default("Unknown"), // TODO: Change to number
  related_url: z.string().default(""),
  confirmed: z.boolean(),
  last_seen: z.string(),
  status: z.string()
});

const stationsSchema = z.array(stationSchema);

// Configure your backend URL via env
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:8000";

export async function fetchStations(): Promise<Station[]> {
  try {
    const { data } = await axios.get(`${BASE_URL}/stations`, { timeout: 12000 });
    return stationsSchema.parse(data);
  } catch {
    // local fallback
    const local = require("../../assets/charging_points_export.json");
    return stationsSchema.parse(local);
  }
}
