import { useState, useEffect } from 'react';
import axios from "../utils/axiosInstance"
import { FolderOpen, Plus, Search, Calendar, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';

import SideBar from '../components/SideBar';
import Header from '../components/Header';
import CreateCaseForm from '../components/CreateCaseForm';
import type { Case } from '../types/case';

function CaseManagementPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'investigating'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [cases, setCases] = useState<Case[]>([]);

  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    case_type: 'cybercrime' as Case['case_type'],
    priority: 'medium' as Case['priority']
  });

  // Add loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create fetch function
  const fetchCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('/cases');

      // SAFEGUARD: Check if the response data is an array
      if (Array.isArray(response.data)) {
        setCases(response.data);
      } else {
        // If not, log an error and set state to an empty array to prevent crashes
        console.error("API response is not an array:", response.data);
        setError("Received invalid data format from the server.");
        setCases([]); // Fallback to an empty array
      }

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch cases');
      console.error('Error fetching cases:', err);
      setCases([]); // Also set to empty on error
    } finally {
      setIsLoading(false);
    }
  };

  const createCase = () => {
    if (!newCase.title || !newCase.description) return;

    const caseId = `CASE-2024-${String(cases.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newCaseData: Case = {
      case_id: caseId,
      title: newCase.title,
      description: newCase.description,
      case_type: newCase.case_type,
      priority: newCase.priority,
      status: 'open',
      createdDate: today,
      lastUpdated: today,
      assignedOfficer: 'นายสมชาย สืบสวน',
      evidenceCount: 0 // จำนวนหลักฐานเริ่มต้นเป็น 0
    };

    setCases([newCaseData, ...cases]);
    setNewCase({ title: '', description: '', case_type: 'cybercrime', priority: 'medium' });
    setShowCreateForm(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cybercrime': return 'text-blue-400 bg-blue-900';
      case 'financial': return 'text-green-400 bg-green-900';
      case 'gambling': return 'text-red-400 bg-red-900';
      case 'fraud': return 'text-orange-400 bg-orange-900';
      default: return 'text-gray-400 bg-gray-800';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'cybercrime': return 'อาชญากรรมไซเบอร์';
      case 'financial': return 'อาชญากรรมทางการเงิน';
      case 'gambling': return 'การพนันออนไลน์';
      case 'fraud': return 'การหลอกลวง';
      default: return 'อื่นๆ';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-300 bg-red-900';
      case 'high': return 'text-orange-300 bg-orange-900';
      case 'medium': return 'text-yellow-300 bg-yellow-900';
      case 'low': return 'text-green-300 bg-green-900';
      default: return 'text-gray-300 bg-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'critical': return 'วิกฤต';
      case 'high': return 'สูง';
      case 'medium': return 'กลาง';
      case 'low': return 'ต่ำ';
      default: return 'ไม่ทราบ';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4" />;
      case 'investigating': return <Search className="w-4 h-4" />;
      case 'closed': return <CheckCircle className="w-4 h-4" />;
      case 'suspended': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'เปิดคดี';
      case 'investigating': return 'กำลังสืบสวน';
      case 'closed': return 'ปิดคดี';
      case 'suspended': return 'ระงับการสืบสวน';
      default: return 'ไม่ทราบ';
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesFilter = filter === 'all' || caseItem.status === filter;
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.case_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Use fetchCases in useEffect
  useEffect(() => {
    fetchCases();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          < SideBar />
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FolderOpen className="w-8 h-8 text-purple-400" />
                    <div>
                      <h1 className="text-2xl font-bold text-white">Case Management</h1>
                      <p className="text-gray-300 mt-1">ระบบจัดการคดีสืบสวน</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>สร้างคดีใหม่</span>
                  </button>
                </div>
              </div>

              {/* Create Case Form */}
              {showCreateForm && (
                <CreateCaseForm
                  newCase={newCase}
                  setNewCase={setNewCase}
                  createCase={createCase}
                  setShowCreateForm={setShowCreateForm}
                />
              )}
              {/* Filters and Search */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filter === 'all'
                        ? 'bg-purple-700 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                    >
                      ทั้งหมด ({cases.length})
                    </button>
                    <button
                      onClick={() => setFilter('open')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filter === 'open'
                        ? 'bg-purple-700 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                    >
                      เปิดคดี ({cases.filter(c => c.status === 'open').length})
                    </button>
                    <button
                      onClick={() => setFilter('investigating')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filter === 'investigating'
                        ? 'bg-purple-700 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                    >
                      กำลังสืบสวน ({cases.filter(c => c.status === 'investigating').length})
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ค้นหาคดี..."
                      className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-md text-sm text-white placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Cases List */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <h2 className="text-lg font-semibold text-white mb-4">รายการคดี</h2>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center space-y-4">
                      <p className="text-red-400 text-lg">{error}</p>
                      <button
                        onClick={fetchCases}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
                      >
                        ลองใหม่
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCases.map((caseItem) => (
                      <div key={caseItem.case_id} className="border border-slate-600 rounded-lg p-4 hover:shadow-lg transition-shadow bg-slate-700">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-medium text-white">{caseItem.title}</h3>
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(caseItem.case_type)}`}>
                                <span>{getCategoryText(caseItem.case_type)}</span>
                              </div>
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(caseItem.priority)}`}>
                                <span>{getPriorityText(caseItem.priority)}</span>
                              </div>
                            </div>

                            <p className="text-sm text-gray-300 mb-3">{caseItem.description}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400">รหัสคดี</p>
                                <p className="font-medium text-white">{caseItem.case_id}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">เจ้าหน้าที่</p>
                                <p className="font-medium text-white">{caseItem.assignedOfficer}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">สถานะ</p>
                                <div className="flex items-center space-x-1 text-white">
                                  {getStatusIcon(caseItem.status)}
                                  <span>{getStatusText(caseItem.status)}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-400">หลักฐาน</p>
                                <div className="flex items-center space-x-1 text-white">
                                  <FileText className="w-4 h-4" />
                                  <span>{caseItem.evidenceCount} รายการ</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center space-x-4 text-xs text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>สร้าง: {caseItem.createdDate}</span>
                              </div>
                              <span>อัปเดต: {caseItem.lastUpdated}</span>
                            </div>
                          </div>

                          <div className="flex space-x-2 ml-4">
                            <button className="px-3 py-1 bg-blue-700 text-blue-200 rounded text-sm hover:bg-blue-600 transition-colors">
                              ดูรายละเอียด
                            </button>
                            <button className="px-3 py-1 bg-green-700 text-green-200 rounded text-sm hover:bg-green-600 transition-colors">
                              แก้ไข
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

export default CaseManagementPage;