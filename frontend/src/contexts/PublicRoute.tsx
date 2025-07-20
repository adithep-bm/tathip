import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const PublicRoute = () => {
  const { userInfo, loading, hasInitialized, isInitializing } = useAuth();

  console.log(
    "PublicRoute - loading:",
    loading,
    "hasInitialized:",
    hasInitialized,
    "isInitializing:",
    isInitializing,
    "userInfo:",
    userInfo
  ); // Debug log

  // ถ้ายังอยู่ในขั้นตอน initialization หรือ loading ให้แสดง spinner
  if (isInitializing || loading || !hasInitialized) {
    console.log("PublicRoute - still initializing or loading, showing spinner");
    return <LoadingSpinner />;
  }

  // ถ้า initialization เสร็จแล้วและมี user ให้ redirect ไป dashboard
  if (hasInitialized && userInfo) {
    console.log("PublicRoute - user is logged in, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("PublicRoute - no user, allowing access to public page");
  return <Outlet />;
};

export default PublicRoute;
