import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { File, Trash2, AlertCircle } from "lucide-react";
import axios from "../utils/axiosInstance";
import Header from "../components/Header";
import SideBar from "../components/SideBar";
import type { Case } from "../types/case";

function CaseDetailPage() {
  const { case_id } = useParams();
  const [caseDetail, setCaseDetail] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCaseDetail = async () => {
    try {
      setLoading(true);
      console.log('Fetching case detail for case_id:', case_id);
      const response = await axios.get(`/cases/${case_id}`);
      console.log('Fetched case detail:', response.data);
      setCaseDetail(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'ไม่สามารถดึงข้อมูลคดีได้');
      console.error('Error fetching case:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [case_id]);

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!window.confirm('คุณต้องการลบหลักฐานชิ้นนี้ใช่หรือไม่?')) return;

    try {
      await axios.delete(`/evidence/${evidenceId}`);
      // Update local state to remove the deleted evidence
      setCaseDetail(prev => prev ? {
        ...prev,
        evidences: prev.evidence?.filter(e => e.id !== evidenceId)
      } : null);
    } catch (err) {
      console.error('Error deleting evidence:', err);
      alert('ไม่สามารถลบหลักฐานได้');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !caseDetail) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-64 text-red-400">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p>{error || 'ไม่พบข้อมูลคดี'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <SideBar />
          <div className="lg:col-span-3 space-y-6">
            {/* Case Details */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
              <h1 className="text-2xl font-bold text-white mb-4">{caseDetail.title}</h1>
              <p className="text-gray-300 mb-6">{caseDetail.description}</p>

              {/* Case Metadata */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">ประเภทคดี</p>
                  <p className="text-white">{caseDetail.case_type}</p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">สถานะ</p>
                  <p className="text-white">{caseDetail.status}</p>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="border-t border-slate-700 pt-6">
                <h2 className="text-xl font-semibold text-white mb-4">หลักฐานในคดี</h2>
                <div className="space-y-4">
                  {caseDetail.evidence && caseDetail.evidence.length > 0 ? (
                    caseDetail.evidence.map((evidence) => (
                      <div
                        key={evidence.id}
                        className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <File className="w-6 h-6 text-blue-400" />
                          <div>
                            <p className="text-white font-medium">{evidence.file_name}</p>
                            <p className="text-sm text-gray-400">
                              อัพโหลดเมื่อ: {new Date(evidence.uploadedAt).toLocaleDateString('th-TH')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <a
                            href={evidence.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                          >
                            ดาวน์โหลด
                          </a>
                          <button
                            onClick={() => handleDeleteEvidence(evidence.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      ยังไม่มีหลักฐานในคดีนี้
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseDetailPage;