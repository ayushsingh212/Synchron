import { useState, createContext, useContext } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

export const OrganisationContext = createContext();

export const OrganisationProvider = ({ children }) => {
  const [organisation, setOrganisation] = useState(null);

  const getOrganisation = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/organisation/getCurrentOrganisation`,
        {
          withCredentials: true,
        }
      );
      console.log("Context is ww");

      console.log("I am the data", res.data);
      return res.data.data;
    } catch (error) {
      console.error("Error fetching organisation:", error);
    }
  };

  return (
    <OrganisationContext.Provider
      value={{ organisation, setOrganisation, getOrganisation }}
    >
      {children}
    </OrganisationContext.Provider>
  );
};

export const useOrganisation = ()=>{
  return useContext(OrganisationContext)
}
