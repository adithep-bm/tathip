import type { Case } from '../types/case';

interface CreateCaseFormProps {
  newCase: {
    title: string;
    description: string;
    category: 'cybercrime' | 'financial' | 'gambling' | 'fraud' | 'other';
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  setNewCase: React.Dispatch<React.SetStateAction<{
    title: string;
    description: string;
    category: 'cybercrime' | 'financial' | 'gambling' | 'fraud' | 'other';
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>>;
  createCase: () => void;
  setShowCreateForm: React.Dispatch<React.SetStateAction<boolean>>;
}

function CreateCaseForm({ newCase, setNewCase, createCase, setShowCreateForm }: CreateCaseFormProps) {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-purple-600">
      <h3 className="text-lg font-semibold text-white mb-4">สร้างคดีสืบสวนใหม่</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">ชื่อคดี</label>
          <input
            type="text"
            value={newCase.title}
            onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="ระบุชื่อคดี"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">ประเภทคดี</label>
          <select
            value={newCase.category}
            onChange={(e) => setNewCase({ ...newCase, category: e.target.value as Case['category'] })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
          >
            <option value="cybercrime">อาชญากรรมไซเบอร์</option>
            <option value="financial">อาชญากรรมทางการเงิน</option>
            <option value="gambling">การพนันออนไลน์</option>
            <option value="fraud">การหลอกลวง</option>
            <option value="other">อื่นๆ</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">ระดับความสำคัญ</label>
          <select
            value={newCase.priority}
            onChange={(e) => setNewCase({ ...newCase, priority: e.target.value as Case['priority'] })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
          >
            <option value="low">ต่ำ</option>
            <option value="medium">กลาง</option>
            <option value="high">สูง</option>
            <option value="critical">วิกฤต</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">รายละเอียด</label>
          <textarea
            value={newCase.description}
            onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
            rows={3}
            placeholder="ระบุรายละเอียดคดี"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-3 mt-4">
        <button
          onClick={() => setShowCreateForm(false)}
          className="px-4 py-2 text-gray-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"
        >
          ยกเลิก
        </button>
        <button
          onClick={createCase}
          className="px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-600 transition-colors"
        >
          สร้างคดี
        </button>
      </div>
    </div>
  );
}

export default CreateCaseForm;