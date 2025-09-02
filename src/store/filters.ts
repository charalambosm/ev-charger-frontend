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
  toggleDistrict: (district: string) => void;
  toggleOperator: (operator: string) => void;
  togglePower: (power: number) => void;
  toggleConnectorType: (type: string) => void;
  selectAllDistricts: () => void;
  selectAllOperators: () => void;
  selectAllPower: () => void;
  selectAllConnectorTypes: () => void;
  selectAllCurrent: () => void;
  clearDistricts: () => void;
  clearOperators: () => void;
  clearPower: () => void;
  clearConnectorTypes: () => void;
  clearCurrent: () => void;
  initializeDistricts: (allDistricts: string[]) => void;
  initializeOperators: (allOperators: string[]) => void;
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
  toggleConnectorType: (type) => set((s) => {
    const next = new Set(s.connectorTypes);
    if (next.has(type)) next.delete(type); else next.add(type);
    return { connectorTypes: next } as Partial<FiltersState>;
  }),
  selectAllDistricts: () => set((s) => ({ districts: new Set() })),
  selectAllOperators: () => set((s) => ({ operators: new Set() })),
  selectAllPower: () => set(() => ({ powerKW: new Set([7, 22, 50, 150]) })),
  selectAllConnectorTypes: () => set(() => ({ connectorTypes: new Set(["CCS (Type 2)", "CHAdeMO", "Type 2 (Socket Only)", "Unknown/Other"]) })),
  selectAllCurrent: () => set(() => ({ acOnly: true, dcOnly: true })),
  clearDistricts: () => set(() => ({ districts: new Set() })),
  clearOperators: () => set(() => ({ operators: new Set() })),
  clearPower: () => set(() => ({ powerKW: new Set() })),
  clearConnectorTypes: () => set(() => ({ connectorTypes: new Set() })),
  clearCurrent: () => set(() => ({ acOnly: false, dcOnly: false })),
  initializeDistricts: (allDistricts: string[]) => set(() => ({ districts: new Set(allDistricts) })),
  initializeOperators: (allOperators: string[]) => set(() => ({ operators: new Set(allOperators) }))
}));
