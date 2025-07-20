import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../components/SideBar';
import Header from '../components/Header';
import { AlertTriangle, CheckCircle, FolderOpen, Globe, PauseCircle, PlayCircle, Plus, Search, X } from 'lucide-react';
import HeaderWebCrawler from '../components/WebCrawler/HeaderWebCrawler';

interface CrawlResult {
  id: string;
  url: string;
  title: string;
  keywords: string[];
  status: 'safe' | 'suspicious' | 'flagged';
  lastCrawled: string;
  screenshot?: string;
}

function WebCrawlerPage() {
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedWebsite, setSelectedWebsite] = useState<CrawlResult | null>(null);
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);

  const [results, setResults] = useState<CrawlResult[]>([
    {
      id: '1',
      url: 'https://suspicious-betting.com',
      title: 'เว็บแทงบอลออนไลน์ - รับโปรโมชั่นพิเศษ',
      keywords: ['แทงบอล', 'เดิมพัน', 'บาคาร่า'],
      status: 'flagged',
      lastCrawled: '2024-01-16 10:30:00',
    },
    {
      id: '2',
      url: 'https://news-sports.com',
      title: 'ข่าวกีฬาวันนี้ - ผลบอลล่าสุด',
      keywords: ['ข่าวกีฬา', 'ผลบอล'],
      status: 'safe',
      lastCrawled: '2024-01-16 09:15:00',
    },
    {
      id: '3',
      url: 'https://casino-online.net',
      title: 'คาสิโนออนไลน์ อันดับ 1 ในไทย',
      keywords: ['คาสิโน', 'บาคาร่า', 'พนันออนไลน์'],
      status: 'flagged',
      lastCrawled: '2024-01-16 08:45:00',
    },
    {
      id: '4',
      url: 'https://slot-machine.co',
      title: 'เกมสล็อตออนไลน์ แจ็คพอตใหญ่',
      keywords: ['สล็อต', 'เดิมพัน'],
      status: 'suspicious',
      lastCrawled: '2024-01-16 07:20:00',
    }
  ]);

  const toggleCrawler = () => {
    setIsRunning(!isRunning);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(keyword => keyword !== keywordToRemove));
  };

  const handleCreateCase = (website: CrawlResult) => {
    setSelectedWebsite(website);
    setShowCreateCaseModal(true);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/crawler/${id}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="w-4 h-4" />;
      case 'suspicious': return <AlertTriangle className="w-4 h-4" />;
      case 'flagged': return <AlertTriangle className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-400 bg-green-900';
      case 'suspicious': return 'text-orange-400 bg-orange-900';
      case 'flagged': return 'text-red-400 bg-red-900';
      default: return 'text-gray-400 bg-gray-800';
    }
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
              < HeaderWebCrawler />
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

                <div className="grid grid-cols-1 gap-6">
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

                  {/* Keywords Management */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium text-white">จัดการคำค้นหา</h3>
                      {keywords.length > 0 && (
                        <button
                          onClick={() => setKeywords([])}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-700/30 text-red-300 rounded-md 
                          hover:bg-red-700/50 hover:text-red-200 transition-all duration-200 border border-red-700/50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>ล้างคำค้นหา</span>
                        </button>
                      )}
                    </div>

                    {/* Add new keyword */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="เพิ่มคำค้นหาใหม่..."
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400"
                        onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                      />
                      <button
                        onClick={addKeyword}
                        className="px-3 py-2 bg-cyan-700 text-white rounded-md hover:bg-cyan-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Keywords list */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        คำค้นหาปัจจุบัน ({keywords.length})
                      </label>
                      <div className="max-h-32 overflow-y-auto">
                        <div className="flex flex-wrap gap-2">
                          {keywords.map((keyword, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-1 px-3 py-1 bg-slate-600 text-gray-300 rounded-full text-sm border border-slate-500"
                            >
                              <span>{keyword}</span>
                              <button
                                onClick={() => removeKeyword(keyword)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">ผลการตรวจสอบ</h2>
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ค้นหา URL..."
                      className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-md text-sm text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {results.map((result) => (
                    <div key={result.id} className="border border-slate-600 rounded-lg p-4 hover:shadow-lg transition-shadow bg-slate-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-white">{result.title}</h3>
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                              {getStatusIcon(result.status)}
                              <span>
                                {result.status === 'safe' ? 'ปกติ' :
                                  result.status === 'suspicious' ? 'น่าสงสัย' : 'ต้องสงสัย'}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-gray-300 mb-2">{result.url}</p>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {result.keywords.map((keyword, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-slate-600 text-gray-300 rounded text-xs border border-slate-500"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>

                          <p className="text-xs text-gray-400">
                            ตรวจสอบล่าสุด: {result.lastCrawled}
                          </p>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(result.id)}
                            className="px-3 py-1 bg-blue-700 text-blue-200 rounded text-sm hover:bg-blue-600 transition-colors"
                          >
                            ดูรายละเอียด
                          </button>
                          {(result.status === 'flagged' || result.status === 'suspicious') && (
                            <>
                              <button
                                onClick={() => handleCreateCase(result)}
                                className="flex items-center space-x-1 px-3 py-1 bg-purple-700 text-purple-200 rounded text-sm hover:bg-purple-600 transition-colors"
                              >
                                <FolderOpen className="w-3 h-3" />
                                <span>สร้างคดี</span>
                              </button>
                              <button className="px-3 py-1 bg-red-700 text-red-200 rounded text-sm hover:bg-red-600 transition-colors">
                                เพิ่มใน Watchlist
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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