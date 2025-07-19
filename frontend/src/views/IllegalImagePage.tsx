import { useState, useEffect } from "react";
import {
  Archive,
  Filter,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  X,
  Folder,
  FolderOpen,
  Eye,
} from "lucide-react";
import axios from "../utils/axiosInstance";
import Header from "../components/Header";
import SideBar from "../components/SideBar";

interface ClassificationResult {
  filename: string;
  classification: string;
  confidence?: number;
}

interface IllegalImagesSeparationResponse {
  message: string;
  total_images: number;
  legal_images: number;
  illegal_images: number;
  legal_zip_url?: string;
  illegal_zip_url?: string;
  classifications: ClassificationResult[];
}

interface AnalysisSession {
  id: string;
  timestamp: string;
  originalFileName: string;
  results: IllegalImagesSeparationResponse;
}

interface CategoryFolder {
  weapon: ClassificationResult[]; // อาวุธ
  drug: ClassificationResult[]; // ยาเสพติด
  pornography: ClassificationResult[]; // ภาพลามก/เปลือย
  vape: ClassificationResult[]; // บุหรี่ไฟฟ้า
  other: ClassificationResult[]; // อื่นๆ
}

type SuspicionLevel = "watch" | "suspicious" | "high-risk" | "irrelevant";
type CategoryType = "weapon" | "drug" | "pornography" | "vape" | "other";

