export type Localized = { en: string; el: string };

export type Connection = {
  type: string;                 // e.g., "CCS (Type 2)"
  powerKW: number;              // 7–150
  current: string;              // "AC (Three-Phase)" | "DC" | "Unknown"
  status: string;               // "Operational" | ...
  quantity: number;             // count per connector type
};

export type Station = {
  ID: string;
  UUID: string;
  title: Localized;
  latitude: number;
  longitude: number;
  address: Localized;
  postcode: number;
  town: Localized;
  district: Localized;
  operator: string; // TODO: Change to Localized
  connections: Connection[];
  number_of_points: number;
  usage_cost: string; // TODO: Change to number
  related_url: string;
  confirmed: boolean;
  last_seen: string;            // ISO
  status: "active" | "inactive" | string;
  distanceMeters?: number;
};

export type StationFeature = {
  id: string;
  coord: { lat: number; lng: number };
  fastDC: boolean;              // any connection >= 50kW DC
  connectorSet: Set<string>;
  townEn: string;
  operator: string;
  station: Station;
};
