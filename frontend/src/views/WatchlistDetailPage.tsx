import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import SideBar from "../components/SideBar";
import { AlertTriangle, ArrowLeft, Calendar, Clock, Eye } from "lucide-react";
import { useEffect, useState } from "react";

interface WatchlistItem {
    id: string;
    type: "account" | "website";
    name: string;
    details: string;
    status: "active" | "flagged" | "investigated";
    addedDate: string;
    lastActivity?: string;
}

function WatchlistDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState<WatchlistItem | null>(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("watchlist");
            if (stored) {
                const items: WatchlistItem[] = JSON.parse(stored);
                const found = items.find((i) => i.id === id);
                setItem(found || null);
            }
        } catch (e) {
            console.error("Failed to read from localStorage:", e);
        }
    }, [id]);

    const getStatusText = (status: string) => {
        switch (status) {
            case "active":
                return "กำลังเฝ้าระวัง";
            case "flagged":
                return "พบความเสี่ยง";
            case "investigated":
                return "สอบสวนแล้ว";
            default:
                return "ไม่ทราบ";
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "active":
                return {
                    color: "text-blue-100 bg-blue-600 border-blue-500",
                    icon: Eye,
                };
            case "flagged":
                return {
                    color: "text-orange-100 bg-orange-600 border-orange-500",
                    icon: AlertTriangle,
                };
            case "investigated":
                return {
                    color: "text-gray-100 bg-gray-600 border-gray-500",
                    icon: Eye,
                };
            default:
                return {
                    color: "text-gray-100 bg-gray-600 border-gray-500",
                    icon: Eye,
                };
        }
    };

    if (!item) {
        return (
            <div className="min-h-screen bg-slate-900">
                <Header />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <SideBar />
                        <div className="lg:col-span-3">
                            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
                                <div className="text-center">
                                    <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                                    <h2 className="text-2xl font-bold text-white mb-2">ไม่พบรายการที่เลือก</h2>
                                    <p className="text-gray-400 mb-6">รายการที่คุณกำลังมองหาอาจถูกลบหรือไม่มีอยู่</p>
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200"
                                    >
                                        <ArrowLeft className="w-5 h-5 mr-2" />
                                        ย้อนกลับ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(item.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="min-h-screen bg-slate-900">
            <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <SideBar />
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate(-1)}
                                className="group flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg transition-all duration-200"
                            >
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                                <span>กลับ</span>
                            </button>
                        </div>

                        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                            <div className="bg-slate-700 p-6 border-b border-slate-600">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-2xl font-bold text-white mb-2">รายละเอียดรายการเฝ้าระวัง</h1>
                                        <p className="text-gray-400">ข้อมูลรายการที่อยู่ในระบบเฝ้าระวัง</p>
                                    </div>
                                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg border ${statusConfig.color}`}>
                                        <StatusIcon className="w-5 h-5" />
                                        <span className="font-semibold">{getStatusText(item.status)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-700/50 rounded-lg p-4">
                                        <p className="text-sm text-gray-400 mb-2">ประเภท</p>
                                        <p className="text-lg font-medium text-white">
                                            {item.type === "account" ? "บัญชีธนาคาร" : "เว็บไซต์"}
                                        </p>
                                    </div>

                                    <div className="bg-slate-700/50 rounded-lg p-4">
                                        <p className="text-sm text-gray-400 mb-2">ชื่อ/URL</p>
                                        <p className="text-lg font-medium text-white break-all">{item.name}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-700/50 rounded-lg p-4">
                                    <p className="text-sm text-gray-400 mb-2">รายละเอียด</p>
                                    <p className="text-white">{item.details}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-700/50 rounded-lg p-4">
                                        <p className="text-sm text-gray-400 mb-2">เพิ่มเมื่อ</p>
                                        <p className="text-lg font-medium text-white">{item.addedDate}</p>
                                    </div>

                                    {item.lastActivity && (
                                        <div className="bg-slate-700/50 rounded-lg p-4">
                                            <p className="text-sm text-gray-400 mb-2">กิจกรรมล่าสุด</p>
                                            <p className="text-lg font-medium text-white">{item.lastActivity}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WatchlistDetailPage;
