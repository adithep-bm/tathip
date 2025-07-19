import { useState, useEffect } from "react";
import SideBar from "../components/SideBar";
import Header from "../components/Header";
import {
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  X,
  Loader2,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
} from "lucide-react";
import HeaderWebCrawler from "../components/WebCrawler/HeaderWebCrawler";
import axiosInstance from "../utils/axiosInstance";

// Interface สำหรับ API response จาก backend
interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

// Interface สำหรับแสดงผลใน UI
interface CrawlResult {
  id: string;
  url: string;
  title: string;
  snippet: string;
  keywords: string[];
  lastCrawled: string;
}

// Interface สำหรับ Search Session (Folder)
interface SearchSession {
  id: string;
  query: string;
  timestamp: string;
  results: CrawlResult[];
  isExpanded: boolean;
}

function WebCrawlerPage() {
  // ฟังก์ชันสำหรับโหลดข้อมูลจาก localStorage
  const loadFromStorage = () => {
    const savedSessions = localStorage.getItem("crawlerSessions");
    const savedKeywords = localStorage.getItem("crawlerKeywords");

    return {
      sessions: savedSessions ? JSON.parse(savedSessions) : [],
      keywords: savedKeywords ? JSON.parse(savedKeywords) : [],
    };
  };

  // ฟังก์ชันสำหรับบันทึกข้อมูลลง localStorage
  const saveToStorage = (sessions: SearchSession[], keywords: string[]) => {
    localStorage.setItem("crawlerSessions", JSON.stringify(sessions));
    localStorage.setItem("crawlerKeywords", JSON.stringify(keywords));
  };

  const storageData = loadFromStorage();

  const [isRunning, setIsRunning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [keywords, setKeywords] = useState<string[]>(storageData.keywords);
  const [newKeyword, setNewKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [searchSessions, setSearchSessions] = useState<SearchSession[]>(
    storageData.sessions
  );

  // State สำหรับ context menu
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    url: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    url: "",
  });

  // State สำหรับ preview modal
  const [previewModal, setPreviewModal] = useState<{
    visible: boolean;
    url: string;
    title: string;
  }>({
    visible: false,
    url: "",
    title: "",
  });

  // บันทึกข้อมูลลง localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    saveToStorage(searchSessions, keywords);
  }, [searchSessions, keywords]);

  // ปิด context menu เมื่อคลิกที่อื่น
  useEffect(() => {
    const handleClick = () =>
      setContextMenu({ visible: false, x: 0, y: 0, url: "" });
    const handleScroll = () =>
      setContextMenu({ visible: false, x: 0, y: 0, url: "" });

    if (contextMenu.visible) {
      document.addEventListener("click", handleClick);
      document.addEventListener("scroll", handleScroll);
      return () => {
        document.removeEventListener("click", handleClick);
        document.removeEventListener("scroll", handleScroll);
      };
    }
  }, [contextMenu.visible]);

  // ฟังก์ชันทดสอบการเชื่อมต่อ API
  const testConnection = async () => {
    try {
      console.log("🔍 Testing API connection...");
      const response = await axiosInstance.get("/crawler/test");
      console.log("✅ API Connection successful:", response.data);
      alert(
        "เชื่อมต่อ API สำเร็จ! ✅\n" + JSON.stringify(response.data, null, 2)
      );
    } catch (error) {
      console.error("❌ API Connection failed:", error);
      alert(
        "ไม่สามารถเชื่อมต่อ API ได้ โปรดตรวจสอบว่า backend ทำงานที่ http://10.119.65.140:8000"
      );
    }
  };

  // ฟังก์ชันแสดง context menu สำหรับลิงค์
  const handleLinkContextMenu = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      url: url,
    });
  };

  // ฟังก์ชันคัดลอกลิงค์
  const copyLink = () => {
    navigator.clipboard
      .writeText(contextMenu.url)
      .then(() => {
        alert("คัดลอกลิงค์แล้ว!");
      })
      .catch(() => {
        // Fallback สำหรับ browser ที่ไม่รองรับ clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = contextMenu.url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("คัดลอกลิงค์แล้ว!");
      });
    setContextMenu({ visible: false, x: 0, y: 0, url: "" });
  };

  // ฟังก์ชันเปิดลิงค์ในแท็บใหม่
  const openInNewTab = () => {
    window.open(contextMenu.url, "_blank", "noopener,noreferrer");
    setContextMenu({ visible: false, x: 0, y: 0, url: "" });
  };

  // ฟังก์ชันเปิด/ปิด preview modal
  const openPreview = (url: string, title: string) => {
    setPreviewModal({
      visible: true,
      url: url,
      title: title,
    });
  };

  const closePreview = () => {
    setPreviewModal({
      visible: false,
      url: "",
      title: "",
    });
  };

  // ฟังก์ชันสร้างชื่อ query ที่ไม่ซ้ำกัน
  const createUniqueQuery = (
    query: string,
    existingSessions: SearchSession[]
  ): string => {
    const existingQueries = existingSessions.map((session) => session.query);

    if (!existingQueries.includes(query)) {
      return query;
    }

    // ถ้าชื่อซ้ำ ให้เพิ่มวันที่ต่อท้าย
    const today = new Date();
    const dateString = today
      .toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, ""); // แปลง 19/07/2568 เป็น 19072568

    let uniqueQuery = `${query} (${dateString})`;
    let counter = 1;

    // ถ้าแม้แต่ชื่อที่มีวันที่ยังซ้ำ ให้เพิ่มตัวเลขต่อท้าย
    while (existingQueries.includes(uniqueQuery)) {
      uniqueQuery = `${query} (${dateString}-${counter})`;
      counter++;
    }

    return uniqueQuery;
  };

  // ฟังก์ชันเรียก Crawler API
  const searchWithCrawler = async (query: string) => {
    setIsSearching(true);
    try {
      console.log("🔍 Searching for:", query);

      // เรียก API โดยไม่ใส่ /v1 เพิ่มเพราะ config มีอยู่แล้ว
      const response = await axiosInstance.get(
        `/crawler/search?query=${encodeURIComponent(query)}`
      );

      console.log("✅ API Response:", response.data);
      const searchResults: SearchResult[] = response.data;

      // ตรวจสอบว่ามีข้อมูลหรือไม่
      if (!searchResults || searchResults.length === 0) {
        alert("ไม่พบผลลัพธ์สำหรับคำค้นหา: " + query);
        return;
      }

      // แปลง API response เป็น format สำหรับ UI
      const newResults: CrawlResult[] = searchResults.map((result, index) => ({
        id: `${Date.now()}-${index}`,
        url: result.link,
        title: result.title,
        snippet: result.snippet,
        keywords: extractKeywords(result.title + " " + result.snippet),
        lastCrawled: new Date().toLocaleString("th-TH"),
      }));

      // สร้างชื่อ query ที่ไม่ซ้ำกัน
      const uniqueQuery = createUniqueQuery(query, searchSessions);

      // สร้าง Search Session ใหม่
      const newSession: SearchSession = {
        id: `session-${Date.now()}`,
        query: uniqueQuery,
        timestamp: new Date().toLocaleString("th-TH"),
        results: newResults,
        isExpanded: false,
      };

      // เพิ่ม Session ใหม่เข้าไปในรายการ (ไม่แทนที่)
      setSearchSessions((prevSessions) => [newSession, ...prevSessions]);

      console.log("✅ Created new session with", newResults.length, "results");
    } catch (error: unknown) {
      console.error("❌ Error calling crawler API:", error);

      // แสดง error message ที่ละเอียดขึ้น
      let errorMessage = "เกิดข้อผิดพลาดในการเรียก API";

      if (error && typeof error === "object" && "response" in error) {
        interface AxiosError {
          response?: {
            status: number;
            data?: { detail?: string };
            statusText: string;
          };
        }
        const axiosError = error as AxiosError;
        // API ตอบกลับแต่มี status code ผิด
        errorMessage = `API Error (${axiosError.response?.status}): ${
          axiosError.response?.data?.detail || axiosError.response?.statusText
        }`;
      } else if (error && typeof error === "object" && "request" in error) {
        // ไม่ได้รับ response จาก server
        errorMessage =
          "ไม่สามารถเชื่อมต่อกับ server ได้ โปรดตรวจสอบว่า backend ทำงานอยู่หรือไม่";
      } else if (error instanceof Error) {
        // Error อื่นๆ
        errorMessage = `Network Error: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  // ฟังก์ชันแยกคำสำคัญจากข้อความ
  const extractKeywords = (text: string): string[] => {
    const commonTerms = [
      "เว็บไซต์",
      "ข้อมูล",
      "ข่าว",
      "บทความ",
      "บริการ",
      "ผลิตภัณฑ์",
    ];
    const foundKeywords = commonTerms.filter((term) =>
      text.toLowerCase().includes(term.toLowerCase())
    );
    return foundKeywords.length > 0 ? foundKeywords : ["ต้องสงสัย"];
  };

  // ฟังก์ชันเริ่ม/หยุด crawler
  const toggleCrawler = async () => {
    if (!isRunning && keywords.length === 0) {
      alert("กรุณาเพิ่มคำค้นหาก่อนเริ่มการทำงาน");
      return;
    }

    if (!isRunning) {
      setIsRunning(true);
      // ค้นหาแต่ละคำสำคัญแยกกัน
      for (const keyword of keywords) {
        try {
          await searchWithCrawler(keyword);
          // หน่วงเวลาระหว่างการค้นหาแต่ละ keyword เพื่อไม่ให้ทำงานพร้อมกัน
          if (keywords.indexOf(keyword) < keywords.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // รอ 2 วินาที
          }
        } catch (error) {
          console.error(`Error searching for keyword "${keyword}":`, error);
          // ถึงแม้จะ error ก็ยังทำงานต่อกับ keyword ถัดไป
        }
      }
      setIsRunning(false);
      alert(`เสร็จสิ้นการค้นหา ${keywords.length} คำสำคัญแล้ว`);
    } else {
      setIsRunning(false);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      // แยกคำที่มีเว้นวรรคออกเป็น keyword แยกๆ
      const wordsToAdd = newKeyword
        .trim()
        .split(/\s+/) // แยกด้วยเว้นวรรค (รองรับหลายช่องว่างติดกัน)
        .filter((word) => word.length > 0) // กรองคำว่างออก
        .filter((word) => !keywords.includes(word)); // กรองคำที่มีอยู่แล้วออก

      if (wordsToAdd.length > 0) {
        setKeywords([...keywords, ...wordsToAdd]);
        setNewKeyword("");
      }
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((keyword) => keyword !== keywordToRemove));
  };

  // ฟังก์ชันค้นหาแบบ manual
  const handleManualSearch = async () => {
    if (!searchQuery.trim()) {
      alert("กรุณาใส่คำค้นหา");
      return;
    }
    await searchWithCrawler(searchQuery.trim());
    setSearchQuery("");
  };

  // ฟังก์ชันล้างผลลัพธ์
  const clearResults = () => {
    if (window.confirm("คุณต้องการล้างผลลัพธ์ทั้งหมดหรือไม่?")) {
      setSearchSessions([]);
      localStorage.removeItem("crawlerSessions");
    }
  };

  // ฟังก์ชันเปิด/ปิด Session
  const toggleSession = (sessionId: string) => {
    setSearchSessions(
      searchSessions.map((session) =>
        session.id === sessionId
          ? { ...session, isExpanded: !session.isExpanded }
          : session
      )
    );
  };

  // ฟังก์ชันลบ Session
  const deleteSession = (sessionId: string) => {
    if (window.confirm("คุณต้องการลบการค้นหานี้หรือไม่?")) {
      setSearchSessions(
        searchSessions.filter((session) => session.id !== sessionId)
      );
    }
  };

  const handleViewDetails = (url: string, title: string) => {
    openPreview(url, title);
  };

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
              {/* Header */}
              <HeaderWebCrawler />
              {/* Control Panel */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    ควบคุมระบบ
                  </h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={testConnection}
                      className="px-3 py-1 bg-blue-700 text-blue-200 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      ทดสอบ API
                    </button>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isRunning ? "bg-green-400" : "bg-gray-500"
                        }`}
                      ></div>
                      <span className="text-sm text-gray-300">
                        {isRunning
                          ? "กำลังทำงาน"
                          : isSearching
                          ? "กำลังค้นหา"
                          : "หยุดทำงาน"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Manual Search */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-white">
                      ค้นหาด่วน
                    </h3>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ใส่คำค้นหาเพื่อค้นหาทันที..."
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400"
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          !isSearching &&
                          handleManualSearch()
                        }
                        disabled={isSearching}
                      />
                      <button
                        onClick={handleManualSearch}
                        disabled={isSearching}
                        className="px-4 py-2 bg-cyan-700 text-white rounded-md hover:bg-cyan-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {isSearching ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>ค้นหา...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            <span>ค้นหา</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Crawler Control */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-white">
                      การทำงานอัตโนมัติ
                    </h3>
                    <button
                      onClick={toggleCrawler}
                      disabled={isSearching}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isRunning
                          ? "bg-red-700 hover:bg-red-600 text-white"
                          : "bg-green-700 hover:bg-green-600 text-white"
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <PauseCircle className="w-4 h-4" />
                          <span>หยุดการทำงาน</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          <span>เริ่มการทำงาน</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Keywords Management */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-md font-medium text-white">
                        จัดการคำค้นหา
                      </h3>
                      {keywords.length > 0 && (
                        <button
                          onClick={() => setKeywords([])}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-700/30 text-red-300 rounded-md 
                          hover:bg-red-700/50 hover:text-red-200 transition-all duration-200 border border-red-700/50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>ล้างคำค้นหา</span>
                        </button>
                      )}
                    </div>

                    {/* Add new keyword */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="เพิ่มคำค้นหาใหม่... (ใส่หลายคำแยกด้วยเว้นวรรค)"
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400"
                        onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                      />
                      <button
                        onClick={addKeyword}
                        className="px-3 py-2 bg-cyan-700 text-white rounded-md hover:bg-cyan-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Keywords list */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        คำค้นหาปัจจุบัน ({keywords.length})
                      </label>
                      <div className="max-h-32 overflow-y-auto">
                        <div className="flex flex-wrap gap-2">
                          {keywords.map((keyword, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-1 px-3 py-1 bg-slate-600 text-gray-300 rounded-full text-sm border border-slate-500"
                            >
                              <span>{keyword}</span>
                              <button
                                onClick={() => removeKeyword(keyword)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      ผลการตรวจสอบ
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                      <span>การค้นหาทั้งหมด: {searchSessions.length}</span>
                      <span>
                        ผลลัพธ์รวม:{" "}
                        {searchSessions.reduce(
                          (total, session) => total + session.results.length,
                          0
                        )}
                      </span>
                      {searchSessions.length > 0 && (
                        <span className="text-blue-400">
                          💾 บันทึกใน Browser
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {searchSessions.length > 0 && (
                      <button
                        onClick={clearResults}
                        className="px-3 py-1 bg-red-700 text-red-200 rounded text-sm hover:bg-red-600 transition-colors"
                      >
                        ล้างผลลัพธ์
                      </button>
                    )}
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ค้นหา URL..."
                      className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-md text-sm text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {searchSessions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400 text-lg mb-2">
                        ยังไม่มีผลการตรวจสอบ
                      </p>
                      <p className="text-gray-500 text-sm">
                        เริ่มค้นหาเพื่อดูผลลัพธ์
                      </p>
                      <p className="text-gray-600 text-xs mt-2">
                        💾 ข้อมูลจะถูกบันทึกอัตโนมัติใน Browser
                      </p>
                    </div>
                  ) : (
                    searchSessions.map((session) => (
                      <div
                        key={session.id}
                        className="border border-slate-600 rounded-lg bg-slate-700"
                      >
                        {/* Session Header (Folder) */}
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => toggleSession(session.id)}
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              {session.isExpanded ? (
                                <>
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                  <FolderOpen className="w-5 h-5 text-yellow-400" />
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                  <Folder className="w-5 h-5 text-yellow-400" />
                                </>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-white truncate break-words">
                                ค้นหา: "{session.query}"
                              </h3>
                              <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                                <span>{session.results.length} ผลลัพธ์</span>
                                <span>{session.timestamp}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id);
                              }}
                              className="px-2 py-1 bg-red-700 text-red-200 rounded text-xs hover:bg-red-600 transition-colors"
                            >
                              ลบ
                            </button>
                          </div>
                        </div>

                        {/* Session Results (แสดงเมื่อ expanded) */}
                        {session.isExpanded && (
                          <div className="border-t border-slate-600 bg-slate-800">
                            {session.results.length === 0 ? (
                              <div className="p-4 text-center text-gray-400">
                                ไม่มีผลลัพธ์
                              </div>
                            ) : (
                              <div className="space-y-3 p-4">
                                {session.results.map((result) => (
                                  <div
                                    key={result.id}
                                    className="border border-slate-500 rounded-lg p-3 bg-slate-700 hover:shadow-lg transition-shadow"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-white text-sm truncate break-words mb-1">
                                          {result.title}
                                        </h4>
                                        <p
                                          className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer mb-1 truncate break-all transition-colors"
                                          onContextMenu={(e) =>
                                            handleLinkContextMenu(e, result.url)
                                          }
                                          onClick={() =>
                                            window.open(
                                              result.url,
                                              "_blank",
                                              "noopener,noreferrer"
                                            )
                                          }
                                          title="คลิกซ้ายเพื่อเปิด, คลิกขวาเพื่อดูตัวเลือก"
                                        >
                                          🔗 {result.url}
                                        </p>
                                        <p className="text-xs text-gray-400 mb-2 line-clamp-2 overflow-hidden text-ellipsis break-words">
                                          {result.snippet}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mb-1">
                                          {result.keywords.map(
                                            (keyword, index) => (
                                              <span
                                                key={index}
                                                className={`px-1.5 py-0.5 rounded text-xs border ${
                                                  keyword === "ต้องสงสัย"
                                                    ? "bg-yellow-600 text-yellow-100 border-yellow-500"
                                                    : "bg-slate-600 text-gray-300 border-slate-500"
                                                }`}
                                              >
                                                {keyword}
                                              </span>
                                            )
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          ตรวจสอบ: {result.lastCrawled}
                                        </p>
                                      </div>
                                      <div className="ml-3">
                                        <button
                                          onClick={() =>
                                            handleViewDetails(
                                              result.url,
                                              result.title
                                            )
                                          }
                                          className="px-2 py-1 bg-blue-700 text-blue-200 rounded text-xs hover:bg-blue-600 transition-colors"
                                        >
                                          ดู
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu สำหรับลิงค์ */}
      {contextMenu.visible && (
        <div
          className="fixed bg-slate-700 border border-slate-600 rounded-lg shadow-lg py-2 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={copyLink}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-white hover:bg-slate-600 w-full text-left transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>คัดลอกลิงค์</span>
          </button>
          <button
            onClick={openInNewTab}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-white hover:bg-slate-600 w-full text-left transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>เปิดในแท็บใหม่</span>
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-600">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate">
                  {previewModal.title}
                </h3>
                <p className="text-sm text-blue-400 truncate">
                  {previewModal.url}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() =>
                    window.open(
                      previewModal.url,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  className="px-3 py-1 bg-blue-700 text-blue-200 rounded text-sm hover:bg-blue-600 transition-colors flex items-center space-x-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>เปิดในแท็บใหม่</span>
                </button>
                <button
                  onClick={closePreview}
                  className="px-3 py-1 bg-red-700 text-red-200 rounded text-sm hover:bg-red-600 transition-colors flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>ปิด</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-4">
              <iframe
                src={previewModal.url}
                className="w-full h-full border border-slate-600 rounded"
                title={previewModal.title}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebCrawlerPage;
