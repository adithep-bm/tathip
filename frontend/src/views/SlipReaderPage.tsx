import { useState, useEffect } from 'react';
import { Upload, Search, CheckCircle, AlertCircle, FolderOpen } from 'lucide-react';
import axios from "../utils/axiosInstance";
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import HeaderSlip from '../components/SlipReader/HeaderSlip';
import type { Case } from '../types/case';

function SlipReaderPage() {
  const [selectedCase, setSelectedCase] = useState('');
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SlipReaderPage;