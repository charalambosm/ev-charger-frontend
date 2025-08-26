import { create } from "zustand";

export type FiltersState = {
  query: string;
  connectorTypes: Set<string>; // e.g., "CCS (Type 2)", "Type 2 (Socket Only)", "CHAdeMO"
  minPowerKW?: number;
  dcOnly: boolean;
  onlyOperational: boolean;
  set: (fn: (s: FiltersState) => Partial<FiltersState>) => void;
  reset: () => void;
};

export const useFilters = create<FiltersState>((set) => ({
  query: "",
  connectorTypes: new Set(),
  minPowerKW: undefined,
  dcOnly: false,
  onlyOperational: false,
  set: (fn) => set((s) => ({ ...s, ...fn(s) })),
  reset: () => set({
    query: "",
    connectorTypes: new Set(),
    minPowerKW: undefined,
    dcOnly: false,
    onlyOperational: false
  })
}));
