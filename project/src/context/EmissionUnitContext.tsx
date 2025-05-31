import React, { createContext, useContext, useState, ReactNode } from 'react';

export type EmissionUnit = 'kg' | 't' | 'kt';

interface EmissionUnitContextValue {
  unit: EmissionUnit;
  setUnit: (u: EmissionUnit) => void;
  convert: (valueKg: number) => number;
  label: string; // e.g. "kg CO₂e"
}

const EmissionUnitContext = createContext<EmissionUnitContextValue | undefined>(undefined);

export const EmissionUnitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unit, setUnit] = useState<EmissionUnit>('kg');

  const convert = (valueKg: number): number => {
    switch (unit) {
      case 't':
        return valueKg / 1000;
      case 'kt':
        return valueKg / 1_000_000;
      default:
        return valueKg;
    }
  };

  const labelMap: Record<EmissionUnit, string> = {
    kg: 'kg CO₂e',
    t: 't CO₂e',
    kt: 'kt CO₂e',
  };

  return (
    <EmissionUnitContext.Provider value={{ unit, setUnit, convert, label: labelMap[unit] }}>
      {children}
    </EmissionUnitContext.Provider>
  );
};

export const useEmissionUnit = (): EmissionUnitContextValue => {
  const context = useContext(EmissionUnitContext);
  if (!context) {
    throw new Error('useEmissionUnit must be used within an EmissionUnitProvider');
  }
  return context;
}; 