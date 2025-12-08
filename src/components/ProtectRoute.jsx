import { Navigate, useLocation } from "react-router-dom";
import { useOrganisation } from "../context/OrganisationContext";

const ProtectedRoute = ({ children }) => {
  const { organisation, isLoading } = useOrganisation();
  const location = useLocation();

  // Allow verify email without login
  if (location.pathname.startsWith("/verify-email")) {
    return children;
  }

  // Allow forgot password without login
  if (location.pathname.startsWith("/forgot-password")) {
    return children;
  }

  // You can add any other non-protected routes here

  if (isLoading) return <div>Loading...</div>;

  if (!organisation) return <Navigate to="/access-denied" replace />;

  return children;
};

export default ProtectedRoute;
