import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import axios from '../utils/axiosInstance';
import Header from '../components/Header';
import SideBar from '../components/SideBar';
import { User, Camera, Lock, Check, AlertCircle, Eye, EyeOff, Settings } from 'lucide-react';

const UserProfilePage = () => {
    const auth = useContext(AuthContext);
    if (!auth || !auth.userInfo) return <div className="text-white">ไม่พบข้อมูลผู้ใช้</div>;
    const user = auth.userInfo;

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [avatar, setAvatar] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const validatePassword = (password: string) => {
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasSymbol = /[^A-Za-z0-9]/.test(password);
        const isLongEnough = password.length >= 8;
        return hasUpper && hasLower && hasSymbol && isLongEnough;
    };

    const getPasswordStrength = (password: string) => {
        if (!password) return { strength: 0, text: '', color: '' };

        const checks = [
            /[A-Z]/.test(password),
            /[a-z]/.test(password),
            /[0-9]/.test(password),
            /[^A-Za-z0-9]/.test(password),
            password.length >= 8
        ];

        const strength = checks.filter(Boolean).length;

        if (strength <= 2) return { strength: 1, text: 'อ่อน', color: 'bg-red-500' };
        if (strength <= 3) return { strength: 2, text: 'ปานกลาง', color: 'bg-yellow-500' };
        if (strength <= 4) return { strength: 3, text: 'ดี', color: 'bg-blue-500' };
        return { strength: 4, text: 'แข็งแรง', color: 'bg-green-500' };
    };

    const handleChangePassword = async () => {
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (newPassword !== confirmPassword) {
            setError('รหัสผ่านใหม่ไม่ตรงกัน');
            setIsLoading(false);
            return;
        }

        if (!validatePassword(newPassword)) {
            setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัว มีตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ และอักขระพิเศษ');
            setIsLoading(false);
            return;
        }

        try {
            await axios.post('/auth/change-password', {
                currentPassword,
                newPassword,
            });
            setSuccess('เปลี่ยนรหัสผ่านสำเร็จ');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
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
        formData.append('avatar', avatar);
        try {
            await axios.post('/auth/upload-avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess('อัปโหลดรูปโปรไฟล์สำเร็จ');
        } catch (err: any) {
            setError('ไม่สามารถอัปโหลดรูปได้');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const passwordStrength = getPasswordStrength(newPassword);

    return (
        <div className="min-h-screen bg-slate-900">
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
                                    <h1 className="text-2xl font-bold text-white">User Profile</h1>
                                    <p className="text-gray-300 mt-1">จัดการข้อมูลส่วนตัวและความปลอดภัยของบัญชี</p>
                                </div>
                            </div>
                        </div>

                        {/* Alert Messages */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-2">
                                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                <p className="text-red-400">{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-start space-x-2">
                                <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <p className="text-emerald-400">{success}</p>
                            </div>
                        )}

                        {/* Main Content - Dynamic Layout */}
                        <div className={`grid gap-6 transition-all duration-300 ${showPasswordForm ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                            {/* Profile Information Card */}
                            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-colors">
                                <div className="flex items-center space-x-3 mb-4">
                                    <User className="w-5 h-5 text-slate-300" />
                                    <h2 className="text-lg font-semibold text-white">ข้อมูลส่วนตัว</h2>
                                </div>

                                {/* Avatar Section - Compact */}
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative group">
                                        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full overflow-hidden flex items-center justify-center text-white text-sm shadow-lg">
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-8 h-8 text-white/80" />
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="w-5 h-5 text-white" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center space-y-2 mt-3">
                                        <label className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md cursor-pointer transition-colors text-sm">
                                            <Camera className="w-4 h-4" />
                                            <span>เลือกรูปโปรไฟล์</span>
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
                                                className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-1.5 rounded-md shadow-md transition-all disabled:opacity-50 text-sm"
                                            >
                                                {isLoading ? (
                                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Check className="w-4 h-4" />
                                                )}
                                                <span>อัปโหลด</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className="space-y-3">
                                    <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600/50">
                                        <label className="block text-sm font-medium text-slate-400 mb-1">ชื่อผู้ใช้</label>
                                        <p className="text-white font-medium">{user.username}</p>
                                    </div>
                                    <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600/50">
                                        <label className="block text-sm font-medium text-slate-400 mb-1">ตำแหน่ง</label>
                                        <p className="text-white font-medium">{user.role || 'ไม่ระบุ'}</p>
                                    </div>
                                </div>

                                {/* Change Password Button */}
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-all text-sm"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>{showPasswordForm ? 'ยกเลิกการเปลี่ยนรหัสผ่าน' : 'เปลี่ยนรหัสผ่าน'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Password Change Form - Show only when button is clicked */}
                            {showPasswordForm && (
                                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-colors animate-in slide-in-from-right duration-300">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <Lock className="w-5 h-5 text-slate-300" />
                                        <h2 className="text-lg font-semibold text-white">เปลี่ยนรหัสผ่าน</h2>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Current Password */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">รหัสผ่านเดิม</label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords.current ? "text" : "password"}
                                                    placeholder="กรอกรหัสผ่านเดิม"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('current')}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                                >
                                                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* New Password */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">รหัสผ่านใหม่</label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords.new ? "text" : "password"}
                                                    placeholder="กรอกรหัสผ่านใหม่"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('new')}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                                >
                                                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>

                                            {/* Password Strength Indicator */}
                                            {newPassword && (
                                                <div className="mt-2">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                                style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-slate-400 min-w-[60px]">{passwordStrength.text}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Confirm Password */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">ยืนยันรหัสผ่านใหม่</label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords.confirm ? "text" : "password"}
                                                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => togglePasswordVisibility('confirm')}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                                >
                                                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Password Requirements */}
                                        <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4">
                                            <p className="text-sm text-slate-400 mb-3">รหัสผ่านต้องมี:</p>
                                            <div className="grid grid-cols-1 gap-2 text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-slate-500'}`} />
                                                    <span className={`${newPassword.length >= 8 ? 'text-green-400' : 'text-slate-400'}`}>
                                                        อย่างน้อย 8 ตัวอักษร
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-500'}`} />
                                                    <span className={`${/[A-Z]/.test(newPassword) ? 'text-green-400' : 'text-slate-400'}`}>
                                                        ตัวพิมพ์ใหญ่ (A-Z)
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-500'}`} />
                                                    <span className={`${/[a-z]/.test(newPassword) ? 'text-green-400' : 'text-slate-400'}`}>
                                                        ตัวพิมพ์เล็ก (a-z)
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${/[^A-Za-z0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-500'}`} />
                                                    <span className={`${/[^A-Za-z0-9]/.test(newPassword) ? 'text-green-400' : 'text-slate-400'}`}>
                                                        อักขระพิเศษ (!@#$%^&*)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleChangePassword}
                                            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2.5 rounded-lg font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                        >
                                            {isLoading ? (
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Lock className="w-4 h-4" />
                                            )}
                                            <span>บันทึกรหัสผ่าน</span>
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