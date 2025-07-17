import { useState, useEffect } from 'react';
import { Upload, FolderOpen, Search, CheckCircle, AlertCircle, FileText, ChevronRight, FileSearch, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from "../utils/axiosInstance";
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import HeaderSlip from '../components/SlipReader/HeaderSlip';
import type { Case, CaseType } from '../types/case';
import Modal from '../components/SlipReader/Modal';

interface Evidence {
  id: string;
  fileName: string;
  imageType: 'slip' | 'weapon' | 'drugs' | 'adult' | 'other';
  status: 'safe' | 'suspicious' | 'flagged';
  caseId?: string;
}

function SlipReaderPage() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedCase, setSelectedCase] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  // +++ NEW STATE for Modal +++
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCaseId, setModalCaseId] = useState<string | null>(null);
  const [modalEvidenceId, setModalEvidenceId] = useState<string | null>(null); // <<< ADDED: State to store the selected evidence ID

  const [results, setResults] = useState<Evidence[]>([
    {
      id: '1',
      fileName: 'slip_001.jpg',
      imageType: 'slip',
      status: 'suspicious',
      caseId: '123'
    }]);

  async function fetchCases() {
    try {
      const response = await axios.get<Case[]>('/cases');
      setCases(response.data);
    } catch (error) {
      // handle error if needed
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0] && selectedCase) {
      processFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0] && selectedCase) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!selectedCase) {
      alert('กรุณาเลือกคดีที่จะเพิ่มหลักฐาน');
      return;
    }

    setProcessing(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', selectedCase);

    axios.post('/evidences/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(async (response) => {
        // Assume response.data contains evidence info with id
        const evidenceId = response.data.id;
        // Call OCR backend for this evidence
        await axios.post(`/evidence/${evidenceId}/ocr`);
        // Optionally, fetch updated evidence list or update results
        setResults(prev => [
          ...prev,
          {
            id: evidenceId,
            fileName: file.name,
            imageType: response.data.imageType || 'other',
            status: response.data.status || 'safe',
            caseId: selectedCase
          }
        ]);
      })
      .catch(() => {
        alert('เกิดข้อผิดพลาดในการอัปโหลดหรือวิเคราะห์ไฟล์');
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  const getCaseTypeText = (type: CaseType) => {
    switch (type) {
      case 'cyber_crimes': return 'อาชญากรรมไซเบอร์';
      case 'financial_crimes': return 'อาชญากรรมทางการเงิน';
      case 'gambling': return 'การพนัน';
      case 'fraud': return 'การฉ้อโกง';
      default: return 'ไม่ระบุ';
    }
  };

  // +++ จุดสำคัญ: สร้างข้อมูลที่รวมแล้วก่อน Render +++
  const enrichedResults = results.map(result => {
    const associatedCase = cases.find(c => c.case_id.toString() === result.caseId);
    return {
      fileName: result.fileName,
      caseId: result.caseId,
      caseTitle: associatedCase?.title || 'ไม่พบคดี',
      caseType: associatedCase?.case_type,
      evidenceCount: associatedCase?.evidenceCount,
      id: result.id,
      imageType: result.imageType
    };
  });

  // +++ MODIFIED: This function now opens the modal +++
  const handleOpenActionModal = (caseId: string, evidenceId: string) => {
    if (caseId && evidenceId) {
      setModalCaseId(caseId);
      setModalEvidenceId(evidenceId); // Set the evidence ID
      setIsModalOpen(true);
    }
  };

  const handleNavigateToCase = () => {
    if (modalCaseId) {
      navigate(`/case/${modalCaseId}`);
      setIsModalOpen(false); // Close modal after navigation
    }
  };

  // +++ NEW: Function to navigate to Evidence page (assuming this route exists) +++
  const handleNavigateToEvidence = () => {
    if (modalEvidenceId) {
      // Navigate to the specific evidence page, e.g., /evidence/169...
      navigate(`/evidence/${modalEvidenceId}`);
      setIsModalOpen(false); // Close modal after navigation
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

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
              <HeaderSlip />
              {/* Case Selection */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <div className="flex items-center space-x-3 mb-4">
                  <FolderOpen className="w-6 h-6 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">เลือกคดีที่จะเพิ่มหลักฐาน</h3>
                </div>
                <select
                  value={selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-white"
                >
                  <option value="">-- เลือกคดี --</option>
                  {cases.map((caseItem) => (
                    <option key={caseItem.case_id} value={caseItem.case_id}>
                      {caseItem.case_id}: {caseItem.title}
                    </option>
                  ))}
                </select>
              </div>
              {/* Upload Area */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? 'border-green-500 bg-green-900/20' :
                    selectedCase ? 'border-slate-500 hover:border-green-400' : 'border-slate-600 opacity-50'
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">อัปโหลดไฟล์ ZIP</h3>
                  <p className="text-gray-300 mb-4">
                    ลากไฟล์ ZIP มาวางหรือคลิกเพื่อเลือกไฟล์ (รองรับเฉพาะไฟล์ .zip)

                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {selectedCase ? 'ลากไฟล์มาวางหรือคลิกเพื่อเลือกไฟล์' : 'กรุณาเลือกคดีก่อนอัปโหลดไฟล์'}
                  </p>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileInput}
                    className="hidden"
                    id="zip-upload"
                    disabled={!selectedCase}
                  />
                  <label
                    htmlFor="zip-upload"
                    className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer transition-colors ${selectedCase
                      ? 'bg-green-700 text-white hover:bg-green-600'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    เลือกไฟล์
                  </label>
                </div>
              </div>
              {/* Processing Status */}
              {processing && (
                <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                    <div>
                      <h3 className="font-medium text-white">กำลังวิเคราะห์ภาพ...</h3>
                      <p className="text-gray-300 text-sm">ระบบกำลังแยกประเภทและอ่านข้อมูลจากรูปภาพ</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Results List */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                {/* Head Result*/}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Logs</h2>
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ค้นหา..."
                      className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-md text-sm text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                {/* --- Results Table (แก้ไขใหม่ทั้งหมด) --- */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-slate-700">
                      <tr>
                        <th scope="col" className="px-6 py-3">ชื่อไฟล์หลักฐาน</th>
                        <th scope="col" className="px-6 py-3">ชื่อคดีที่เกี่ยวข้อง</th>
                        <th scope="col" className="px-6 py-3">ประเภทคดี</th>
                        <th scope="col" className="px-6 py-3">หลักฐานในคดี</th>
                        <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrichedResults.length > 0 ? (
                        enrichedResults.map((item, index) => (
                          <tr key={`${item.caseId}-${index}`} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-600/50">
                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                              {item.fileName}
                            </td>
                            <td className="px-6 py-4">
                              {item.caseTitle}
                            </td>
                            <td className="px-6 py-4">
                              {item.caseType ? getCaseTypeText(item.caseType) : '-'}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-block bg-blue-900 text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full">
                                {item.evidenceCount ?? 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {/* +++ MODIFIED: Button now opens the modal +++ */}
                              <button
                                onClick={() => handleOpenActionModal(item.caseId ?? '', item.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                disabled={!item.caseId || !item.id}
                              >
                                <span>ดูรายละเอียดเพิ่มเติม</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="bg-slate-800 border-b border-slate-700">
                          <td colSpan={5} className="text-center py-8 text-gray-400">
                            ยังไม่มีผลการวิเคราะห์
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* +++ NEW: Render the Modal here +++ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="เลือกการกระทำ"
      >
        <div className="space-y-4">
          <p className="text-gray-300">คุณต้องการดูรายละเอียดส่วนไหนสำหรับคดี ID: <span className="font-bold text-amber-400">{modalCaseId}</span></p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleNavigateToEvidence}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <FileSearch className="w-5 h-5 text-green-400" />
              <span>ดูรายละเอียดหลักฐานทั้งหมด</span>
            </button>
            <button
              onClick={handleNavigateToCase}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Landmark className="w-5 h-5 text-purple-400" />
              <span>ดูรายละเอียดภาพรวมคดี</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SlipReaderPage;