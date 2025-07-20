import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const { action, loading } = useAuth(); // <-- 3. Get actions from context
  const [error, setError] = useState('');
  const navigate = useNavigate(); // <-- 4. Initialize navigate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!credentials.username || !credentials.password) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    try {
      await action.login(credentials); // <-- 5. Call login action
      console.log('Login successful');
      navigate('/case');
    } catch (err: any) {
      setError(err.response?.data?.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full mt-6">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-32 h-32 text-blue-300"
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">TATHIP</h2>
          <p className="text-blue-200 text-lg">ระบบผู้ช่วยนักสืบไซเบอร์</p>
          <p className="text-blue-300 text-sm mt-2">
            สำหรับเจ้าหน้าที่ตำรวจที่ได้รับอนุญาตเท่านั้น
          </p>
        </div>

        <form
          className="bg-slate-800 rounded-lg shadow-xl p-8 space-y-6 border border-slate-700"
          onSubmit={handleSubmit}
        >
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              ชื่อผู้ใช้งาน
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                placeholder="กรอกชื่อผู้ใช้งาน"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              รหัสผ่าน
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                placeholder="กรอกรหัสผ่าน"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            เข้าสู่ระบบ
          </button>

          <div className="text-left">
            <p className="text-l text-white">Username: officer001</p>
            <p className="text-l text-white">Password: secure123</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;