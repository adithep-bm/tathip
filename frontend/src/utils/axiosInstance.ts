import axios from "axios";
import conf from "../configs/config";
import { 
  getAccessTokenCookie, 
  setAccessTokenCookie, 
  clearAccessTokenCookie,
  isTokenValid 
} from "./cookieManager";

const axiosInstance = axios.create({
  baseURL: conf.apiPrefix, // ใช้ URL ของ API ที่กำหนดใน config',
  withCredentials: true, // สำคัญมาก เพื่อให้ส่ง cookie ไปกับ request
});

// ฟังก์ชันสำหรับจัดการ token (อัปเดตเพื่อใช้ cookies)
const getStoredToken = (): string | null => {
  return getAccessTokenCookie();
};

const setToken = (token: string): void => {
  setAccessTokenCookie(token);
};

const clearToken = (): void => {
  clearAccessTokenCookie();
};

// ฟังก์ชันสำหรับตรวจสอบ token เมื่อเริ่มต้นแอป
const initializeAuth = (): boolean => {
  const token = getStoredToken();
  if (token && isTokenValid()) {
    console.log("Token found and restored from cookies");
    return true;
  }
  if (token && !isTokenValid()) {
    console.log("Token found but expired, clearing...");
    clearToken();
  }
  console.log("No valid token found");
  return false;
};

// ฟังก์ชันสำหรับตรวจสอบว่า token ยังใช้งานได้หรือไม่
const validateToken = async (): Promise<boolean> => {
  const token = getStoredToken();
  if (!token) return false;

  // ตรวจสอบ token expiry ก่อน
  if (!isTokenValid()) {
    console.log("Token expired based on expiry time");
    clearToken();
    return false;
  }

  try {
    // ทดสอบ token ด้วยการเรียก API ที่ต้องการ authentication
    await axiosInstance.get('/auth/validate');
    return true;
  } catch {
    console.log("Token validation failed");
    clearToken();
    return false;
  }
};

// Request interceptor เพื่อเพิ่ม Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    // ดึง access token จาก storage
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Adding token to request:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor เพื่อจัดการ token expiry
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ถ้า response status เป็น 401 (Unauthorized) และยังไม่ได้ retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log("Token expired, attempting to refresh...");

      try {
        // พยายาม refresh token
        const refreshResponse = await axios.post(
          `${conf.apiPrefix}/auth/refresh`,
          {},
          {
            withCredentials: true, // ส่ง refresh token ที่อยู่ใน httpOnly cookie
          }
        );

        const newAccessToken = refreshResponse.data.accessToken;

        // บันทึก access token ใหม่ด้วยฟังก์ชันที่ปรับปรุงแล้ว
        setToken(newAccessToken);

        // อัปเดต Authorization header ของ request เดิม
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        console.log("Token refreshed successfully");

        // ส่ง request เดิมอีกครั้งด้วย token ใหม่
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.log("Token refresh failed, redirecting to login");

        // ล้าง token ที่หมดอายุด้วยฟังก์ชันที่ปรับปรุงแล้ว
        clearToken();

        // redirect ไปหน้า login
        window.location.href = "/";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

// Export ฟังก์ชันสำหรับจัดการ token เพื่อใช้ในส่วนอื่นของแอป
export { getStoredToken, setToken, clearToken, initializeAuth, validateToken };
