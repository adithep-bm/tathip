import { createContext, useContext, useState, useEffect } from "react"; // 1. Import useEffect
import type { ReactNode } from "react";
import axios, {
  getStoredToken,
  clearToken,
  setToken,
} from "../utils/axiosInstance";
import { initializeTokenOnStartup } from "../utils/tokenManager";

// --- Interfaces remain the same ---
interface Credentials {
  username: string;
  password: string;
}

interface User {
  id: string;
  username: string;
  role?: string;
  // Add other user properties as needed
}

interface AuthContextType {
  userInfo: User | null;
  loading: boolean;
  hasInitialized: boolean;
  isInitializing: boolean;
  action: {
    login: (credentials: Credentials) => void;
    logout: () => void;
  };
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [_user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedOut, setIsLoggedOut] = useState<boolean>(false); // เพิ่ม state เพื่อติดตาม logout
  const [hasInitialized, setHasInitialized] = useState<boolean>(false); // ติดตามว่า initialized แล้วยัง
  const [isInitializing, setIsInitializing] = useState<boolean>(true); // เพิ่ม state เพื่อติดตาม initialization process

  useEffect(() => {
    console.log("AuthContext useEffect triggered. isLoggedOut:", isLoggedOut);

    // ถ้า logout แล้วให้ข้าม fetch user และ set states ทันที
    if (isLoggedOut) {
      console.log("User is logged out, setting states accordingly");
      setLoading(false);
      setUser(null); // ให้แน่ใจว่า user เป็น null
      setHasInitialized(true);
      setIsInitializing(false);
      return;
    }

    const fetchUser = async () => {
      console.log("Starting fetchUser...");
      setLoading(true); // เริ่ม loading
      setIsInitializing(true);
      setHasInitialized(false); // Reset สถานะ

      // ตรวจสอบและกู้คืน token ก่อน
      const tokenInitialized = await initializeTokenOnStartup();
      if (!tokenInitialized) {
        console.log("Token initialization failed");
        setUser(null);
        setLoading(false);
        setHasInitialized(true);
        setIsInitializing(false);
        return;
      }

      // ตรวจสอบ access token อีกครั้งหลังจาก initialization
      const accessToken = getStoredToken();
      if (!accessToken) {
        console.log("No access token found after initialization");
        setUser(null);
        setLoading(false);
        setHasInitialized(true);
        setIsInitializing(false);
        return;
      }

      try {
        console.log("Making API call to /auths/me with access token...");
        const response = await axios.get("/auths/me", {
          withCredentials: true, // สำคัญ! เพื่อส่ง cookie ไปด้วย
        });
        console.log("User fetched successfully:", response.data);
        setUser(response.data);
      } catch (error) {
        console.log("Failed to fetch user, error:", error);
        console.log("Setting user to null");
        setUser(null);

        // ถ้า error เป็น 401 ให้ล้าง access token ด้วยฟังก์ชันใหม่
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 401) {
            console.log("Access token invalid, clearing it");
            clearToken();
          }
        }

        // ถ้าไม่มี user และอยู่ใน protected route ให้ redirect
        const currentPath = window.location.pathname;
        const protectedPaths = [
          "/case",
          "/dashboard",
          "/user-profile",
          "/slip",
          "/illegal-images",
          "/crawler",
          "/reports",
          "/watchlist",
          "/alerts",
          "/usermanagement",
        ];
        if (protectedPaths.some((path) => currentPath.startsWith(path))) {
          console.log(
            "User not authenticated and on protected path, redirecting to login"
          );
          window.location.href = "/";
        }
      } finally {
        console.log("fetchUser completed, setting final states");
        setLoading(false);
        setHasInitialized(true);
        setIsInitializing(false);
      }
    };

    // เพิ่ม timeout เล็กน้อยเพื่อให้แน่ใจว่า states ถูก set
    const timeoutId = setTimeout(() => {
      fetchUser();
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [isLoggedOut]); // เพิ่ม isLoggedOut เป็น dependency

  const login = async (credentials: Credentials) => {
    try {
      const response = await axios.post("auths/login", credentials);

      // บันทึก access token ด้วยฟังก์ชันใหม่
      if (response.data.accessToken) {
        setToken(response.data.accessToken);
        console.log("Access token saved to storage");
      }

      // บันทึกข้อมูล user
      setUser(response.data.user || response.data);
      setIsLoggedOut(false); // Reset logout flag เมื่อ login สำเร็จ

      console.log("Login successful:", response.data);
      return response.data; // return ข้อมูลผู้ใช้
    } catch (error) {
      console.error("Login failed:", error);
      throw error; // throw error ให้ component จัดการ
    }
  };

  const logout = async () => {
    console.log("Logout function called"); // Debug log

    // Set logout flag ก่อนทำอะไร
    setIsLoggedOut(true);

    try {
      // ส่ง access token ไปใน logout request
      await axios.post(
        "/auth/logout",
        {},
        {
          withCredentials: true,
        }
      );
      console.log("Logout API call successful"); // Debug log
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with logout even if API fails
    } finally {
      console.log("Clearing user data and tokens"); // Debug log
      setUser(null);

      // Clear all stored auth data ด้วยฟังก์ชันใหม่
      clearToken();
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("authToken");

      console.log("User data and tokens cleared"); // Debug log
    }
  };

  const value = {
    userInfo: _user,
    loading,
    hasInitialized,
    isInitializing,
    action: {
      login,
      logout,
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- useAuth hook remains the same ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
