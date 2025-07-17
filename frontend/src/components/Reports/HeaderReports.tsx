import { Search } from "lucide-react";

function HeaderReports() {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      <div className="flex items-center space-x-3">
        <Search className="w-8 h-8 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-gray-300 mt-1">ระบบรายงานและการส่งออกข้อมูล</p>
        </div>
      </div>
    </div>
  );
}

export default HeaderReports;