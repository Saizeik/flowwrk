import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileSidebar from "./MobileSidebar";

/**
 * Authenticated application shell (mobile-first).
 * - Desktop (lg+): persistent sidebar
 * - Mobile: sidebar becomes an off-canvas drawer
 */
export default function AuthLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close drawer on desktop resize (prevents stuck overlay when rotating/resizing)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false); // lg breakpoint
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile drawer */}
      <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <Sidebar className="hidden lg:block" />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

          <main className="min-w-0 flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
