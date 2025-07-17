import { Routes, Route } from "react-router";
import { BrowserRouter as Router } from "react-router-dom";
import ProtectedRoute from "./contexts/ProtectedRoute";
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/case" element={<CaseManagement />} />
          <Route path="/usermanagement" element={<UserManagementPage />} />
          <Route path="/slip" element={<SlipReaderPage />} />
          <Route path="/illegal-images" element={<IllegalImagePage />} />
          <Route path="/crawler" element={<WebCrawlerPage />} />
          <Route path="/user-profile" element={<UserProfilePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/watchlist" element={<WatchListPage />} />
          <Route path="/alerts" element={<AlertSystemPage />} />
        </Route>
      </Routes>
    </Router >
  )
}

export default App
