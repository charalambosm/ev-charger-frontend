import { create } from "zustand";

export type FiltersState = {
  query: string;
  connectorTypes: Set<string>; // e.g., "CCS (Type 2)", "Type 2 (Socket Only)", "CHAdeMO"
  powerKW: Set<number>;
  dcOnly: boolean;
  acOnly: boolean;
  onlyOperational: boolean;
  districts: Set<string>;
  operators: Set<string>;
  set: (fn: (s: FiltersState) => Partial<FiltersState>) => void;
  reset: () => void;
  toggleDistrict: (district: string) => void;
  toggleOperator: (operator: string) => void;
  togglePower: (power: number) => void;
  clearDistricts: () => void;
  clearOperators: () => void;
  clearPower: () => void;
};

export const useFilters = create<FiltersState>((set) => ({
  query: "",
  connectorTypes: new Set(["CCS (Type 2)", "CHAdeMO", "Type 2 (Socket Only)", "Unknown/Other"]),
  powerKW: new Set([7, 22, 50, 150]),
  dcOnly: true,
  acOnly: true,
  onlyOperational: false,
  districts: new Set(),
  operators: new Set(),
  set: (fn) => set((s) => ({ ...s, ...fn(s) })),
  reset: () => set({
    query: "",
    connectorTypes: new Set(["CCS (Type 2)", "CHAdeMO", "Type 2 (Socket Only)", "Unknown/Other"]),
    powerKW: new Set([7, 22, 50, 150]),
    dcOnly: true,
    acOnly: true,
    onlyOperational: false,
    districts: new Set(),
    operators: new Set()
  }),
  toggleDistrict: (district) => set((s) => {
    const next = new Set(s.districts);
    if (next.has(district)) next.delete(district); else next.add(district);
    return { districts: next } as Partial<FiltersState>;
  }),
  toggleOperator: (operator) => set((s) => {
    const next = new Set(s.operators);
    if (next.has(operator)) next.delete(operator); else next.add(operator);
    return { operators: next } as Partial<FiltersState>;
  }),
  togglePower: (power) => set((s) => {
    const next = new Set(s.powerKW);
    if (next.has(power)) next.delete(power); else next.add(power);
    return { powerKW: next } as Partial<FiltersState>;
  }),
  clearDistricts: () => set(() => ({ districts: new Set() })),
  clearOperators: () => set(() => ({ operators: new Set() })),
  clearPower: () => set(() => ({ powerKW: new Set() }))
}));
