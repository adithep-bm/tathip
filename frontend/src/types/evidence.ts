export interface Evidence {
  evidence_id: number; // ID ของหลักฐาน (ตรงกับ backend)
  filename: string; // ชื่อไฟล์หลักฐาน
  case_title: string; // ชื่อคดีที่เกี่ยวข้อง
  case_id: string; // ID ของคดีที่หลักฐานนี้เกี่ยวข้อง
  evidence_url: string; // URL ของไฟล์หลักฐานใน Firebase
  created_at: string; // วันที่และเวลาที่สร้างหลักฐาน รูปแบบ 'YYYY-MM-DD HH:mm:ss'
  evidence_type: string; // ประเภทของหลักฐาน เช่น "slip", "image", "document"
  excel_url?: string; // URL สำหรับดาวน์โหลดไฟล์ Excel ที่เกี่ยวข้องกับหลักฐาน (optional)
  confidence?: number; // ค่า confidence ของโมเดล AI ในการจำแนกหลักฐาน (optional)
}

// Type สำหรับ API responses
export interface EvidenceResponse {
  message: string;
  evidence: Evidence;
}

export interface EvidenceListResponse {
  evidences: Evidence[];
  total: number;
}

// Type สำหรับการ upload
export interface UploadSlipsResponse {
  message: string;
  firebase_url: string;
  case_id: string;
  evidence_id: number;
}