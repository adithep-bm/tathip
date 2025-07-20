import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "../utils/axiosInstance";
import Header from "../components/Header";
import SideBar from "../components/SideBar";

interface Evidence {
  id: string;
  case_id: string;
  evidence_type: string;
  description: string;
  excel_url: string;
  created_at: string;
  collected_by: string;
  status: string;
}

function EvidenceDetailPage() {
  const { id } = useParams(); // case_id
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvidence = async () => {
      console.log(`Fetching evidence for case ID: ${id}`);
      try {
        setLoading(true);
        const response = await axios.get<Evidence[]>(`/evidences/${id}`);
        console.log("Response data:", response);
        // ตรวจสอบว่า response.data เป็น array หรือไม่
        const data = Array.isArray(response.data) ? response.data : [];
        setEvidenceList(data);
        console.log("Fetched evidence data:", data);

      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvidence();
    }
  }, [id]);

  const handleDownloadExcel = (excelUrl: string, evidenceId: string) => {
    // สร้าง link element สำหรับดาวน์โหลด
    const link = document.createElement('a');
    link.href = excelUrl;
    link.download = `evidence_${evidenceId}_ocr_results.xlsx`;
    link.target = '_blank';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-white">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-red-400">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <SideBar />
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Evidence for Case ID: {id}
                </h2>

                {Array.isArray(evidenceList) && evidenceList.length === 0 ? (
                  <div className="text-gray-400">No evidence found for this case.</div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(evidenceList) && evidenceList.map((evidence) => (
                      <div key={evidence.id} className="bg-slate-700 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                              {evidence.evidence_type}
                            </h3>
                            <p className="text-gray-300 mb-2">{evidence.description}</p>
                            <p className="text-sm text-gray-400">
                              Collected by: {evidence.collected_by}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${evidence.status === 'active'
                                ? 'bg-green-600 text-green-100'
                                : 'bg-gray-600 text-gray-100'
                                }`}>
                                {evidence.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              {new Date(evidence.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {evidence.excel_url && (
                          <div className="mt-3 pt-3 border-t border-slate-600">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-400">
                                OCR Results Available
                              </p>
                              <button
                                onClick={() => handleDownloadExcel(evidence.excel_url, evidence.id)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors duration-200 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Excel
                              </button>
                            </div>
                          </div>
                        )}
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

export default EvidenceDetailPage;