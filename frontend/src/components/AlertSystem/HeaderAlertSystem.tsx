import { AlertTriangle, Bell } from "lucide-react";

interface AlertProps {
  id: string;
  type: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  status: 'unread' | 'read' | 'resolved';
  source: string;
}

function HeaderAlertSystem({ alerts }: { alerts: AlertProps[] }) {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-8 h-8 text-orange-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Alert System</h1>
            <p className="text-gray-300 mt-1">ระบบแจ้งเตือนและประเมินความเสี่ยง</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-orange-400" />
          <span className="text-sm font-medium text-orange-400">
            {alerts.filter(a => a.status === 'unread').length} การแจ้งเตือนใหม่
          </span>
        </div>
      </div>
    </div>
  );
}

export default HeaderAlertSystem;