function IllegalImagePage() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [result, setResult] = useState<IllegalImagesSeparationResponse | null>(
    null
  );
  const [filter, setFilter] = useState<"all" | "legal" | "illegal">("all");

  // ระบบโฟลเดอร์
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | "all">(
    "all"
  );
  const [suspicionFilter, setSuspicionFilter] = useState<
    SuspicionLevel | "all"
  >("all");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  // โหลดข้อมูลจาก localStorage เมื่อเริ่มต้น
  useEffect(() => {
    const savedSessions = localStorage.getItem("illegalImageSessions");
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // บันทึกข้อมูลลง localStorage
  const saveToLocalStorage = (newSessions: AnalysisSession[]) => {
    localStorage.setItem("illegalImageSessions", JSON.stringify(newSessions));
    setSessions(newSessions);
  };

  // จำแนกประเภทภาพ
  const categorizeImage = (classification: string): CategoryType => {
    const lowerClass = classification.toLowerCase();
    if (
      lowerClass.includes("weapon") ||
      lowerClass.includes("gun") ||
      lowerClass.includes("knife")
    )
      return "weapon";
    if (lowerClass.includes("drug") || lowerClass.includes("narcotic"))
      return "drug";
    if (
      lowerClass.includes("porn") ||
      lowerClass.includes("sexual") ||
      lowerClass.includes("nude") ||
      lowerClass.includes("nudity")
    )
      return "pornography";
    if (
      lowerClass.includes("vape") ||
      lowerClass.includes("e-cigarette") ||
      lowerClass.includes("บุหรี่ไฟฟ้า")
    )
      return "vape";
    return "other";
  };

  // จำแนกระดับความน่าสงสัย
  const getSuspicionLevel = (confidence?: number): SuspicionLevel => {
    if (!confidence) return "irrelevant";
    if (confidence >= 0.9) return "high-risk";
    if (confidence >= 0.8) return "suspicious";
    if (confidence >= 0.6) return "watch";
    return "irrelevant";
  };

  // สีตามระดับความน่าสงสัย
  const getSuspicionColor = (level: SuspicionLevel): string => {
    switch (level) {
      case "high-risk":
        return "text-red-400 bg-red-900/30";
      case "suspicious":
        return "text-yellow-400 bg-yellow-900/30";
      case "watch":
        return "text-blue-400 bg-blue-900/30";
      case "irrelevant":
        return "text-white bg-gray-700/30";
    }
  };

  // สีพื้นหลังตามประเภทหลักฐาน
  const getEvidenceBackgroundColor = (
    category: CategoryType,
    classification: string
  ): string => {
    const isOther = classification.toLowerCase() === "other";

    if (isOther) {
      return "bg-gray-800/50 border-gray-600"; // ปกติ - สีเทา
    }

    switch (category) {
      case "weapon":
        return "bg-red-900/30 border-red-700/50"; // อาวุธ - สีแดง
      case "drug":
        return "bg-purple-900/30 border-purple-700/50"; // ยาเสพติด - สีม่วง
      case "pornography":
        return "bg-pink-900/30 border-pink-700/50"; // ภาพลามก/เปลือย - สีชมพู
      case "vape":
        return "bg-cyan-900/30 border-cyan-700/50"; // บุหรี่ไฟฟ้า - สีฟ้า
      case "other":
        return "bg-yellow-900/30 border-yellow-700/50"; // อื่นๆที่ไม่ใช่ other - สีเหลือง
    }
  };

  // ข้อความตามระดับความน่าสงสัย
  const getSuspicionText = (level: SuspicionLevel): string => {
    switch (level) {
      case "high-risk":
        return "ต้องสงสัย";
      case "suspicious":
        return "น่าสงสัย";
      case "watch":
        return "เฝ้าระวัง";
      case "irrelevant":
        return "ไม่เกี่ยวข้อง";
    }
  };

  // จัดกลุ่มผลลัพธ์ตามหมวดหมู่
  const organizeByCategory = (
    classifications: ClassificationResult[]
  ): CategoryFolder => {
    return classifications.reduce(
      (acc, item) => {
        const category = categorizeImage(item.classification);
        acc[category].push(item);
        return acc;
      },
      {
        weapon: [] as ClassificationResult[],
        drug: [] as ClassificationResult[],
        pornography: [] as ClassificationResult[],
        vape: [] as ClassificationResult[],
        other: [] as ClassificationResult[],
      }
    );
  };

  // ฟังก์ชันจำลองการประมวลผลแบบ real-time ตามขนาดไฟล์
  const simulateProcessingByFileSize = (fileSize: number, isZip: boolean) => {
    // ประมาณเวลาการประมวลผลจากขนาดไฟล์
    const baseTime = isZip ? 2000 : 500; // milliseconds
    const sizeMultiplier = Math.max(fileSize / 1000000, 1); // 1MB = 1 multiplier
    const totalTime = Math.min(baseTime * sizeMultiplier, 10000); // จำกัดไม่เกิน 10 วินาที

    const interval = totalTime / 45; // แบ่งเป็น 45 ช่วง (30% ถึง 75%)
    let currentStep = 0;

    const processingInterval = setInterval(() => {
      currentStep++;
      const progressStep = Math.round((currentStep / 45) * 45); // 0-45%
      const newProgress = 30 + progressStep; // 30-75%

      setProgress(Math.min(newProgress, 75));

      if (currentStep <= 15) {
        setProgressText(
          `กำลังแยกไฟล์... (${Math.round((currentStep / 15) * 100)}%)`
        );
      } else if (currentStep <= 35) {
        const fileIndex = currentStep - 15;
        setProgressText(`กำลังวิเคราะห์ภาพ... (${fileIndex}/ประมาณ)`);
      } else {
        setProgressText("กำลังเตรียมผลลัพธ์...");
      }

      if (currentStep >= 45 || newProgress >= 75) {
        clearInterval(processingInterval);
      }
    }, interval);

    return processingInterval;
  };

  // ฟังก์ชันจัดการการอัปโหลดไฟล์
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setProcessing(true);
    setResult(null);
    setProgress(0);
    setProgressText("เริ่มต้นการประมวลผล...");

    try {
      // จำลองขั้นตอนการประมวลผล
      setProgress(10);
      setProgressText("กำลังอัปโหลดไฟล์...");

      const formData = new FormData();
      formData.append("file", file);

      setProgress(20);
      setProgressText("กำลังเตรียมการวิเคราะห์...");

      // ประมาณจำนวนไฟล์ (สำหรับ ZIP file จะมีหลายไฟล์, ไฟล์เดี่ยวจะมี 1 ไฟล์)
      const isZipFile = file.type.includes("zip");

      setProgress(30);
      setProgressText("เริ่มวิเคราะห์ไฟล์...");

      // เริ่มจำลองการประมวลผลตามขนาดไฟล์
      const processingInterval = simulateProcessingByFileSize(
        file.size,
        isZipFile
      );

      const response = await axios.post<IllegalImagesSeparationResponse>(
        "/illegal-images/separate",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // หยุดการจำลองเมื่อได้ผลลัพธ์
      clearInterval(processingInterval);

      // แสดงจำนวนไฟล์จริงที่ประมวลผล
      const actualFiles = response.data.total_images;

      // จำลองการนับไฟล์ที่เสร็จแล้ว
      let processedCount = 0;
      const countInterval = setInterval(() => {
        processedCount++;
        const countProgress =
          80 + Math.round((processedCount / actualFiles) * 10); // 80-90%

        setProgress(Math.min(countProgress, 90));
        setProgressText(
          `ประมวลผลเสร็จแล้ว ${processedCount}/${actualFiles} ไฟล์`
        );

        if (processedCount >= actualFiles) {
          clearInterval(countInterval);
          // ไปขั้นตอนต่อไปเมื่อนับครบ
          setTimeout(async () => {
            setProgress(92);
            setProgressText("กำลังจัดกลุ่มผลลัพธ์...");

            await new Promise((resolve) => setTimeout(resolve, 300));

            setProgress(95);
            setProgressText("กำลังบันทึกข้อมูล...");

            await new Promise((resolve) => setTimeout(resolve, 300));

            finishProcessing();
          }, 500);
        }
      }, Math.max(50, 1000 / actualFiles)); // ปรับความเร็วตามจำนวนไฟล์

      // ฟังก์ชันเสร็จสิ้นการประมวลผล
      const finishProcessing = async () => {
        setResult(response.data);

        // บันทึกผลลัพธ์ลง localStorage
        const newSession: AnalysisSession = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          originalFileName: file.name,
          results: response.data,
        };

        const currentSessions = JSON.parse(
          localStorage.getItem("illegalImageSessions") || "[]"
        );
        const updatedSessions = [newSession, ...currentSessions].slice(0, 50); // เก็บไว้ล่าสุด 50 รายการ
        saveToLocalStorage(updatedSessions);

        setProgress(100);
        setProgressText("เสร็จสิ้น!");

        // รอสักครู่แล้วซ่อน progress bar
        setTimeout(() => {
          setProgress(0);
          setProgressText("");
        }, 1000);
      };

      // ถ้าไฟล์น้อยให้เรียก finishProcessing ทันที
      if (actualFiles <= 1) {
        await finishProcessing();
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setProgressText("เกิดข้อผิดพลาด!");
      setTimeout(() => {
        setProgress(0);
        setProgressText("");
      }, 2000);
      alert("เกิดข้อผิดพลาดในการประมวลผลไฟล์");
    } finally {
      setProcessing(false);
    }
  };

  // ฟังก์ชันจัดการ drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      handleFileUpload(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      handleFileUpload(file);
    }
  };

  // ฟังก์ชันดาวน์โหลดไฟล์
  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ฟังก์ชันรีเซ็ต
  const resetUpload = () => {
    setSelectedFile(null);
    setResult(null);
    setFilter("all");
    setCategoryFilter("all");
    setSuspicionFilter("all");
    setProcessing(false);
    setProgress(0);
    setProgressText("");
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <SideBar />

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <div className="flex items-center space-x-3">
                  <Archive className="w-8 h-8 text-green-400" />
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      Illegal Image Detection
                    </h1>
                    <p className="text-gray-300 mt-1">
                      อัปโหลดไฟล์ ZIP
                      หรือภาพเดี่ยวเพื่อแยกภาพที่ผิดกฎหมายออกจากภาพปกติ
                    </p>
                  </div>
                </div>
              </div>

              {/* Folder System - ประวัติการวิเคราะห์ */}
              {sessions.length > 0 && (
                <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <FolderOpen className="w-5 h-5 mr-2" />
                    ประวัติการวิเคราะห์
                  </h2>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {sessions.map((session) => {
                      const isExpanded = expandedFolders.has(session.id);
                      const categoryData = organizeByCategory(
                        session.results.classifications
                      );

                      return (
                        <div
                          key={session.id}
                          className="border border-slate-600 rounded-lg"
                        >
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/50"
                            onClick={() => {
                              const newExpanded = new Set(expandedFolders);
                              if (isExpanded) {
                                newExpanded.delete(session.id);
                              } else {
                                newExpanded.add(session.id);
                              }
                              setExpandedFolders(newExpanded);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              {isExpanded ? (
                                <FolderOpen className="w-5 h-5 text-blue-400" />
                              ) : (
                                <Folder className="w-5 h-5 text-gray-400" />
                              )}
                              <div>
                                <p className="text-white font-medium">
                                  {session.originalFileName}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {new Date(session.timestamp).toLocaleString(
                                    "th-TH"
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-green-400 text-sm">
                                {session.results.legal_images} ปกติ
                              </span>
                              <span className="text-red-400 text-sm">
                                {session.results.illegal_images} ผิดกฎหมาย
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setResult(session.results);
                                }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-slate-600 p-3 space-y-2">
                              {Object.entries(categoryData).map(
                                ([category, items]) => {
                                  if (items.length === 0) return null;

                                  const categoryName = {
                                    weapon: "อาวุธ",
                                    drug: "ยาเสพติด",
                                    pornography: "ภาพลามก/เปลือย",
                                    vape: "บุหรี่ไฟฟ้า",
                                    other: "อื่นๆ",
                                  }[category as CategoryType];

                                  return (
                                    <div
                                      key={category}
                                      className="bg-slate-700/50 rounded p-2"
                                    >
                                      <h4 className="text-white font-medium mb-1">
                                        {categoryName} ({items.length})
                                      </h4>
                                      <div className="space-y-1">
                                        {items
                                          .slice(0, 3)
                                          .map(
                                            (
                                              item: ClassificationResult,
                                              idx: number
                                            ) => {
                                              const suspicionLevel =
                                                getSuspicionLevel(
                                                  item.confidence
                                                );
                                              const isIllegal =
                                                item.classification.toLowerCase() !==
                                                "other";
                                              return (
                                                <div
                                                  key={idx}
                                                  className="flex items-center justify-between text-sm"
                                                >
                                                  <span className="text-gray-300 truncate">
                                                    {item.filename}
                                                  </span>
                                                  {isIllegal && (
                                                    <span
                                                      className={`px-2 py-1 rounded text-xs ${getSuspicionColor(
                                                        suspicionLevel
                                                      )}`}
                                                    >
                                                      {getSuspicionText(
                                                        suspicionLevel
                                                      )}
                                                    </span>
                                                  )}
                                                </div>
                                              );
                                            }
                                          )}
                                        {items.length > 3 && (
                                          <p className="text-gray-400 text-xs">
                                            และอีก {items.length - 3} ไฟล์...
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload Section */}
              <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                <h2 className="text-lg font-semibold text-white mb-4">
                  อัปโหลดไฟล์
                </h2>

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {processing ? (
                    <div className="space-y-6">
                      {/* Progress Bar */}
                      <div className="w-full max-w-md mx-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300">
                            {progressText}
                          </span>
                          <span className="text-sm text-blue-400 font-medium">
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Animation dots */}
                      <div className="flex justify-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>

                      <p className="text-gray-400 text-center">
                        กำลังประมวลผลไฟล์ กรุณารอสักครู่...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 mx-auto text-gray-400" />
                      <div>
                        <p className="text-lg text-gray-300 mb-2">
                          {result
                            ? "อัปโหลดไฟล์ใหม่เพื่อวิเคราะห์เพิ่มเติม"
                            : "ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์"}
                        </p>
                        <p className="text-sm text-gray-500">
                          รองรับไฟล์ ZIP หรือไฟล์ภาพ (JPG, PNG, GIF, BMP)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".zip,.jpg,.jpeg,.png,.gif,.bmp"
                        onChange={handleChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                      >
                        {result ? "เลือกไฟล์ใหม่" : "เลือกไฟล์"}
                      </label>
                    </div>
                  )}
                </div>

                {selectedFile && !processing && (
                  <div className="mt-4 p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          {selectedFile.name}
                        </p>
                        <p className="text-gray-400 text-sm">
                          ขนาด: {(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                      <button
                        onClick={resetUpload}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Section */}
              {result && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white">
                        ผลการประมวลผล
                      </h2>
                      <button
                        onClick={resetUpload}
                        className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
                      >
                        อัปโหลดใหม่
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-slate-700 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Archive className="w-5 h-5 text-blue-500" />
                          <span className="text-gray-300">รูปภาพทั้งหมด</span>
                        </div>
                        <p className="text-2xl font-bold text-white mt-2">
                          {result.total_images}
                        </p>
                      </div>

                      <div className="bg-slate-700 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-gray-300">ภาพปกติ</span>
                        </div>
                        <p className="text-2xl font-bold text-green-400 mt-2">
                          {result.legal_images}
                        </p>
                      </div>

                      <div className="bg-slate-700 p-4 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          <span className="text-gray-300">ภาพผิดกฎหมาย</span>
                        </div>
                        <p className="text-2xl font-bold text-red-400 mt-2">
                          {result.illegal_images}
                        </p>
                      </div>
                    </div>

                    {/* Download Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.legal_zip_url && (
                        <button
                          onClick={() =>
                            downloadFile(
                              result.legal_zip_url!,
                              "legal_images.zip"
                            )
                          }
                          className="flex items-center justify-center space-x-2 p-3 bg-green-700 text-white rounded-lg hover:bg-green-600"
                        >
                          <Download className="w-5 h-5" />
                          <span>ดาวน์โหลดภาพปกติ</span>
                        </button>
                      )}

                      {result.illegal_zip_url && (
                        <button
                          onClick={() =>
                            downloadFile(
                              result.illegal_zip_url!,
                              "illegal_images.zip"
                            )
                          }
                          className="flex items-center justify-center space-x-2 p-3 bg-red-700 text-white rounded-lg hover:bg-red-600"
                        >
                          <Download className="w-5 h-5" />
                          <span>ดาวน์โหลดภาพผิดกฎหมาย</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category-based Results */}
                  <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        รายละเอียดการจำแนก
                      </h3>

                      <div className="flex items-center space-x-2">
                        <span className="text-green-400 text-sm">
                          {result.legal_images} ปกติ
                        </span>
                        <span className="text-red-400 text-sm">
                          {result.illegal_images} ผิดกฎหมาย
                        </span>
                      </div>
                    </div>

                    {/* Filter Options */}
                    <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                      <h4 className="text-md font-medium text-white mb-3 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        ตัวกรองผลลัพธ์
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* สถานะ */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            สถานะ
                          </label>
                          <select
                            value={filter}
                            onChange={(e) =>
                              setFilter(
                                e.target.value as "all" | "legal" | "illegal"
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">ทั้งหมด</option>
                            <option value="legal">ภาพปกติ</option>
                            <option value="illegal">ภาพผิดกฎหมาย</option>
                          </select>
                        </div>

                        {/* หมวดหมู่ */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            หมวดหมู่
                          </label>
                          <select
                            value={categoryFilter}
                            onChange={(e) =>
                              setCategoryFilter(
                                e.target.value as CategoryType | "all"
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">ทั้งหมด</option>
                            <option value="weapon">อาวุธ</option>
                            <option value="drug">ยาเสพติด</option>
                            <option value="pornography">ภาพลามก/เปลือย</option>
                            <option value="vape">บุหรี่ไฟฟ้า</option>
                            <option value="other">อื่นๆ</option>
                          </select>
                        </div>

                        {/* ระดับความน่าสงสัย */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            ระดับความน่าสงสัย
                          </label>
                          <select
                            value={suspicionFilter}
                            onChange={(e) =>
                              setSuspicionFilter(
                                e.target.value as SuspicionLevel | "all"
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">ทั้งหมด</option>
                            <option value="high-risk">
                              ต้องสงสัย (&gt;90%)
                            </option>
                            <option value="suspicious">
                              น่าสงสัย (80-90%)
                            </option>
                            <option value="watch">เฝ้าระวัง (60-70%)</option>
                            <option value="irrelevant">
                              ไม่เกี่ยวข้อง (&lt;60%)
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* แสดงผลแยกตามหมวดหมู่ */}
                    <div className="space-y-4">
                      {(() => {
                        const categoryData = organizeByCategory(
                          result.classifications
                        );

                        return Object.entries(categoryData).map(
                          ([category, items]) => {
                            if (items.length === 0) return null;

                            const categoryName = {
                              weapon: "อาวุธ",
                              drug: "ยาเสพติด",
                              pornography: "ภาพลามก/เปลือย",
                              vape: "บุหรี่ไฟฟ้า",
                              other: "อื่นๆ",
                            }[category as CategoryType];

                            // กรองตาม filter ปัจจุบัน
                            const filteredItems = items
                              .filter((item: ClassificationResult) => {
                                const isIllegal =
                                  item.classification.toLowerCase() !== "other";
                                if (filter === "legal") return !isIllegal;
                                if (filter === "illegal") return isIllegal;
                                return true;
                              })
                              .filter((item: ClassificationResult) => {
                                // กรองตาม categoryFilter
                                if (categoryFilter !== "all")
                                  return (
                                    categorizeImage(item.classification) ===
                                    categoryFilter
                                  );
                                return true;
                              })
                              .filter((item: ClassificationResult) => {
                                // กรองตาม suspicionFilter
                                if (suspicionFilter !== "all")
                                  return (
                                    getSuspicionLevel(item.confidence) ===
                                    suspicionFilter
                                  );
                                return true;
                              });

                            if (filteredItems.length === 0) return null;

                            return (
                              <div
                                key={category}
                                className="border border-slate-600 rounded-lg"
                              >
                                <div className="bg-slate-700/50 p-3 rounded-t-lg">
                                  <h4 className="text-white font-medium flex items-center justify-between">
                                    <span>{categoryName}</span>
                                    <span className="text-gray-400 text-sm">
                                      ({filteredItems.length} ไฟล์)
                                    </span>
                                  </h4>
                                </div>

                                <div className="p-3 space-y-2">
                                  {filteredItems.map(
                                    (
                                      item: ClassificationResult,
                                      idx: number
                                    ) => {
                                      const isIllegal =
                                        item.classification.toLowerCase() !==
                                        "other";
                                      const suspicionLevel = getSuspicionLevel(
                                        item.confidence
                                      );
                                      const itemCategory = categorizeImage(
                                        item.classification
                                      );

                                      return (
                                        <div
                                          key={idx}
                                          className={`flex items-center justify-between p-3 rounded-lg border ${getEvidenceBackgroundColor(
                                            itemCategory,
                                            item.classification
                                          )}`}
                                        >
                                          <div className="flex items-center space-x-3">
                                            {/* ไอคอนตามประเภทหลักฐาน */}
                                            {(() => {
                                              if (isIllegal) {
                                                switch (itemCategory) {
                                                  case "weapon":
                                                    return (
                                                      <AlertTriangle className="w-5 h-5 text-red-500" />
                                                    );
                                                  case "drug":
                                                    return (
                                                      <AlertTriangle className="w-5 h-5 text-purple-500" />
                                                    );
                                                  case "pornography":
                                                    return (
                                                      <AlertTriangle className="w-5 h-5 text-pink-500" />
                                                    );
                                                  case "vape":
                                                    return (
                                                      <AlertTriangle className="w-5 h-5 text-cyan-500" />
                                                    );
                                                  default:
                                                    return (
                                                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                                    );
                                                }
                                              } else {
                                                return (
                                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                                );
                                              }
                                            })()}
                                            <div>
                                              <p className="text-white font-medium">
                                                {item.filename}
                                              </p>
                                              <div className="flex items-center space-x-2">
                                                <span
                                                  className={`text-sm ${(() => {
                                                    if (isIllegal) {
                                                      switch (itemCategory) {
                                                        case "weapon":
                                                          return "text-red-400";
                                                        case "drug":
                                                          return "text-purple-400";
                                                        case "pornography":
                                                          return "text-pink-400";
                                                        case "vape":
                                                          return "text-cyan-400";
                                                        default:
                                                          return "text-yellow-400";
                                                      }
                                                    } else {
                                                      return "text-green-400";
                                                    }
                                                  })()}`}
                                                >
                                                  {item.classification}
                                                  {item.confidence &&
                                                    isIllegal &&
                                                    ` (${(
                                                      item.confidence * 100
                                                    ).toFixed(1)}%)`}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center space-x-2">
                                            {isIllegal && (
                                              <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${getSuspicionColor(
                                                  suspicionLevel
                                                )}`}
                                              >
                                                {getSuspicionText(
                                                  suspicionLevel
                                                )}
                                              </span>
                                            )}
                                            <span
                                              className={`px-2 py-1 rounded text-xs font-medium ${(() => {
                                                if (isIllegal) {
                                                  switch (itemCategory) {
                                                    case "weapon":
                                                      return "bg-red-700 text-red-100";
                                                    case "drug":
                                                      return "bg-purple-700 text-purple-100";
                                                    case "pornography":
                                                      return "bg-pink-700 text-pink-100";
                                                    case "vape":
                                                      return "bg-cyan-700 text-cyan-100";
                                                    default:
                                                      return "bg-yellow-700 text-yellow-100";
                                                  }
                                                } else {
                                                  return "bg-green-700 text-green-100";
                                                }
                                              })()}`}
                                            >
                                              {isIllegal
                                                ? categoryName
                                                : "ปกติ"}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            );
                          }
                        );
                      })()}

                      {/* แสดงข้อความเมื่อไม่มีผลลัพธ์ */}
                      {Object.values(
                        organizeByCategory(result.classifications)
                      ).every((items) => {
                        const filtered = items
                          .filter((item: ClassificationResult) => {
                            const isIllegal =
                              item.classification.toLowerCase() !== "other";
                            if (filter === "legal") return !isIllegal;
                            if (filter === "illegal") return isIllegal;
                            return true;
                          })
                          .filter((item: ClassificationResult) => {
                            if (categoryFilter !== "all")
                              return (
                                categorizeImage(item.classification) ===
                                categoryFilter
                              );
                            return true;
                          })
                          .filter((item: ClassificationResult) => {
                            if (suspicionFilter !== "all")
                              return (
                                getSuspicionLevel(item.confidence) ===
                                suspicionFilter
                              );
                            return true;
                          });
                        return filtered.length === 0;
                      }) && (
                        <div className="text-center py-8">
                          <p className="text-gray-400">
                            ไม่มีรายการตามเงื่อนไขที่เลือก
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IllegalImagePage;
