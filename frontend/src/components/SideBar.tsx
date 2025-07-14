import { Eye, FileText, Globe, AlertTriangle, BarChart3, Search, FolderOpen, Archive, User } from 'lucide-react';
import { Link } from "react-router-dom";

function SideBar() {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-blue-500', to: '/dashboard' },
    { id: 'cases', label: 'Case Management', icon: FolderOpen, color: 'text-purple-500', to: '/case' },
    { id: 'slip', label: 'Slip Reader', icon: FileText, color: 'text-green-500', to: '/slip' },
    { id: 'illegal-images', label: 'Illegal Image Detection', icon: Archive, color: 'text-emerald-500', to: '/illegal-images' },
    { id: 'crawler', label: 'Web Crawler', icon: Globe, color: 'text-cyan-500', to: '/crawler' },
    { id: 'watchlist', label: 'Watchlist', icon: Eye, color: 'text-red-500', to: '/watchlist' },
    { id: 'alerts', label: 'Alert System', icon: AlertTriangle, color: 'text-orange-500', to: '/alerts' },
    { id: 'reports', label: 'Reports', icon: Search, color: 'text-gray-500', to: '/reports' },
    { id: 'usermanagement', label: 'User Management', icon: User, color: 'text-indigo-500', to: '/usermanagement' }
  ];

  return (
    <div className="lg:col-span-1">
      <nav className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">เมนูหลัก</h2>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Link to={item.to} className="w-full block">
                  <div
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-300 hover:bg-slate-700 hover:text-white`}
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export default SideBar;