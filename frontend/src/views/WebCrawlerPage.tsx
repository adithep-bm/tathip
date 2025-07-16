import { useState } from 'react';
import SideBar from '../components/SideBar';
import Header from '../components/Header';
import { Globe } from 'lucide-react';

function WebCrawlerPage() {
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          < SideBar />
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <div className="flex items-center space-x-3">
                  <Globe className="w-8 h-8 text-cyan-400" />
                  <div>
                    <h1 className="text-2xl font-bold text-white">Web Crawler</h1>
                    <p className="text-gray-300 mt-1">ระบบตรวจสอบเว็บไซต์ต้องสงสัยอัตโนมัติ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebCrawlerPage;