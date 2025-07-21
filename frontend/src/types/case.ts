// src/types/case.ts

/**
 * กำหนดประเภทของความสำคัญของคดี
 */
export type CasePriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * กำหนดประเภทของสถานะคดี
 */
export type CaseStatus = 'open' | 'investigating' | 'closed' | 'suspended';

/**
 * กำหนดประเภทของหมวดหมู่คดี
 */
export type CaseType = 'cyber_crimes' | 'financial_crimes' | 'gambling' | 'fraud';

/**
 * โครงสร้างข้อมูลของคดี (Case Object)
 */
export interface Case {
  evidence?: Evidence[];
  case_id: string;
  title: string;
  description: string;
  case_type: CaseType;
  priority: CasePriority;
  status: CaseStatus;
  createdDate: string;   // รูปแบบ 'YYYY-MM-DD'
  lastUpdated: string;   // รูปแบบ 'YYYY-MM-DD'
  assignedOfficer: string;
  evidenceCount: number;
}

export interface newCase {
  title: string;
  description: string;
  case_type: CaseType;
  priority: CasePriority;
}

export interface Evidence {
  id: string;
  case_id: string; // ID ของคดีที่หลักฐานนี้เกี่ยวข้อง
  file_name: string; // ชื่อหลักฐาน
  url: string;
  description?: string; // อาจมีคำอธิบายเพิ่มเติมเกี่ยวกับหลักฐาน
  uploadedAt: string; // วันที่อัพโหลดหลักฐาน รูปแบบ 'YYYY-MM-DD'
}
