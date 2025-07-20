# Cookie-based Token Management System

## การปรับปรุงระบบจัดการ Access Token เพื่อใช้ Cookies

### ไฟล์ที่สร้างและแก้ไข:

1. **`cookieManager.ts`** - ฟังก์ชันสำหรับจัดการ cookies
2. **`axiosInstance.ts`** - อัปเดตเพื่อใช้ cookie functions  
3. **`tokenManager.ts`** - อัปเดตเพื่อรองรับ cookies
4. **`AuthContext.tsx`** - ใช้งานฟังก์ชันใหม่

### ประโยชน์ของการใช้ Cookies:

✅ **ความปลอดภัย**: Cookies สามารถตั้งค่า `HttpOnly`, `Secure`, `SameSite` ได้  
✅ **Auto-expire**: กำหนดวันหมดอายุได้อัตโนมัติ  
✅ **Cross-tab sync**: Token ใช้งานได้ในทุก tab อัตโนมัติ  
✅ **Persistent storage**: ไม่หายเมื่อ refresh หน้าจอ  
✅ **Better security**: ป้องกัน XSS attacks ได้ดีกว่า localStorage  

### วิธีใช้งาน:

#### 1. การเก็บ Token (เมื่อ Login)
```typescript
import { setToken } from '../utils/axiosInstance';

// เก็บ token ใน cookie และ localStorage
setToken(accessToken);
```

#### 2. การดึง Token (เมื่อต้องการใช้)
```typescript
import { getStoredToken } from '../utils/axiosInstance';

// ดึง token จาก cookie หรือ localStorage
const token = getStoredToken();
```

#### 3. การล้าง Token (เมื่อ Logout)
```typescript
import { clearToken } from '../utils/axiosInstance';

// ล้าง token จากทุก storage
clearToken();
```

#### 4. การตรวจสอบ Token
```typescript
import { isTokenValid } from '../utils/cookieManager';

// ตรวจสอบว่า token ยังใช้งานได้หรือไม่
if (isTokenValid()) {
  // Token ยังใช้งานได้
}
```

### การตั้งค่า Security:

- **SameSite=Strict**: ป้องกัน CSRF attacks
- **Secure flag**: ใช้เฉพาะ HTTPS (ในโปรดักชัน)
- **Expiry**: กำหนดวันหมดอายุ 1 วัน (เหมาะสำหรับ access token)
- **Path=/**: ใช้งานได้ทั้งเว็บไซต์

### การทำงานของระบบ:

1. **เมื่อ Login**: Token ถูกเก็บใน cookie และ localStorage
2. **เมื่อ API call**: ระบบดึง token จาก cookie และเพิ่มใน Authorization header
3. **เมื่อ Refresh**: Token จาก cookie จะถูกกู้คืนอัตโนมัติ
4. **เมื่อ Token expired**: ระบบจะพยายาม refresh หรือ redirect ไป login
5. **เมื่อ Logout**: Token จะถูกล้างจากทุก storage

### Backward Compatibility:

ระบบยังคงรองรับ localStorage เพื่อความเข้ากันได้:
- ถ้ามี token ใน localStorage จะย้ายไปไว้ใน cookie
- ถ้าไม่มีใน cookie จะลองหาใน localStorage
- การล้างจะล้างทั้ง cookie และ localStorage

### การใช้งานใน Components:

```typescript
// ใน AuthContext หรือ components อื่นๆ
import { getStoredToken, setToken, clearToken } from '../utils/axiosInstance';

// Login
const handleLogin = async (credentials) => {
  const response = await axios.post('/auth/login', credentials);
  if (response.data.accessToken) {
    setToken(response.data.accessToken); // เก็บใน cookie
  }
};

// Logout  
const handleLogout = () => {
  clearToken(); // ล้างจาก cookie และ localStorage
};

// Check auth status
const isAuthenticated = () => {
  return !!getStoredToken(); // ตรวจสอบจาก cookie
};
```

### Notes:

- Access token จะหมดอายุใน 1 วัน (สามารถปรับได้)
- ระบบจะตรวจสอบ JWT expiry time ถ้า token เป็น JWT format
- สำหรับโปรดักชัน ควรใช้ `HttpOnly` cookies ที่ส่งจาก server
- ปัจจุบันใช้ client-side cookies เนื่องจากข้อจำกัดของ browser security
