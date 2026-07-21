"use client";
import React, { createContext, useContext } from "react";

type SettingsContextType = {
  systemName: string;
  businessName: string;
  logo: string;
};

const SettingsContext = createContext<SettingsContextType>({
  systemName: "AuraStay",
  businessName: "Guest House Management",
  logo: "",
});

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings: SettingsContextType;
}) {
  return (
    <SettingsContext.Provider value={initialSettings}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
