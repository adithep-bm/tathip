import { Activity } from "lucide-react";

function HeaderWatchList() {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-300 mt-1">ภาพรวมระบบสืบสวนอาชญากรรมทางไซเบอร์</p>
        </div>
        <div className="flex items-center space-x-2 text-green-400">
          <Activity className="w-5 h-5" />
          <span className="text-sm font-medium">ระบบทำงานปกติ</span>
        </div>
      </div>
    </div>

  );
}

export default HeaderWatchList;