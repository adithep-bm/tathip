import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "../utils/axiosInstance";
import Header from "../components/Header";
import SideBar from "../components/SideBar";
import * as XLSX from 'xlsx';

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

// Type for a row in the Excel file
type ExcelRow = { [key: string]: any };

function EvidenceDetailPage() {
  const { id } = useParams(); // case_id
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Excel preview
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvidence = async () => {
      console.log(`Fetching evidence for case ID: ${id}`);
      try {
        setLoading(true);
        const response = await axios.get<Evidence[]>(`/evidences/${id}`);
        console.log("Response data:", response);
        const data = Array.isArray(response.data) ? response.data : [];
        console.log("Parsed evidence data:", data);
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

  const handlePreviewExcel = async (excelUrl: string, evidenceId: string) => {
    // If clicking the same preview button again, close it.
    if (previewingId === evidenceId) {
      setPreviewingId(null);
      setPreviewData([]);
      return;
    }

    setIsPreviewLoading(true);
    setPreviewError(null);
    setPreviewData([]);
    setPreviewingId(evidenceId);

    try {
      // Fetch the Excel file as an arraybuffer
      const response = await axios.get(excelUrl, {
        responseType: 'arraybuffer',
      });

      const data = new Uint8Array(response.data);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0]; // Read the first sheet
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

      setPreviewData(json);
    } catch (err) {
      setPreviewError("Failed to load or parse the Excel file for preview.");
      console.error(err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownloadExcel = async (excelUrl: string, evidenceId: string) => {
    try {
      let filename = '';

      // Try to extract filename from excelUrl
      const pathParts = excelUrl.replace(/\\/g, '/').split('/');
      filename = pathParts[pathParts.length - 1];

      // ตรวจสอบให้แน่ใจว่าได้ชื่อไฟล์มา
      if (!filename) {
        console.error('Could not extract filename from:', excelUrl);
        // อาจจะแสดงข้อความแจ้งเตือนผู้ใช้ที่นี่
        return;
      }
      console.log('Attempting to download:', filename, 'from case:', id);

      // If no filename found, create a generic one (without extension)
      if (!filename) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
        filename = `ocr_results_${id}_${timestamp}`;
      }

      console.log('Attempting to download:', filename, 'from case:', id);

      // Show loading state (optional)
      const originalText = document.querySelector(`[data-evidence-id="${evidenceId}"] .download-btn`)?.textContent;
      const downloadBtn = document.querySelector(`[data-evidence-id="${evidenceId}"] .download-btn`) as HTMLButtonElement;
      if (downloadBtn) {
        downloadBtn.textContent = 'Downloading...';
        downloadBtn.disabled = true;
      }

      try {
        // Send filename without .xlsx extension
        const response = await axios.get(`/ocr/download/${id}/${filename}`, {
          responseType: 'blob',
          timeout: 30000,
          headers: {
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        });

        // Check if we got a valid response
        if (response.data.size === 0) {
          throw new Error('Downloaded file is empty');
        }

        const blob = response.data;
        const downloadUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${filename}.xlsx`; // Add extension back for download
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(downloadUrl);

        console.log('Excel file downloaded successfully:', filename);

      } finally {
        // Reset button state
        if (downloadBtn && originalText) {
          downloadBtn.textContent = originalText;
          downloadBtn.disabled = false;
        }
      }

    } catch (error) {
      console.error('Error downloading Excel file:', error);
    }
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
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <SideBar />
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
                      <div key={evidence.id} className="bg-slate-700 rounded-lg p-4 transition-all duration-300">
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
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handlePreviewExcel(evidence.excel_url, evidence.id)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200 flex items-center gap-2"
                                >
                                  {previewingId === evidence.id ? 'Close Preview' : 'Preview'}
                                </button>
                                <button
                                  data-evidence-id={evidence.id}
                                  onClick={() => handleDownloadExcel(evidence.excel_url, evidence.id)}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors duration-200 flex items-center gap-2 download-btn"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Download Excel
                                </button>
                              </div>
                            </div>

                            {/* Excel Preview Section */}
                            {previewingId === evidence.id && (
                              <div className="mt-4 p-4 bg-slate-800 rounded-lg overflow-x-auto">
                                {isPreviewLoading && <div className="text-white">Loading preview...</div>}
                                {previewError && <div className="text-red-400">{previewError}</div>}
                                {!isPreviewLoading && !previewError && previewData.length > 0 && (
                                  <table className="min-w-full text-sm text-left text-gray-300">
                                    <thead className="text-xs text-gray-100 uppercase bg-slate-600">
                                      <tr>
                                        {Object.keys(previewData[0]).map((key) => (
                                          <th key={key} scope="col" className="px-6 py-3">{key}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {previewData.map((row, index) => (
                                        <tr key={index} className="bg-slate-700 border-b border-slate-600 hover:bg-slate-500">
                                          {Object.values(row).map((value, i) => (
                                            <td key={i} className="px-6 py-4">{String(value)}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                                {!isPreviewLoading && !previewError && previewData.length === 0 && (
                                  <div className="text-gray-400">No data found in the Excel file or file is empty.</div>
                                )}
                              </div>
                            )}
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