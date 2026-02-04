import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Plus, Upload, Search, LogOut, Menu } from "lucide-react";
import { useAuth } from "../../providers/authprovider";
import NotificationsPopover from "../layout/NotificationsPopover";
import { useQuery } from "@tanstack/react-query";
import { remindersApi } from "../../api";

type TopbarProps = {
  onOpenSidebar?: () => void;
};

export default function Topbar({ onOpenSidebar }: TopbarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const displayName =
    user?.user_metadata?.name ||
    user?.email?.split("@")?.[0] ||
    "Account";

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Small notification dot logic
  const days = 14;
  const dotQuery = useQuery({
    queryKey: ["reminders_upcoming", days],
    queryFn: () =>
      remindersApi.getUpcoming({
        days,
        includeOverdue: true,
        limit: 1,
      }),
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const hasUpcoming = useMemo(
    () => (dotQuery.data?.data?.length ?? 0) > 0,
    [dotQuery.data]
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:gap-4 sm:px-6">
        {/* ✅ Mobile hamburger */}
        <button
          type="button"
          onClick={() => onOpenSidebar?.()}
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="relative min-w-0 flex-1 sm:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs, companies..."
            className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/applications"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:px-3.5"
            title="Import CSV"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import CSV</span>
          </Link>

          <Link
            to="/applications/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 sm:px-4"
            title="Add New Job"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Application</span>
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              aria-label="Notifications"
              aria-expanded={open}
            >
              <Bell className="h-4 w-4" />
              {hasUpcoming && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              )}
            </button>

            <NotificationsPopover
              open={open}
              onClose={() => setOpen(false)}
              days={14}
            />
          </div>

          {/* Desktop account + logout */}
          <div className="hidden items-center gap-2 sm:flex">
            <Link
              to="/settings"
              className="text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              {displayName}
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
