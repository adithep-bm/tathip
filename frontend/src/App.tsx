import { Routes, Route } from "react-router";
import { BrowserRouter as Router } from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "./contexts/ProtectedRoute";
import PublicRoute from "./contexts/PublicRoute";
import Login from "./views/LoginPage";
import CaseManagement from "./views/CaseManagementPage";
import UserManagementPage from "./views/UserManagementPage";
import SlipReaderPage from "./views/SlipReaderPage";
import IllegalImagePage from "./views/IllegalImagePage";
import WebCrawlerPage from "./views/WebCrawlerPage";
import UserProfilePage from "./views/UserProfilePage";
import DashboardPage from "./views/DashboardPage";
import ReportsPage from "./views/ReportsPage";
import WatchListPage from "./views/WatchListPage";
import AlertSystemPage from "./views/AlertSystemPage";
import CaseDetailPage from "./views/CaseDetailPage";
import EvidenceDetailPage from "./views/EvidenceDetailPage";
import WebCrawlerDetailPage from "./views/WebCrawlerDetailPage";
import WatchlistDetailPage from "./views/WatchlistDetailPage";

function App() {
  useEffect(() => {
    console.log(
      "App component mounted, current path:",
      window.location.pathname
    );
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes - ป้องกันไม่ให้เข้าเมื่อล็อกอินแล้ว */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Login />} />
        </Route>

        {/* Protected routes - ต้องล็อกอินก่อน */}
        <Route element={<ProtectedRoute />}>
          <Route path="/case" element={<CaseManagement />} />
          <Route path="/usermanagement" element={<UserManagementPage />} />
          <Route path="/slip" element={<SlipReaderPage />} />
          <Route path="/illegal-images" element={<IllegalImagePage />} />
          <Route path="/crawler" element={<WebCrawlerPage />} />
          <Route path="/crawler/:id" element={<WebCrawlerDetailPage />} />
          <Route path="/user-profile" element={<UserProfilePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/watchlist" element={<WatchListPage />} />
          <Route path="/alerts" element={<AlertSystemPage />} />
          <Route path="/case/:case_id" element={<CaseDetailPage />} />
          <Route path="/evidence/:id" element={<EvidenceDetailPage />} />
          <Route path="/watchlist/:id" element={<WatchlistDetailPage />} />
        </Route>

        {/* Catch-all route - redirect ไปหน้า login */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
