import { Globe } from "lucide-react";

function HeaderWebCrawler() {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      <div className="flex items-center space-x-3">
        <Globe className="w-8 h-8 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Web Crawler</h1>
          <p className="text-gray-300 mt-1">ระบบตรวจสอบเว็บไซต์ต้องสงสัยอัตโนมัติ</p>
        </div>
      </div>
    </div>
  );
}

export default HeaderWebCrawler;