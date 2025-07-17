import { useState } from "react";

import HeaderAlertSystem from "../components/AlertSystem/HeaderAlertSystem";
import Header from "../components/Header";
import SideBar from "../components/SideBar";
import type { Alert } from "../types/alert";

function AlertSystemPage() {

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'high',
      title: 'ตรวจพบการโอนเงินต้องสงสัย',
      message: 'พบการโอนเงินจำนวน 500,000 บาท ไปยังบัญชีที่อยู่ใน watchlist',
      timestamp: '2024-01-16 16:45:00',
      status: 'unread',
      source: 'OCR System'
    }
  ]);
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
              <HeaderAlertSystem alerts={alerts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlertSystemPage;