import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Bell,
  Settings,
  Briefcase,
} from "lucide-react";
import { remindersApi, applicationsApi } from "../../api";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  rightSlot?: React.ReactNode;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const location = useLocation();

  // Small counts for sidebar badges (best-effort; doesn’t block render)
  const { data: appsData } = useQuery({
    queryKey: ["applications", "sidebarCount"],
    queryFn: () =>
      applicationsApi.getAll({ page: 0, size: 1 }).then((res) => res.data),
    staleTime: 30_000,
  });

  const { data: reminders } = useQuery({
    queryKey: ["reminders", "sidebar"],
    queryFn: () => remindersApi.getAll().then((res) => res.data),
    staleTime: 30_000,
  });

  const applicationsCount = appsData?.totalElements ?? undefined;
  const pendingReminders = reminders
    ? reminders.filter((r: any) => !r.completed).length
    : 0;

  const items: NavItem[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      to: "/applications",
      label: "Applications",
      icon: FileText,
      rightSlot:
        typeof applicationsCount === "number" ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-medium text-slate-600">
            {applicationsCount}
          </span>
        ) : null,
    },
    { to: "/board", label: "Board", icon: Briefcase },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    {
      to: "/dashboard#reminders",
      label: "Reminders",
      icon: Bell,
      rightSlot:
        pendingReminders > 0 ? (
          <span className="h-2 w-2 rounded-full bg-rose-500" />
        ) : null,
    },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (to: string) => {
    // dashboard#reminders shouldn't be treated as a separate route
    if (to.startsWith("/dashboard")) {
      return location.pathname === "/dashboard";
    }
    return location.pathname === to;
  };

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <Briefcase className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">JobTrack</div>
          <div className="text-xs text-slate-500">Pro</div>
        </div>
      </div>

      <nav className="px-4 py-4">
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cx(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className={cx("h-4 w-4", active && "text-white")} />
                  {item.label}
                </span>
                {item.rightSlot}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
