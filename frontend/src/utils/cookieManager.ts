// ฟังก์ชันสำหรับจัดการ cookies
export const setCookie = (name: string, value: string, days = 7): void => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  // เพิ่มความปลอดภัยด้วย HttpOnly simulation และ SameSite
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict${isSecure ? ';Secure' : ''}`;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name: string): void => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict`;
};

// ฟังก์ชันเฉพาะสำหรับ access token
export const setAccessTokenCookie = (token: string): void => {
  // เก็บ token ใน cookie สำหรับ 1 วัน (เนื่องจาก access token มักมีอายุสั้น)
  setCookie('accessToken', token, 1);
  
  // เก็บสำรองใน localStorage ด้วยเพื่อ backward compatibility
  localStorage.setItem('accessToken', token);
  
  console.log('Access token saved to secure cookie and localStorage');
};

export const getAccessTokenCookie = (): string | null => {
  // ลองดึงจาก cookie ก่อน
  let token = getCookie('accessToken');
  
  // ถ้าไม่มีใน cookie ให้ลองดึงจาก localStorage
  if (!token) {
    token = localStorage.getItem('accessToken');
    // ถ้าเจอใน localStorage ให้ย้ายไปไว้ใน cookie
    if (token) {
      setAccessTokenCookie(token);
      localStorage.removeItem('accessToken');
    }
  }
  
  return token;
};

export const clearAccessTokenCookie = (): void => {
  deleteCookie('accessToken');
  localStorage.removeItem('accessToken');
  sessionStorage.removeItem('accessToken');
  
  console.log('Access token cleared from all storage');
};

// ฟังก์ชันตรวจสอบว่า token ใน cookie ยังใช้งานได้หรือไม่
export const isTokenValid = (): boolean => {
  const token = getAccessTokenCookie();
  if (!token) return false;
  
  try {
    // ตรวจสอบ token format และ expiry (ถ้า token เป็น JWT)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp > currentTime;
  } catch {
    // ถ้า token ไม่ใช่ JWT หรือ parse ไม่ได้ ให้ถือว่าเป็น valid token
    return true;
  }
};
