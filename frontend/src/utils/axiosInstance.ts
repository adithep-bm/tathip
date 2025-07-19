import axios from 'axios';
import conf from '../configs/config';

const axiosInstance = axios.create({
  baseURL: conf.apiPrefix, // ใช้ URL ของ API ที่กำหนดใน config',
  withCredentials: true, // สำคัญมาก เพื่อให้ส่ง cookie ไปกับ request
});

export default axiosInstance;
