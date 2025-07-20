import { useState, useEffect } from 'react';
import axios from "../utils/axiosInstance"
import { FolderOpen, Plus, Search, Calendar, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';

import SideBar from '../components/SideBar';
import Header from '../components/Header';
import CreateCaseForm from '../components/CreateCaseForm';
import { EditCaseModal } from '../components/CaseManagement/EditCaseModal';
import type { Case, CasePriority } from '../types/case';
import { useNavigate } from 'react-router-dom';

function CaseManagementPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'investigating'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [cases, setCases] = useState<Case[]>([]);
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    case_type: 'cyber_crimes' as Case['case_type'],
    priority: 'medium' as Case['priority'],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const navigate = useNavigate(); // 

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('/cases');

      if (Array.isArray(response.data)) {
        setCases(response.data);
      } else {
        console.error("API response is not an array:", response.data);
        setError("Received invalid data format from the server.");
        setCases([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch cases');
      console.error('Error fetching cases:', err);
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createCase = async () => {
    if (!newCase.title || !newCase.description) return;

    const caseId = `CASE-2024-${String(cases.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const casePayload = {
      case_id: caseId,
      title: newCase.title,
      description: newCase.description,
      case_type: newCase.case_type,
      priority: newCase.priority,
      status: 'open', // Default status for new cases
      createdDate: today,
      lastUpdated: today,
      assignedOfficer: 'Unassigned', // Default value
      evidenceCount: 0 // Default value for new cases
    };

    try {
      console.log('Creating case with payload:', casePayload);
      const response = await axios.post('/cases', casePayload);
      const newCaseData = response.data;
      // Add the new case to the top of the list
      setCases(prevCases => [newCaseData, ...prevCases]);
      setNewCase({ title: '', description: '', case_type: 'cyber_crimes', priority: 'medium' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create case:', error);
      // You might want to show an error to the user here
    }
  };

  const handleEditClick = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsEditModalOpen(true);
  };

  const handleUpdateCase = async (updatedCase: Case) => {
    try {
      const response = await axios.put(`/cases/${updatedCase.case_id}`, updatedCase);
      if (response.status === 200) {
        setCases(cases.map(c =>
          c.case_id === updatedCase.case_id ? updatedCase : c
        ));
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to update case:', error);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // Filtering Logic
  const filteredCases = cases.filter(caseItem => {
    const matchesFilter = filter === 'all' || caseItem.status === filter;
    // FIX 3: Convert case_id to string before using .toLowerCase() to prevent runtime errors
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(caseItem.case_id).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Helper Functions
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cyber_crimes': return 'text-blue-400 bg-blue-900/50';
      case 'financial_crimes': return 'text-green-400 bg-green-900/50';
      case 'gambling': return 'text-red-400 bg-red-900/50';
      case 'fraud': return 'text-orange-400 bg-orange-900/50';
      default: return 'text-gray-400 bg-gray-800';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'cyber_crimes': return 'อาชญากรรมไซเบอร์';
      case 'financial_crimes': return 'อาชญากรรมทางการเงิน';
      case 'gambling': return 'การพนันออนไลน์';
      case 'fraud': return 'การหลอกลวง';
      default: return 'อื่นๆ';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-300 bg-red-800/80';
      case 'high': return 'text-orange-300 bg-orange-800/80';
      case 'medium': return 'text-yellow-300 bg-yellow-800/80';
      case 'low': return 'text-green-300 bg-green-800/80';
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

  // Grouping Logic
  // FIX 2: Add 'critical' to the priority order array
  const priorityOrder: CasePriority[] = ['critical', 'high', 'medium', 'low'];
  const priorityGroupTitles: Record<CasePriority, string> = {
    critical: 'ความสำคัญวิกฤต',
    high: 'ความสำคัญสูงสุด',
    medium: 'ความสำคัญปานกลาง',
    low: 'ความสำคัญต่ำ'
  };

  const groupedCases = filteredCases.reduce((acc, caseItem) => {
    const { priority } = caseItem;
    if (!acc[priority]) {
      acc[priority] = [];
    }
    acc[priority].push(caseItem);
    return acc;
  }, {} as Record<CasePriority, Case[]>);

  // FIX 2: Add 'critical' case to the border color function
  const getPriorityBorderColor = (priority: CasePriority): string => {
    switch (priority) {
      case 'critical': return 'border-purple-500';
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-green-500';
      default: return 'border-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <SideBar />
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Page Header */}
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex space-x-2">
                    {/* Filter Buttons */}
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-purple-700 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                    >
                      ทั้งหมด ({cases.length})
                    </button>
                    <button
                      onClick={() => setFilter('open')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filter === 'open' ? 'bg-purple-700 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                    >
                      เปิดคดี ({cases.filter(c => c.status === 'open').length})
                    </button>
                    <button
                      onClick={() => setFilter('investigating')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filter === 'investigating' ? 'bg-purple-700 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
                    >
                      กำลังสืบสวน ({cases.filter(c => c.status === 'investigating').length})
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ค้นหารหัส หรือชื่อคดี..."
                      className="pl-9 pr-3 py-1.5 w-full bg-slate-700 border border-slate-600 rounded-md text-sm text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500"
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
                  // FIX 1: RENDER THE GROUPED CASES
                  <div className="space-y-8">
                    {priorityOrder.map(priority => (
                      groupedCases[priority] && groupedCases[priority].length > 0 && (
                        <div key={priority}>
                          <h3 className="text-base font-semibold text-gray-300 mb-3 ml-1">
                            {priorityGroupTitles[priority]} ({groupedCases[priority].length})
                          </h3>
                          <div className="space-y-4">
                            {groupedCases[priority].map((caseItem) => (
                              <div key={caseItem.case_id} className={`bg-slate-700/50 border-l-4 rounded-r-lg p-4 hover:bg-slate-600/50 hover:shadow-lg transition-all ${getPriorityBorderColor(caseItem.priority)}`}>
                                {/* Case Item Content - a lot of divs, keeping it the same */}
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
                                      <h3 className="font-medium text-white">{caseItem.title}</h3>
                                      <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(caseItem.case_type)}`}>
                                        <span>{getCategoryText(caseItem.case_type)}</span>
                                      </div>
                                      <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(caseItem.priority)}`}>
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
                                        <div className="flex items-center space-x-1.5 text-white">
                                          {getStatusIcon(caseItem.status)}
                                          <span>{getStatusText(caseItem.status)}</span>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-gray-400">หลักฐาน</p>
                                        <div className="flex items-center space-x-1.5 text-white">
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
                                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 ml-4">
                                    <button
                                      onClick={() => navigate(`/case/${caseItem.case_id}`)}
                                      className="px-3 py-1 bg-blue-700 text-blue-200 rounded text-sm hover:bg-blue-600 transition-colors"
                                    >
                                      ดูรายละเอียด
                                    </button>
                                    <button
                                      onClick={() => handleEditClick(caseItem)}
                                      className="px-3 py-1 bg-yellow-600 text-green-200 rounded text-sm hover:bg-yellow-400 transition-colors"
                                    >
                                      แก้ไข
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                    {filteredCases.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <p>ไม่พบรายการคดีที่ตรงกับเงื่อนไข</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedCase && (
                <EditCaseModal
                  isOpen={isEditModalOpen}
                  onClose={() => setIsEditModalOpen(false)}
                  onSubmit={handleUpdateCase}
                  caseData={selectedCase}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseManagementPage;