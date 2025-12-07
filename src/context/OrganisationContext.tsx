// context/OrganisationContext.tsx
import { useState, createContext, useContext, useCallback, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

export interface OrganisationType {
  _id?: string;
  name?: string;
  email?: string;
  type?: string;
  avatar?: string;
  contactNumber?: string;
  isEmailVerified?: boolean; // Add this field
  [key: string]: any;
}

export interface OrganisationContextType {
  organisation: OrganisationType | null;
  setOrganisation: (org: OrganisationType | null) => void;
  getOrganisation: () => Promise<OrganisationType | null>;
  isLoading: boolean;
  currentlyViewedTimtable: any[];
  setCurrentlyViewedTimtable: (v: any[]) => void;
  refreshOrganisation: () => Promise<void>; // Add this method
}

export const OrganisationContext = createContext<OrganisationContextType | undefined>(undefined);

export const OrganisationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organisation, setOrganisation] = useState<OrganisationType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentlyViewedTimtable, setCurrentlyViewedTimtable] = useState([]);

  const getOrganisation = useCallback(async (): Promise<OrganisationType | null> => {
    try {
      const res = await axios.get(`${API_BASE_URL}/organisation/getCurrentOrganisation`, {
        withCredentials: true,
      });

      const data = res.data?.data || null;
      setOrganisation(data);
      return data;
    } catch (error) {
      console.error("Error fetching organisation:", error);
      setOrganisation(null);
      return null;
    }
  }, []);

  // Add refresh method
  const refreshOrganisation = useCallback(async () => {
    setIsLoading(true);
    await getOrganisation();
    setIsLoading(false);
  }, [getOrganisation]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await getOrganisation();
      setIsLoading(false);
    })();
  }, [getOrganisation]);

  return (
    <OrganisationContext.Provider
      value={{
        organisation,
        setOrganisation,
        getOrganisation,
        isLoading,
        currentlyViewedTimtable,
        setCurrentlyViewedTimtable,
        refreshOrganisation, // Add this
      }}
    >
      {children}
    </OrganisationContext.Provider>
  );
};

export const useOrganisation = (): OrganisationContextType => {
  const ctx = useContext(OrganisationContext);
  if (!ctx) {
    throw new Error("useOrganisation must be used inside <OrganisationProvider>");
  }
  return ctx;
};