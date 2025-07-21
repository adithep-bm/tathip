import { useState, useEffect } from "react";
import axios from "../utils/axiosInstance";
import { Calendar, Download } from "lucide-react";

import HeaderReports from "../components/Reports/HeaderReports";
import Header from "../components/Header";
import SideBar from "../components/SideBar";
import type { Case } from "../types/case";
import type { Report, ReportType } from "../types/report";
import type { Evidence } from "../types/evidence.ts";

function ReportsPage() {
  const [selectedDateFrom, setSelectedDateFrom] = useState('2024-01-01');
  const [selectedDateTo, setSelectedDateTo] = useState('2024-01-16');
  const [reportType, setReportType] = useState('summary');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock reports data (keeping existing reports array)
  const reports: Report[] = [
    {
      report_id: '1',
      case_id: '2024001',
      report_type: 'summary',
      case_title: 'เว็บไซต์พนันออนไลน์ suspicious-betting.com',
      evidence_id: 'EV001',
      date_from: '2024-01-01',
      date_to: '2024-01-16',
      report_content: 'สรุปกิจกรรมการตรวจสอบเว็บไซต์และภาพทั้งหมดในระบบ พบหลักฐานที่เชื่อมโยงกับการพนันออนไลน์ 15 รายการ',
      created_at: '2024-01-16 14:30:00'
    },
    {
      report_id: '2',
      case_id: '2024001',
      report_type: 'case_details',
      case_title: 'เว็บไซต์พนันออนไลน์ suspicious-betting.com',
      evidence_id: 'EV002',
      date_from: '2024-01-10',
      date_to: '2024-01-15',
      report_content: 'รายงานคดีเกี่ยวกับเว็บไซต์พนันออนไลน์ พบการทำธุรกรรมผิดปกติในบัญชีธนาคาร 8 บัญชี',
      created_at: '2024-01-15 09:15:00'
    },
    {
      report_id: '3',
      case_id: '2024002',
      report_type: 'summary',
      case_title: 'คดีหลอกลวงออนไลน์',
      evidence_id: 'EV003',
      date_from: '2024-01-05',
      date_to: '2024-01-14',
      report_content: 'รายการเว็บไซต์ที่ถูกตรวจพบว่ามีเนื้อหาผิดกฎหมาย พบเว็บไซต์ต้องสงสัย 23 เว็บไซต์',
      created_at: '2024-01-14 16:45:00'
    },
    {
      report_id: '4',
      case_id: '2024001',
      report_type: 'case_details',
      case_title: 'เว็บไซต์พนันออนไลน์ suspicious-betting.com',
      evidence_id: 'EV001',
      date_from: '2024-01-01',
      date_to: '2024-01-13',
      report_content: 'รายการบัญชีธนาคารที่มีการทำธุรกรรมผิดปกติเชื่อมโยงกับคดีพนันออนไลน์ วิเคราะห์การเงิน 150 รายการ',
      created_at: '2024-01-13 11:20:00'
    },
    {
      report_id: '5',
      case_id: '2024003',
      report_type: 'summary',
      case_title: 'คดีค้ายาเสพติดออนไลน์',
      evidence_id: 'EV005',
      date_from: '2024-01-08',
      date_to: '2024-01-12',
      report_content: 'รายละเอียดการโอนเงินที่พบจากการวิเคราะห์หลักฐาน พบการโอนเงินต้องสงสัย 45 รายการ',
      created_at: '2024-01-12 13:10:00'
    },
    {
      report_id: '6',
      case_id: '2024002',
      report_type: 'case_details',
      case_title: 'คดีหลอกลวงออนไลน์',
      evidence_id: 'EV003',
      date_from: '2024-01-01',
      date_to: '2024-01-11',
      report_content: 'สรุปคดีอาชญากรรมไซเบอร์ที่เกิดขึ้น วิเคราะห์พฤติกรรมผู้ต้องสงสัย 12 ราย',
      created_at: '2024-01-11 10:30:00'
    },
    {
      report_id: '7',
      case_id: '2024004',
      report_type: 'summary',
      case_title: 'คดีล่วงละเมิดทางเพศออนไลน์',
      evidence_id: 'EV007',
      date_from: '2024-01-05',
      date_to: '2024-01-10',
      report_content: 'ผลการตรวจสอบหลักฐานดิจิทัลจากอุปกรณ์ที่ยึดได้ วิเคราะห์ไฟล์มัลติมีเดีย 267 ไฟล์',
      created_at: '2024-01-10 08:45:00'
    },
    {
      report_id: '8',
      case_id: '2024001',
      report_type: 'case_details',
      case_title: 'เว็บไซต์พนันออนไลน์ suspicious-betting.com',
      evidence_id: 'EV001',
      date_from: '2024-01-01',
      date_to: '2024-01-09',
      report_content: 'สถิติการใช้งานระบบ TATHIP ในการวิเคราะห์คดี รวมการประมวลผล 1,245 รายการ',
      created_at: '2024-01-09 15:20:00'
    }
  ];

  // Fetch cases from API
  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Case[]>('/cases');
      setCases(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('ไม่สามารถโหลดข้อมูลคดีได้');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports from API
  const fetchReports = async () => {
    try {
      const response = await axios.get<Report[]>('/reports');
      // If API call succeeds, you can replace mock data:
      // setReports(response.data);
      console.log('Fetched reports:', response.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      // Use mock data as fallback
    }
  };

  // Fetch evidences with Excel URLs
  const fetchEvidences = async () => {
    try {
      const response = await axios.get<Evidence[]>('/evidences');
      setEvidences(response.data.filter(evidence => evidence.excel_url)); // เอาเฉพาะที่มี Excel URL
      console.log('Fetched evidences with Excel:', response.data);
    } catch (err) {
      console.error('Error fetching evidences:', err);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchCases();
    fetchReports();
    fetchEvidences(); // เพิ่มการ fetch evidences
  }, []);

  const getCaseStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-400';
      case 'investigating': return 'text-orange-400';
      case 'closed': return 'text-green-400';
      case 'suspended': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCaseStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'เปิดคดี';
      case 'investigating': return 'กำลังสืบสวน';
      case 'closed': return 'ปิดคดี';
      case 'suspended': return 'ระงับการสืบสวน';
      default: return 'ไม่ทราบ';
    }
  };

  // Helper functions for report type styling
  const getReportTypeColor = (type: ReportType) => {
    switch (type) {
      case 'summary': return 'bg-blue-600 text-blue-100';
      case 'case_details': return 'bg-purple-600 text-purple-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  const getReportTypeText = (type: ReportType) => {
    switch (type) {
      case 'summary': return 'รายงานสรุป';
      case 'case_details': return 'รายละเอียดคดี';
      default: return 'ไม่ระบุ';
    }
  };

  // Download report function
  const downloadReport = (reportId: string) => {
    const report = reports.find(r => r.report_id === reportId);
    if (report) {
      console.log(`Downloading report: ${report.case_title}`);
      alert(`กำลังดาวน์โหลดรายงาน: ${report.case_title}`);
    }
  };

  // Format date display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateReport = async () => {
    if (reportType === 'case' && !selectedCaseId) {
      alert('กรุณาเลือกรหัสคดีที่ต้องการสร้างรายงาน');
      return;
    }

    const selectedCase = cases.find(c => c.case_id === selectedCaseId);

    // หาหลักฐานที่เกี่ยวข้องกับคดีนี้และมี Excel URL
    const caseEvidences = evidences.filter(evidence =>
      evidence.case_id === selectedCaseId && evidence.excel_url
    );

    if (reportType === 'case_details' && caseEvidences.length === 0) {
      alert('ไม่พบไฟล์ Excel สำหรับคดีนี้ กรุณาประมวลผล OCR ก่อน');
      return;
    }

    try {
      // Call API to generate report with Excel URLs
      const response = await axios.post('/reports', {
        report_type: reportType,
        case_id: selectedCaseId || null,
        date_from: selectedDateFrom,
        date_to: selectedDateTo,
        case_title: selectedCase?.title,
        excel_urls: caseEvidences.map(evidence => ({
          evidence_id: evidence.evidence_id,
          excel_url: evidence.excel_url,
          filename: evidence.filename
        }))
      });

      console.log('Report generated successfully:', response.data);
      alert(`รายงานได้ถูกสร้างเรียบร้อยแล้ว\nใช้ข้อมูลจาก ${caseEvidences.length} ไฟล์ Excel`);

      // Refresh reports list
      await fetchReports();

    } catch (error) {
      console.error('Error generating report:', error);
      alert('เกิดข้อผิดพลาดในการสร้างรายงาน');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-white">กำลังโหลดข้อมูล...</div>
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
              <HeaderReports />
            </div>

            {/* Show error if exists */}
            {error && (
              <div className="bg-red-800 border border-red-600 rounded-lg p-4">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {/* Generate Report */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">สร้างรายงานใหม่</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ประเภทรายงาน</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  >
                    <option value="summary">สรุปกิจกรรม</option>
                    <option value="websites">เว็บไซต์ต้องสงสัย</option>
                    <option value="accounts">บัญชีต้องสงสัย</option>
                    <option value="transactions">การโอนเงิน</option>
                    <option value="case">รายงานคดี</option>
                  </select>
                </div>

                {/* Case Selection - Only show when report type is 'case' */}
                {reportType === 'case' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">เลือกรหัสคดี</label>
                    <select
                      value={selectedCaseId}
                      onChange={(e) => setSelectedCaseId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                    >
                      <option value="">-- เลือกคดี --</option>
                      {cases.map((caseItem) => (
                        <option key={caseItem.case_id} value={caseItem.case_id}>
                          {caseItem.case_id} - {caseItem.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">วันที่เริ่มต้น</label>
                  <input
                    type="date"
                    value={selectedDateFrom}
                    onChange={(e) => setSelectedDateFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    value={selectedDateTo}
                    onChange={(e) => setSelectedDateTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={generateReport}
                    className="w-full px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    สร้างรายงาน
                  </button>
                </div>
              </div>

              {/* Selected Case Info */}
              {reportType === 'case' && selectedCaseId && (
                <div className="mt-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">ข้อมูลคดีที่เลือก</h3>
                  {(() => {
                    const selectedCase = cases.find(c => c.case_id === selectedCaseId);
                    const caseEvidences = evidences.filter(evidence =>
                      evidence.case_id === selectedCaseId && evidence.excel_url
                    );

                    return selectedCase ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-white">{selectedCase.case_id}</p>
                            <p className="text-sm text-gray-300">{selectedCase.title}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCaseStatusColor(selectedCase.status)} bg-slate-600`}>
                            {getCaseStatusText(selectedCase.status)}
                          </div>
                        </div>

                        {/* แสดงไฟล์ Excel ที่มี */}
                        <div className="border-t border-slate-600 pt-3">
                          <p className="text-sm text-gray-400 mb-2">
                            ไฟล์ Excel ที่จะใช้ในรายงาน ({caseEvidences.length} ไฟล์):
                          </p>
                          {caseEvidences.length > 0 ? (
                            <div className="space-y-1">
                              {caseEvidences.map((evidence) => (
                                <div key={evidence.evidence_id} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-300">{evidence.filename}</span>
                                  <span className="text-green-400">มี Excel</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-orange-400">
                              ⚠️ ไม่พบไฟล์ Excel สำหรับคดีนี้ กรุณาประมวลผล OCR ก่อน
                            </p>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
            {/* Reports List */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">รายงานที่มีอยู่</h2>

              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.report_id} className="border border-slate-600 rounded-lg p-4 hover:shadow-lg transition-shadow bg-slate-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-white">{report.case_title}</h3>
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.report_type)}`}>
                            <span>{getReportTypeText(report.report_type)}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-300 mb-2">{report.report_content}</p>

                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>สร้างเมื่อ: {formatDate(report.created_at)}</span>
                          </div>
                          <span>คดี: {report.case_id}</span>
                          <span>หลักฐาน: {report.evidence_id}</span>
                          <span>ช่วงข้อมูล: {report.date_from} ถึง {report.date_to}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => downloadReport(report.report_id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-700 text-green-200 rounded text-sm hover:bg-green-600 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>ดาวน์โหลด</span>
                        </button>
                        <button className="px-3 py-1 bg-blue-700 text-blue-200 rounded text-sm hover:bg-blue-600 transition-colors">
                          ดูรายละเอียด
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;