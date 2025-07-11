import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const ProtectedRoute = () => {
    const { userInfo, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    return userInfo ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;