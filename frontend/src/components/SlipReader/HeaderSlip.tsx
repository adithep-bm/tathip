import { FileText } from 'lucide-react';

function HeaderSlip() {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      <div className="flex items-center space-x-3">
        <FileText className="w-8 h-8 text-green-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Slip Reader</h1>
          <p className="text-gray-300 mt-1">ระบบแยกรูปภาพสลิปและอ่านข้อความในสลิป</p>
        </div>
      </div>
    </div>
  );
}

export default HeaderSlip;