import { Eye } from "lucide-react";


function HeaderWatchList() {
  return (
    < div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700" >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Eye className="w-8 h-8 text-red-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Watchlist</h1>
            <p className="text-gray-300 mt-1">ระบบเฝ้าระวังบัญชีและเว็บไซต์ต้องสงสัย</p>
          </div>
        </div>
      </div>
    </div >
  );
}

export default HeaderWatchList;