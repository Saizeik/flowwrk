import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./RequireAuth";

import PublicLayout from "../components/layout/PublicLayout";
import AppLayout from "../components/layout/AuthLayout";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import AuthCallback from "../pages/AuthCallback"; // 👈 ADD THIS

import Dashboard from "../pages/Dashboard";
import Applications from "../pages/Applications";
import NewApplication from "../pages/NewApplication";
import ApplicationDetail from "../pages/ApplicationDetail";
import Board from "../pages/Board";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";
import OpenJobs from "../pages/OpenJobs";

export default function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

       
  {/* ✅ OAuth landing route (must be public) */}
  <Route path="/auth/callback" element={<AuthCallback />} />
      </Route>

      {/* PROTECTED */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/new" element={<NewApplication />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/board" element={<Board />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/open-jobs" element={<OpenJobs />} />
        </Route>
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
