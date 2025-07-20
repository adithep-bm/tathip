// ตัวอย่างการใช้งาน Cookie-based Token Management

import { 
  getAccessTokenCookie, 
  setAccessTokenCookie, 
  clearAccessTokenCookie,
  isTokenValid 
} from '../utils/cookieManager';

import { 
  getStoredToken, 
  setToken, 
  clearToken 
} from '../utils/axiosInstance';

// ตัวอย่างการใช้งานในการ login
export const loginExample = async (credentials: any) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (data.accessToken) {
      // เก็บ token ใน cookie (ใช้ฟังก์ชันจาก axiosInstance)
      setToken(data.accessToken);
      
      console.log('Login successful, token saved to cookie');
      return data;
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// ตัวอย่างการตรวจสอบ token ก่อนเข้าหน้าที่ต้อง authentication
export const checkAuthExample = () => {
  const token = getStoredToken();
  
  if (!token) {
    console.log('No token found, redirecting to login');
    return false;
  }
  
  if (!isTokenValid()) {
    console.log('Token expired, clearing and redirecting to login');
    clearToken();
    return false;
  }
  
  console.log('Token is valid, user is authenticated');
  return true;
};

// ตัวอย่างการ logout
export const logoutExample = async () => {
  try {
    // เรียก API logout (ถ้ามี)
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`
      }
    });
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // ล้าง token จาก cookies และ storage
    clearToken();
    console.log('Logout completed, tokens cleared');
  }
};

// ตัวอย่างการตรวจสอบ token เมื่อแอปเริ่มต้น
export const initializeAppExample = () => {
  console.log('Initializing app...');
  
  const isAuthenticated = checkAuthExample();
  
  if (isAuthenticated) {
    console.log('User is authenticated, loading user data...');
    // โหลดข้อมูล user หรือ redirect ไปหน้า dashboard
  } else {
    console.log('User is not authenticated, showing login form...');
    // แสดงหน้า login
  }
};
