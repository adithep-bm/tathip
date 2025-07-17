import { X, FileText, Trash2, ChevronDown } from 'lucide-react';
import type { Case, Evidence } from '../../types/case'; // สมมติว่ามีการ export Type ทั้งหมด
import { useState, useEffect } from 'react';

// --- สร้าง Options สำหรับ Dropdown (ใช้จริงควรดึงมาจาก Enum) ---
const caseTypeOptions = [
  { value: 'cyber_crimes', label: 'อาชญากรรมไซเบอร์' },
  { value: 'financial_crimes', label: 'อาชญากรรมทางการเงิน' },
  { value: 'gambling', label: 'การพนันออนไลน์' },
  { value: 'fraud', label: 'การหลอกลวง' },
  { value: 'other', label: 'อื่นๆ' },
];

const priorityOptions = [
  { value: 'low', label: 'ต่ำ' },
  { value: 'medium', label: 'ปานกลาง' },
  { value: 'high', label: 'สูง' },
  { value: 'critical', label: 'วิกฤต' },
];


interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updatedCase: Case) => void;
  caseData: Case;
}

export function EditCaseModal({ isOpen, onClose, onSubmit, caseData }: EditCaseModalProps) {
  const [editedCase, setEditedCase] = useState<Case>(caseData);

  useEffect(() => {
    setEditedCase(caseData);
  }, [caseData, isOpen]); // รีเซ็ต State เมื่อ caseData หรือสถานะ Modal เปลี่ยน

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedCase(prevCase => ({
      ...prevCase,
      [name]: value,
    }));
  };

  const handleDeleteEvidence = (evidenceId: Evidence['id']) => {
    setEditedCase(prevCase => ({
      ...prevCase,
      evidence: prevCase.evidence ? prevCase.evidence.filter(item => item.id !== evidenceId) : [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(editedCase);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        <div className="relative bg-slate-800 rounded-lg w-full max-w-2xl p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">แก้ไขคดี</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* --- ฟิลด์ชื่อคดี --- */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">ชื่อคดี</label>
                <input id="title" name="title" type="text" value={editedCase.title} onChange={handleChange} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>

              {/* --- ฟิลด์รายละเอียด --- */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">รายละเอียด</label>
                <textarea id="description" name="description" value={editedCase.description} onChange={handleChange} rows={5} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* --- Dropdown ประเภทคดี --- */}
                <div>
                  <label htmlFor="case_type" className="block text-sm font-medium text-gray-300 mb-1">ประเภทคดี</label>
                  <div className="relative">
                    <select id="case_type" name="case_type" value={editedCase.case_type} onChange={handleChange} className="w-full appearance-none px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      {caseTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* --- Dropdown ความสำคัญ --- */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-1">ความสำคัญ</label>
                  <div className="relative">
                    <select id="priority" name="priority" value={editedCase.priority} onChange={handleChange} className="w-full appearance-none px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* --- ส่วนแสดงและลบหลักฐาน --- */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">รายการหลักฐาน</label>
                <div className="space-y-2">
                  {editedCase.evidence && editedCase.evidence.length > 0 ? (
                    editedCase.evidence.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-slate-700 p-2 rounded-md">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <span className="text-white truncate" title={item.file_name}>{item.file_name}</span>
                        </div>
                        <button type="button" onClick={() => handleDeleteEvidence(item.id)} className="text-red-500 hover:text-red-400 p-1 flex-shrink-0" aria-label={`ลบไฟล์ ${item.file_name}`}>
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm px-2">ไม่มีหลักฐาน</p>
                  )}
                </div>
              </div>
            </div>

            {/* --- ปุ่มควบคุม --- */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-700">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white rounded-md hover:bg-slate-700">ยกเลิก</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500">บันทึกการแก้ไข</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}