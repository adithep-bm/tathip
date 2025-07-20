import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { useEffect } from "react";

const ProtectedRoute = () => {
  const { userInfo, loading, hasInitialized, isInitializing } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("ProtectedRoute mounted at path:", location.pathname);
    console.log("Current auth state:", {
      userInfo,
      loading,
      hasInitialized,
      isInitializing,
    });
  }, [location.pathname, userInfo, loading, hasInitialized, isInitializing]);

  console.log(
    "ProtectedRoute - loading:",
    loading,
    "hasInitialized:",
    hasInitialized,
    "isInitializing:",
    isInitializing,
    "userInfo:",
    userInfo,
    "path:",
    location.pathname
  ); // Debug log

  // ถ้ายังอยู่ในขั้นตอน initialization หรือ loading ให้แสดง spinner
  if (isInitializing || loading || !hasInitialized) {
    console.log(
      "ProtectedRoute - still initializing or loading, showing spinner"
    );
    return <LoadingSpinner />;
  }

  // ถ้า initialization เสร็จแล้วแต่ไม่มี user ให้ redirect ไป login
  if (hasInitialized && !isInitializing && !loading && !userInfo) {
    console.log(
      "ProtectedRoute - initialized but no user, redirecting to login from:",
      location.pathname
    );

    // ใช้ window.location.replace เพื่อบังคับ redirect
    setTimeout(() => {
      window.location.replace("/");
    }, 100);

    return <LoadingSpinner />;
  }

  // ถ้ามี user ให้อนุญาตเข้าถึง
  if (userInfo && hasInitialized && !isInitializing && !loading) {
    console.log(
      "ProtectedRoute - user authenticated, allowing access to:",
      location.pathname
    );
    return <Outlet />;
  }

  // Fallback - ถ้าไม่มีเงื่อนไขไหนเข้า ให้ redirect ไป login
  console.log(
    "ProtectedRoute - fallback, redirecting to login from:",
    location.pathname
  );

  // ใช้ window.location.replace เพื่อบังคับ redirect
  setTimeout(() => {
    window.location.replace("/");
  }, 100);

  return <LoadingSpinner />;
};

export default ProtectedRoute;
