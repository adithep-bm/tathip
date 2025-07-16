import { useState } from 'react';
import SideBar from '../components/SideBar';
import Header from '../components/Header';
import { Globe, PauseCircle, PlayCircle } from 'lucide-react';

function WebCrawlerPage() {
  const [isRunning, setIsRunning] = useState(false);

  const toggleCrawler = () => {
    setIsRunning(!isRunning);
  };

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
              {/* Control Panel */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">ควบคุมระบบ</h2>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className="text-sm text-gray-300">
                      {isRunning ? 'กำลังทำงาน' : 'หยุดทำงาน'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Crawler Control */}
                  <div className="space-y-4">
                    <button
                      onClick={toggleCrawler}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${isRunning
                        ? 'bg-red-700 hover:bg-red-600 text-white'
                        : 'bg-green-700 hover:bg-green-600 text-white'
                        }`}
                    >
                      {isRunning ? (
                        <>
                          <PauseCircle className="w-4 h-4" />
                          <span>หยุดการทำงาน</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          <span>เริ่มการทำงาน</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Keywords */}
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