import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import SideBar from "../components/SideBar";
import { Eye, Plus, Search, AlertTriangle, Globe, User, History, Trash2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WatchlistItem {
  id: string;
  type: "account" | "website";
  name: string;
  details: string;
  status: "active" | "flagged" | "investigated";
  addedDate: string;
  lastActivity?: string;
}

function WatchListPage() {
  const navigate = useNavigate();
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>(() => {
    try {
      const stored = localStorage.getItem("watchlist");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlistItems));
  }, [watchlistItems]);

  const [activeTab, setActiveTab] = useState<"accounts" | "websites">("accounts");
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: "account" as "account" | "website",
    name: "",
    details: "",
  });

  const handleAddItem = () => {
    if (!formData.name || !formData.details) return;

    const now = new Date();
    const newItem: WatchlistItem = {
      id: now.getTime().toString(),
      type: formData.type,
      name: formData.name,
      details: formData.details,
      status: "active",
      addedDate: now.toISOString().split("T")[0],
      lastActivity: now.toISOString().replace("T", " ").slice(0, 16),
    };

    setWatchlistItems((prev) => [newItem, ...prev]);
    setShowAddForm(false);
    setFormData({ type: "account", name: "", details: "" });
  };

  const handleDelete = (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteAction = () => {
    if (confirmDelete) {
      const updatedItems = watchlistItems.filter((item) => item.id !== confirmDelete);
      setWatchlistItems(updatedItems);
      localStorage.setItem("watchlist", JSON.stringify(updatedItems));
      setConfirmDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const filteredItems = watchlistItems.filter(
    (item) =>
      item.type === (activeTab === "accounts" ? "account" : "website") &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-blue-400 bg-blue-900/50 border-blue-700/50";
      case "flagged":
        return "text-red-400 bg-red-900/50 border-red-700/50";
      case "investigated":
        return "text-gray-400 bg-gray-800/50 border-gray-700/50";
      default:
        return "text-gray-400 bg-gray-800/50 border-gray-700/50";
    }
  };

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

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <SideBar />
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Eye className="w-8 h-8 text-red-400" />
                  <div>
                    <h1 className="text-2xl font-bold text-white">Watchlist</h1>
                    <p className="text-gray-300 mt-1">ระบบเฝ้าระวังบัญชีและเว็บไซต์ต้องสงสัย</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มรายการ</span>
                </button>
              </div>
            </div>

            {showAddForm && (
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-red-600">
                <h3 className="text-lg font-semibold text-white mb-4">เพิ่มรายการเฝ้าระวังใหม่</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">ประเภท</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as "account" | "website" })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                    >
                      <option value="account">บัญชีธนาคาร</option>
                      <option value="website">เว็บไซต์</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">ชื่อ/URL</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                      placeholder="ระบุชื่อหรือ URL"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">รายละเอียด</label>
                    <textarea
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                      rows={3}
                      placeholder="ระบุรายละเอียดเพิ่มเติม"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-300 bg-slate-700 rounded-md hover:bg-slate-600"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-600"
                  >
                    เพิ่มรายการ
                  </button>
                </div>
              </div>
            )}

            {/* ส่วนแสดงรายการ */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab("accounts")}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "accounts" ? "bg-red-700 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-slate-700"}`}
                  >
                    บัญชีธนาคาร
                  </button>
                  <button
                    onClick={() => setActiveTab("websites")}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "websites" ? "bg-red-700 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-slate-700"}`}
                  >
                    เว็บไซต์
                  </button>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหารายการ..."
                    className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <div key={item.id} className="group border border-slate-600 rounded-lg p-4 bg-slate-700 hover:bg-slate-600 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="p-2 bg-slate-600 rounded-lg">
                          {item.type === "account" ? (
                            <User className="w-5 h-5 text-gray-300" />
                          ) : (
                            <Globe className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="font-medium text-white">{item.name}</h3>
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                              {item.status === "flagged" && <AlertTriangle className="w-3 h-3" />}
                              <span>{getStatusText(item.status)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{item.details}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>เพิ่มเมื่อ: {item.addedDate}</span>
                            {item.lastActivity && <span>กิจกรรมล่าสุด: {item.lastActivity}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/watchlist/${item.id}`)}
                          className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800"
                        >
                          <History className="w-4 h-4" />
                          <span>ดูประวัติ</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal ยืนยันการลบ */}
            {confirmDelete && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-slate-600">
                  <div className="flex items-center space-x-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <h3 className="text-white text-lg font-semibold">ยืนยันการลบ</h3>
                  </div>
                  <p className="text-gray-300 mb-6">คุณแน่ใจว่าต้องการลบรายการนี้หรือไม่?</p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={cancelDelete}
                      className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={confirmDeleteAction}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      ยืนยันลบ
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default WatchListPage;