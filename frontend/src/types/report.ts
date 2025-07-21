export type ReportType = 'summary' | 'case_details';

export interface Report {
  report_id: string; // ID ของรายงาน
  case_id: string; // ID ของคดีที่รายงานนี้เกี่ยวข้อง
  report_type: ReportType; // ประเภทของรายงาน
  case_title: string; // ชื่อคดีที่เกี่ยวข้อง
  evidence_id: string; // ID ของหลักฐานที่เกี่ยวข้อง
  date_from: string; // วันที่เริ่มต้นของช่วงเวลาที่รายงาน รูป
  date_to: string; // วันที่สิ้นสุดของช่วงเวลาที่รายงาน รูปแบบ 'YYYY-MM-DD'
  report_content: string; // เนื้อหาของรายงาน
  created_at: string; // วันที่และเวลาที่สร้างรายงาน รูปแบบ 'YYYY-MM-DD HH:mm:ss'
}