import { useState, useEffect } from 'react';
import { Upload, Search, CheckCircle, AlertCircle, FolderOpen } from 'lucide-react';
import axios from "../utils/axiosInstance";
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import HeaderSlip from '../components/SlipReader/HeaderSlip';
import type { Case } from '../types/case';

interface SlipData {
  id: string;
  fileName: string;
  imageType: 'slip' | 'weapon' | 'drugs' | 'adult' | 'other';
  accountName?: string;
  accountNumber?: string;
  bank?: string;
  amount?: number;
  date: string;
  time: string;
  status: 'safe' | 'suspicious' | 'flagged';
  confidence: number;
  caseId?: string;
}

function SlipReaderPage() {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedCase, setSelectedCase] = useState('');
  const [results, setResults] = useState<SlipData[]>([]);
  const [cases, setCases] = useState([
    { case_id: '1', title: 'คดีตัวอย่าง 1' },
    { case_id: '2', title: 'คดีตัวอย่าง 2' },
    { case_id: '3', title: 'คดีตัวอย่าง 3' },
  ]);

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

    // Simulate OCR processing
    setTimeout(() => {
      const imageTypes = ['slip', 'weapon', 'drugs', 'adult', 'other'];
      const randomType = imageTypes[Math.floor(Math.random() * imageTypes.length)] as SlipData['imageType'];

      const newResult: SlipData = {
        id: Date.now().toString(),
        fileName: file.name,
        imageType: randomType,
        date: '2024-01-16',
        time: '16:45',
        status: randomType === 'slip' ? 'suspicious' : randomType === 'other' ? 'safe' : 'flagged',
        confidence: Math.floor(Math.random() * 20) + 80,
        caseId: selectedCase
      };

      // Add slip-specific data if it's a slip
      if (randomType === 'slip') {
        newResult.accountName = 'นายจารุวิทย์ ลาภใหญ่';
        newResult.accountNumber = '555-777-9999';
        newResult.bank = 'ธนาคารกสิกรไทย';
        newResult.amount = Math.floor(Math.random() * 500000) + 10000;
      }

      setResults(prev => [newResult, ...prev]);
      setProcessing(false);
    }, 2000);
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
                  <h3 className="text-lg font-medium text-white mb-2">อัปโหลดภาพเพื่อวิเคราะห์</h3>
                  <p className="text-gray-300 mb-4">
                    {selectedCase ? 'ลากไฟล์มาวางหรือคลิกเพื่อเลือกไฟล์' : 'กรุณาเลือกคดีก่อนอัปโหลดไฟล์'}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                    disabled={!selectedCase}
                  />
                  <label
                    htmlFor="file-upload"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SlipReaderPage;