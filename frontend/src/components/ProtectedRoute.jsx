import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { checking, isAuthenticated } = useAuth();

  if (checking) {
    return (
      <div className="screen-loader">
        <div className="spinner" />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
