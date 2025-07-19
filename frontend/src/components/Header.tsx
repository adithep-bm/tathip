import { useAuth } from "../contexts/AuthContext";

function Header() {
  const { userInfo } = useAuth();
  return (
    <header className="bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-xl border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 text-blue-300" />
            <div>
              <h1 className="text-xl font-bold text-white">TATHIP</h1>
              <p className="text-sm text-blue-200">ระบบผู้ช่วยนักสืบไซเบอร์</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{userInfo?.username}</p>
              <p className="text-xs text-blue-200">{userInfo?.role}</p>
            </div>
            <button
              className="bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded-md text-sm font-medium transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;