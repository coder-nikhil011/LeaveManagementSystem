import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import DashboardPage from "../pages/DashboardPage";
import ApplyLeavePage from "../pages/ApplyLeavePage";
import LeaveHistoryPage from "../pages/LeaveHistoryPage";
import TeamPage from "../pages/TeamPage";
import ProjectsPage from "../pages/ProjectsPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/apply-leave" element={<ApplyLeavePage />} />
      <Route path="/leave-history" element={<LeaveHistoryPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;