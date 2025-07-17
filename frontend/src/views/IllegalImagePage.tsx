import { useState, useEffect } from 'react';
import { Archive, Filter, Upload } from "lucide-react";
import axios from "../utils/axiosInstance";
import Header from "../components/Header";
import SideBar from "../components/SideBar";

import type { Case } from '../types/case';

interface ClassifiedImage {
  id: string;
  fileName: string;
  imageType: 'transaction-slip' | 'weapon' | 'drug' | 'pornography' | 'other';
  status: 'safe' | 'suspicious' | 'flagged';
  confidence: number;
  date: string;
  time: string;
  caseId?: string;
  // Additional data for transaction slips
  accountName?: string;
  accountNumber?: string;
  bank?: string;
  amount?: number;
}

const getImageTypeText = (type: string) => {
  switch (type) {
    case 'transaction-slip': return 'สลิปโอนเงิน';
    case 'weapon': return 'อาวุธปืน';
    case 'drug': return 'ยาเสพติด';
    case 'pornography': return 'ภาพลามก';
    case 'other': return 'อื่นๆ';
    default: return 'ไม่ทราบ';
  }
};

function IllegalImagePage() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedCase, setSelectedCase] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'suspicious'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ClassifiedImage['imageType']>('all');
  const imageTypeOrder: ClassifiedImage['imageType'][] = ['transaction-slip', 'weapon', 'drug', 'pornography', 'other'];

  const [cases, setCases] = useState<Case[]>([]);

  async function fetchCases() {
    try {
      const response = await axios.get<Case[]>('/cases');
      setCases(response.data);
    } catch (error) {
      // handle error if needed
    }
  }

  const [results, setResults] = useState<ClassifiedImage[]>([
    {
      id: '1',
      fileName: 'IMG_001.jpg',
      imageType: 'transaction-slip',
      status: 'suspicious',
      confidence: 94,
      date: '2024-01-16',
      time: '14:30',
      accountName: 'นายสมชาย ใจดี',
      accountNumber: '123-456-7890',
      bank: 'ธนาคารกรุงไทย',
      amount: 50000,
      caseId: 'CASE-2024-002'
    }]);


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
    if (files && files[0]) {
      processZipFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processZipFile(files[0]);
    }
  };

  const processZipFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('กรุณาเลือกไฟล์ ZIP เท่านั้น');
      return;
    }

    setProcessing(true);

    // Simulate ZIP processing and image classification
    setTimeout(() => {
      const imageTypes: ClassifiedImage['imageType'][] = ['transaction-slip', 'weapon', 'drug', 'pornography', 'other'];
      const newResults: ClassifiedImage[] = [];

      // Simulate processing 10-20 images from ZIP
      const imageCount = Math.floor(Math.random() * 11) + 10;

      for (let i = 0; i < imageCount; i++) {
        const randomType = imageTypes[Math.floor(Math.random() * imageTypes.length)];
        const confidence = Math.floor(Math.random() * 20) + 80;

        let status: ClassifiedImage['status'] = 'safe';
        if (randomType === 'weapon' || randomType === 'drug' || randomType === 'pornography') {
          status = 'flagged';
        } else if (randomType === 'transaction-slip') {
          status = Math.random() > 0.5 ? 'suspicious' : 'safe';
        }

        const newResult: ClassifiedImage = {
          id: (Date.now() + i).toString(),
          fileName: `IMG_${String(i + 1).padStart(3, '0')}.jpg`,
          imageType: randomType,
          status,
          confidence,
          date: '2024-01-16',
          time: `${14 + Math.floor(i / 60)}:${String((30 + i) % 60).padStart(2, '0')}`
        };

        // Add slip-specific data if it's a transaction slip
        if (randomType === 'transaction-slip') {
          newResult.accountName = `นายสมชาย ใจดี${i}`;
          newResult.accountNumber = `${123 + i}-456-${7890 + i}`;
          newResult.bank = ['ธนาคารกรุงไทย', 'ธนาคารกสิกรไทย', 'ธนาคารไทยพาณิชย์'][i % 3];
          newResult.amount = Math.floor(Math.random() * 500000) + 10000;
        }

        newResults.push(newResult);
      }

      setResults(prev => [...newResults, ...prev]);
      setProcessing(false);

      // Show summary
      const flaggedCount = newResults.filter(r => r.status === 'flagged').length;
      const suspiciousCount = newResults.filter(r => r.status === 'suspicious').length;
      alert(`วิเคราะห์เสร็จสิ้น!\nรูปภาพทั้งหมด: ${newResults.length}\nต้องสงสัย: ${flaggedCount}\nน่าสงสัย: ${suspiciousCount}`);
    }, 3000);
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
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <div className="flex items-center space-x-3">
                  <Archive className="w-8 h-8 text-emerald-400" />
                  <div>
                    <h1 className="text-2xl font-bold text-white">Illegal Image Detection</h1>
                    <p className="text-gray-300 mt-1">ระบบตรวจจับภาพผิดกฎหมายจากไฟล์ ZIP อัตโนมัติ</p>
                  </div>
                </div>
              </div>
              {/* Upload Area */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? 'border-emerald-500 bg-emerald-900/20' : 'border-slate-500 hover:border-emerald-400'
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">อัปโหลดไฟล์ ZIP จากโทรศัพท์</h3>
                  <p className="text-gray-300 mb-4">
                    ลากไฟล์ ZIP มาวางหรือคลิกเพื่อเลือกไฟล์ (รองรับเฉพาะไฟล์ .zip)
                  </p>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileInput}
                    className="hidden"
                    id="zip-upload"
                  />
                  <label
                    htmlFor="zip-upload"
                    className="inline-flex items-center px-4 py-2 bg-emerald-700 text-white rounded-lg cursor-pointer hover:bg-emerald-600 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    เลือกไฟล์ ZIP
                  </label>
                </div>
              </div>

              {/* Processing Status */}
              {processing && (
                <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                    <div>
                      <h3 className="font-medium text-white">กำลังแยกและวิเคราะห์รูปภาพ...</h3>
                      <p className="text-gray-300 text-sm">ระบบกำลังแตกไฟล์ ZIP และตรวจจับภาพผิดกฎหมายแต่ละไฟล์</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Selection Controls */}
              {results.length > 0 && (
                <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">สถานะ:</span>
                    </div>
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filter === 'all'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                    >
                      ทั้งหมด ({results.length})
                    </button>
                    <button
                      onClick={() => setFilter('flagged')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filter === 'flagged'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                    >
                      ต้องสงสัย ({results.filter(r => r.status === 'flagged').length})
                    </button>
                    <button
                      onClick={() => setFilter('suspicious')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filter === 'suspicious'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                    >
                      น่าสงสัย ({results.filter(r => r.status === 'suspicious').length})
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-300">ประเภท:</span>
                    <button
                      onClick={() => setTypeFilter('all')}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${typeFilter === 'all'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                    >
                      ทั้งหมด
                    </button>
                    {imageTypeOrder.map(type => (
                      <button
                        key={type}
                        onClick={() => setTypeFilter(type)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${typeFilter === type
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                          }`}
                      >
                        {getImageTypeText(type)} ({results.filter(r => r.imageType === type).length})
                      </button>
                    ))}
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

export default IllegalImagePage;