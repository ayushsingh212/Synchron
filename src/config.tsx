import React, { createContext, useContext, useState } from "react";

// ENV constants
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const MODEL_BASE_URL = import.meta.env.VITE_MODEL_BASE_URL;

// ------------------------------
// Types
// ------------------------------
type StateContextType = {
  hasOrganisationData: boolean;
  setHasOrganisationData: (value: boolean) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
};

// ------------------------------
// Create ONE context only
// ------------------------------
const StateContext = createContext<StateContextType | undefined>(undefined);

// ------------------------------
// Provider
// ------------------------------
const StateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasOrganisationData, setHasOrganisationData] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const value: StateContextType = {
    hasOrganisationData,
    setHasOrganisationData,
    sidebarOpen,
    setSidebarOpen,
  };

  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
};

// ------------------------------
// Hook
// ------------------------------
export const useAppState = () => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error("useAppState must be used within a StateContextProvider");
  }
  return context;
};

export default StateContextProvider;
