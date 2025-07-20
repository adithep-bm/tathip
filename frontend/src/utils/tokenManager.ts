import { getStoredToken, validateToken, clearToken } from "./axiosInstance";

// ฟังก์ชันสำหรับตรวจสอบและกู้คืน token เมื่อเริ่มต้นแอป
export const initializeTokenOnStartup = async (): Promise<boolean> => {
  console.log("Initializing token on app startup...");

  const token = getStoredToken();
  if (!token) {
    console.log("No token found during startup");
    return false;
  }

  console.log("Token found in cookies, validating...");

  try {
    const isValid = await validateToken();
    if (isValid) {
      console.log("Token is valid and ready to use");
      return true;
    } else {
      console.log("Token validation failed during startup");
      clearToken();
      return false;
    }
  } catch (error) {
    console.log("Error during token validation:", error);
    clearToken();
    return false;
  }
};

// ฟังก์ชันสำหรับตรวจสอบ token ก่อนการเรียก API สำคัญ
export const ensureTokenValid = async (): Promise<boolean> => {
  const token = getStoredToken();
  if (!token) {
    return false;
  }

  try {
    return await validateToken();
  } catch (error) {
    console.log("Token validation failed:", error);
    clearToken();
    return false;
  }
};

// ฟังก์ชันสำหรับ refresh หน้าเว็บและรักษา token
export const handlePageRefresh = () => {
  // ตรวจสอบว่ามี token ใน cookies หรือไม่
  const token = getStoredToken();
  if (token) {
    console.log("Token restored from cookies after page refresh");
    return true;
  }

  console.log("No token found in cookies after page refresh");
  return false;
};

// Event listener สำหรับ beforeunload เพื่อเก็บ token
export const setupTokenPersistence = () => {
  // เมื่อหน้าเว็บกำลังปิดหรือ refresh
  window.addEventListener("beforeunload", () => {
    const token = getStoredToken();
    if (token) {
      // Token อยู่ใน cookies อยู่แล้ว ไม่จำเป็นต้องทำอะไรเพิ่ม
      console.log("Token is already persisted in cookies");
    }
  });

  // เมื่อหน้าเว็บโหลดเสร็จ
  window.addEventListener("load", () => {
    handlePageRefresh();
  });
};
