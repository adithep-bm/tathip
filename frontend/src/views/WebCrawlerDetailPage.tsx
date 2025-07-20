import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Globe, AlertCircle, FolderPlus, ListPlus } from 'lucide-react';
import axios from '../utils/axiosInstance';
import Header from "../components/Header";
import SideBar from "../components/SideBar";
import HeaderWebCrawler from "../components/WebCrawler/HeaderWebCrawler";

interface CrawlerResult {
  id: string;
  url: string;
  title: string;
  description: string;
  keywords: string[];
  status: 'safe' | 'suspicious' | 'flagged';
  lastCrawled: string;
  screenshot: string;
}

function WebCrawlerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<CrawlerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCrawlerResult = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/crawler/${id}`);
        setResult(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'ไม่สามารถโหลดข้อมูลได้');
        console.error('Error fetching crawler result:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCrawlerResult();
    }
  }, [id]);

  const handleCreateCase = () => {
    // TODO: Implement create case functionality
    console.log('Creating case for:', result?.url);
  };

  const handleAddToWatchlist = () => {
    // TODO: Implement add to watchlist functionality
    console.log('Adding to watchlist:', result?.url);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <SideBar />
          <div className="lg:col-span-3 space-y-6">
            <HeaderWebCrawler />

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 text-red-400">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p>{error}</p>
              </div>
            ) : result && (
              <div className="space-y-6">
                {/* Website Information */}
                <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-6 h-6 text-blue-400" />
                      <h2 className="text-xl font-semibold text-white">{result.title}</h2>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCreateCase}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-600 transition-colors"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>สร้างคดี</span>
                      </button>

                      <button
                        onClick={handleAddToWatchlist}
                        className="flex items-center space-x-2 px-4 py-2 bg-cyan-700 text-white rounded-md hover:bg-cyan-600 transition-colors"
                      >
                        <ListPlus className="w-4 h-4" />
                        <span>เพิ่มในรายการเฝ้าระวัง</span>
                      </button>
                    </div>
                  </div>

                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm mb-4 block"
                  >
                    {result.url}
                  </a>

                  <p className="text-gray-300 mb-6">{result.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {result.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-slate-700 text-gray-300 rounded text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>

                  <div className="text-sm text-gray-400">
                    ตรวจสอบล่าสุด: {new Date(result.lastCrawled).toLocaleString('th-TH')}
                  </div>
                </div>

                {/* Screenshot Preview */}
                <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">ภาพหน้าเว็บไซต์</h3>
                  <div className="rounded-lg overflow-hidden border border-slate-600">
                    <img
                      src={result.screenshot}
                      alt={`Screenshot of ${result.title}`}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebCrawlerDetailPage;