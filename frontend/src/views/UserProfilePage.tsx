import React, { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import axios from "../utils/axiosInstance";
import Header from "../components/Header";
import SideBar from "../components/SideBar";
import {
  User,
  Camera,
  Lock,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";

// Custom CSS animations
const customStyles = `
    @keyframes slideInFromRight {
        0% {
            opacity: 0;
            transform: translateX(100%) scale(0.9);
        }
        50% {
            opacity: 0.7;
            transform: translateX(-10px) scale(1.02);
        }
        100% {
            opacity: 1;
            transform: translateX(0) scale(1);
        }
    }
    
    @keyframes pulseGlow {
        0%, 100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
        }
        50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
        }
    }
    
    @keyframes pulseSubtle {
        0%, 100% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.02);
            opacity: 0.95;
        }
    }
    
    .animate-slideInFromRight {
        animation: slideInFromRight 0.6s ease-out forwards;
    }
    
    .animate-pulse-glow {
        animation: pulseGlow 2s ease-in-out infinite;
    }
    
    .animate-pulse-subtle {
        animation: pulseSubtle 3s ease-in-out infinite;
    }
`;

const UserProfilePage = () => {
  const auth = useContext(AuthContext);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  if (!auth || !auth.userInfo)
    return <div className="text-white">ไม่พบข้อมูลผู้ใช้</div>;
  const user = auth.userInfo;

  const validatePassword = (password: string) => {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const isLongEnough = password.length >= 8;
    return hasUpper && hasLower && hasSymbol && isLongEnough;
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: "", color: "" };

    const checks = [
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
      password.length >= 8,
    ];

    const strength = checks.filter(Boolean).length;

    if (strength <= 2)
      return { strength: 1, text: "อ่อน", color: "bg-red-500" };
    if (strength <= 3)
      return { strength: 2, text: "ปานกลาง", color: "bg-yellow-500" };
    if (strength <= 4) return { strength: 3, text: "ดี", color: "bg-blue-500" };
    return { strength: 4, text: "แข็งแรง", color: "bg-green-500" };
  };

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่ไม่ตรงกัน");
      setIsLoading(false);
      return;
    }

    if (!validatePassword(newPassword)) {
      setError(
        "รหัสผ่านต้องมีอย่างน้อย 8 ตัว มีตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และอักขระพิเศษ"
      );
      setIsLoading(false);
      return;
    }

    try {
      await axios.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setSuccess("เปลี่ยนรหัสผ่านสำเร็จ");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      interface ErrorResponse {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
      const errorMessage =
        err && typeof err === "object" && "response" in err
          ? (err as ErrorResponse).response?.data?.message || "เกิดข้อผิดพลาด"
          : "เกิดข้อผิดพลาด";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatar) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append("avatar", avatar);
    try {
      await axios.post("/auth/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("อัปโหลดรูปโปรไฟล์สำเร็จ");
    } catch {
      setError("ไม่สามารถอัปโหลดรูปได้");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Custom CSS Styles */}
      <style>{customStyles}</style>

      {/* Header */}
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <SideBar />
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Page Title with Frame */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
              <div className="flex items-center space-x-3">
                <User className="w-8 h-8 text-purple-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    User Profile
                  </h1>
                  <p className="text-gray-300 mt-1">
                    จัดการข้อมูลส่วนตัวและความปลอดภัยของบัญชี
                  </p>
                </div>
              </div>
            </div>

            {/* Alert Messages with Enhanced Animation */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3 animate-slideInFromRight shadow-lg shadow-red-500/10 backdrop-blur-sm">
                <div className="p-1 bg-red-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-red-400 font-medium">{error}</p>
                </div>
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start space-x-3 animate-slideInFromRight shadow-lg shadow-emerald-500/10 backdrop-blur-sm">
                <div className="p-1 bg-emerald-500/20 rounded-lg">
                  <Check className="w-5 h-5 text-emerald-400 animate-bounce" />
                </div>
                <div className="flex-1">
                  <p className="text-emerald-400 font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* Main Content - Dynamic Layout */}
            <div
              className={`grid gap-8 transition-all duration-500 ease-out ${
                showPasswordForm ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {/* Profile Information Card */}
              <div
                className={`bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-purple-500/30 hover:shadow-lg transition-all duration-300 ease-out ${
                  showPasswordForm ? "" : "transform hover:scale-[1.01]"
                }`}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">
                    ข้อมูลส่วนตัว
                  </h2>
                </div>

                {/* Avatar Section - Enhanced */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative group">
                    <div className="w-28 h-28 bg-gradient-to-br from-purple-500 via-blue-500 to-purple-600 rounded-full overflow-hidden flex items-center justify-center text-white shadow-lg transition-all duration-300 ease-out group-hover:shadow-xl group-hover:scale-105 transform">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="avatar"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <User className="w-10 h-10 text-white/90 transition-transform duration-300 group-hover:scale-110" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                    {/* Decorative ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 scale-110 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                  </div>

                  <div className="flex flex-col items-center space-y-3 mt-4">
                    <label className="group relative inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-slate-200 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                      <Camera className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">เลือกรูปโปรไฟล์</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>

                    {avatar && (
                      <button
                        onClick={handleUploadAvatar}
                        disabled={isLoading}
                        className="group relative inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-2 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 transform hover:scale-105 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                        <div className="relative z-10 flex items-center space-x-2">
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>อัปโหลด</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* User Info - Enhanced */}
                <div className="space-y-4">
                  <div className="group bg-gradient-to-r from-slate-700/60 to-slate-600/40 p-4 rounded-xl border border-slate-600/50 hover:border-purple-500/30 transition-all duration-300 transform hover:scale-[1.01]">
                    <label className="block text-sm font-medium text-slate-400 mb-2 transition-colors duration-300 group-hover:text-purple-300">
                      ชื่อผู้ใช้
                    </label>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <p className="text-white font-semibold text-lg transition-colors duration-300 group-hover:text-purple-100">
                        {user.username}
                      </p>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-r from-slate-700/60 to-slate-600/40 p-4 rounded-xl border border-slate-600/50 hover:border-blue-500/30 transition-all duration-300 transform hover:scale-[1.01]">
                    <label className="block text-sm font-medium text-slate-400 mb-2 transition-colors duration-300 group-hover:text-blue-300">
                      ตำแหน่ง
                    </label>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-white font-semibold text-lg transition-colors duration-300 group-hover:text-blue-100">
                        {user.role || "ไม่ระบุ"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Change Password Button with Enhanced Animation */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => {
                      setShowPasswordForm(!showPasswordForm);
                      // Clear form when hiding
                      if (showPasswordForm) {
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setError("");
                        setSuccess("");
                      }
                    }}
                    className={`group relative inline-flex items-center space-x-3 bg-gradient-to-r transition-all duration-500 ease-out text-white px-6 py-3 rounded-xl font-medium shadow-lg transform hover:scale-105 active:scale-95 overflow-hidden ${
                      showPasswordForm
                        ? "from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 hover:shadow-red-500/25"
                        : "from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:shadow-blue-500/25"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                    <Settings
                      className={`w-5 h-5 transition-all duration-300 relative z-10 ${
                        showPasswordForm
                          ? "rotate-180 text-red-100"
                          : "rotate-0 text-blue-100"
                      }`}
                    />
                    <span className="relative z-10 transition-all duration-300">
                      {showPasswordForm
                        ? "ยกเลิกการเปลี่ยนรหัสผ่าน"
                        : "เปลี่ยนรหัสผ่าน"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Password Change Form - Enhanced Animation */}
              {showPasswordForm && (
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 ease-out transform animate-slideInFromRight">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg animate-pulse-glow">
                      <Lock className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">
                      เปลี่ยนรหัสผ่าน
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {/* Current Password */}
                    <div className="transform transition-all duration-300 hover:scale-[1.02]">
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        รหัสผ่านเดิม
                      </label>
                      <div className="relative group">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          placeholder="กรอกรหัสผ่านเดิม"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 ease-in-out group-hover:border-slate-500/70 transform focus:scale-[1.02]"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("current")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none"
                        >
                          {showPasswords.current ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="transform transition-all duration-300 hover:scale-[1.02]">
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        รหัสผ่านใหม่
                      </label>
                      <div className="relative group">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          placeholder="กรอกรหัสผ่านใหม่"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 ease-in-out group-hover:border-slate-500/70 transform focus:scale-[1.02]"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("new")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {newPassword && (
                        <div className="mt-3 animate-slideInFromRight">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 h-2 bg-slate-600/50 rounded-full overflow-hidden backdrop-blur-sm">
                              <div
                                className={`h-full ${passwordStrength.color} transition-all duration-700 ease-out transform origin-left`}
                                style={{
                                  width: `${
                                    (passwordStrength.strength / 4) * 100
                                  }%`,
                                  boxShadow: `0 0 10px ${
                                    passwordStrength.color.includes("green")
                                      ? "#10b981"
                                      : passwordStrength.color.includes("blue")
                                      ? "#3b82f6"
                                      : passwordStrength.color.includes(
                                          "yellow"
                                        )
                                      ? "#f59e0b"
                                      : "#ef4444"
                                  }40`,
                                }}
                              />
                            </div>
                            <span
                              className={`text-sm font-medium transition-all duration-300 ${
                                passwordStrength.strength === 4
                                  ? "text-green-400"
                                  : passwordStrength.strength === 3
                                  ? "text-blue-400"
                                  : passwordStrength.strength === 2
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {passwordStrength.text}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="transform transition-all duration-300 hover:scale-[1.02]">
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        ยืนยันรหัสผ่านใหม่
                      </label>
                      <div className="relative group">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 ease-in-out group-hover:border-slate-500/70 transform focus:scale-[1.02]"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("confirm")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {/* Password Match Indicator */}
                      {confirmPassword && (
                        <div className="mt-2 animate-slideInFromRight">
                          <div
                            className={`flex items-center space-x-2 text-sm ${
                              newPassword === confirmPassword
                                ? "text-green-400"
                                : "text-red-400"
                            } transition-colors duration-300`}
                          >
                            {newPassword === confirmPassword ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <AlertCircle className="w-4 h-4" />
                            )}
                            <span>
                              {newPassword === confirmPassword
                                ? "รหัสผ่านตรงกัน"
                                : "รหัสผ่านไม่ตรงกัน"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gradient-to-br from-slate-700/40 to-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-xl p-5 transform transition-all duration-300 hover:scale-[1.02] hover:border-slate-500/50">
                      <p className="text-sm text-slate-300 mb-4 font-medium">
                        รหัสผ่านต้องมี:
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        <div
                          className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-500 ${
                            newPassword.length >= 8
                              ? "bg-green-500/10 border border-green-500/20"
                              : "bg-slate-600/20 border border-slate-600/20"
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full transition-all duration-500 transform ${
                              newPassword.length >= 8
                                ? "bg-green-500 scale-110 shadow-lg shadow-green-500/30"
                                : "bg-slate-500 scale-100"
                            }`}
                          />
                          <span
                            className={`text-sm transition-all duration-300 ${
                              newPassword.length >= 8
                                ? "text-green-400 font-medium"
                                : "text-slate-400"
                            }`}
                          >
                            อย่างน้อย 8 ตัวอักษร
                          </span>
                          {newPassword.length >= 8 && (
                            <Check className="w-4 h-4 text-green-400 animate-bounce" />
                          )}
                        </div>

                        <div
                          className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-500 ${
                            /[A-Z]/.test(newPassword)
                              ? "bg-green-500/10 border border-green-500/20"
                              : "bg-slate-600/20 border border-slate-600/20"
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full transition-all duration-500 transform ${
                              /[A-Z]/.test(newPassword)
                                ? "bg-green-500 scale-110 shadow-lg shadow-green-500/30"
                                : "bg-slate-500 scale-100"
                            }`}
                          />
                          <span
                            className={`text-sm transition-all duration-300 ${
                              /[A-Z]/.test(newPassword)
                                ? "text-green-400 font-medium"
                                : "text-slate-400"
                            }`}
                          >
                            ตัวพิมพ์ใหญ่ (A-Z)
                          </span>
                          {/[A-Z]/.test(newPassword) && (
                            <Check className="w-4 h-4 text-green-400 animate-bounce" />
                          )}
                        </div>

                        <div
                          className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-500 ${
                            /[a-z]/.test(newPassword)
                              ? "bg-green-500/10 border border-green-500/20"
                              : "bg-slate-600/20 border border-slate-600/20"
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full transition-all duration-500 transform ${
                              /[a-z]/.test(newPassword)
                                ? "bg-green-500 scale-110 shadow-lg shadow-green-500/30"
                                : "bg-slate-500 scale-100"
                            }`}
                          />
                          <span
                            className={`text-sm transition-all duration-300 ${
                              /[a-z]/.test(newPassword)
                                ? "text-green-400 font-medium"
                                : "text-slate-400"
                            }`}
                          >
                            ตัวพิมพ์เล็ก (a-z)
                          </span>
                          {/[a-z]/.test(newPassword) && (
                            <Check className="w-4 h-4 text-green-400 animate-bounce" />
                          )}
                        </div>

                        <div
                          className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-500 ${
                            /[^A-Za-z0-9]/.test(newPassword)
                              ? "bg-green-500/10 border border-green-500/20"
                              : "bg-slate-600/20 border border-slate-600/20"
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full transition-all duration-500 transform ${
                              /[^A-Za-z0-9]/.test(newPassword)
                                ? "bg-green-500 scale-110 shadow-lg shadow-green-500/30"
                                : "bg-slate-500 scale-100"
                            }`}
                          />
                          <span
                            className={`text-sm transition-all duration-300 ${
                              /[^A-Za-z0-9]/.test(newPassword)
                                ? "text-green-400 font-medium"
                                : "text-slate-400"
                            }`}
                          >
                            อักขระพิเศษ (!@#$%^&*)
                          </span>
                          {/[^A-Za-z0-9]/.test(newPassword) && (
                            <Check className="w-4 h-4 text-green-400 animate-bounce" />
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={
                        isLoading ||
                        !currentPassword ||
                        !newPassword ||
                        !confirmPassword
                      }
                      className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 hover:shadow-xl hover:scale-[1.02] active:scale-95 transform overflow-hidden"
                    >
                      {/* Animated background overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>

                      {/* Loading spinner or lock icon */}
                      <div className="relative z-10 flex items-center space-x-2">
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Lock className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                        )}
                        <span className="transition-all duration-300">
                          {isLoading ? "กำลังบันทึก..." : "บันทึกรหัสผ่าน"}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
