import { Navigate } from "react-router-dom";
import { useOrganisation } from "../context/OrganisationContext";

const ProtectedRoute = ({ children }) => {
  const { organisation, isLoading } = useOrganisation();

  if (isLoading) return <div>Loading...</div>;

  if (!organisation) return <Navigate to="/access-denied" replace />;

  return children;
};

export default ProtectedRoute;
