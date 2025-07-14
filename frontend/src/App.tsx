import { Routes, Route } from "react-router";
import { BrowserRouter as Router } from "react-router-dom";
import Home from "./views/HomePage";
import ProtectedRoute from "./contexts/ProtectedRoute";
import Login from "./views/LoginPage";
import CaseManagement from "./views/CaseManagementPage";
import UsserManagementPage from "./views/UserManagementPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/case" element={<CaseManagement />} />
          <Route path="/user-management" element={<UsserManagementPage />} />
        </Route>
      </Routes>
    </Router >
  )
}

export default App
