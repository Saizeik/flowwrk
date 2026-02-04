import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Bell,
  Settings,
  Briefcase,
  X,
  BriefcaseBusiness,
  LogOut,
} from "lucide-react";
import { remindersApi, applicationsApi } from "../../api";
import { useAuth } from "../../providers/authprovider";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  rightSlot?: React.ReactNode;
  className?: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type SidebarProps = {
  className?: string;
  variant?: "static" | "drawer";
  onClose?: () => void;
  onNavigate?: () => void;
};

export default function Sidebar({
  className,
  variant = "static",
  onClose,
  onNavigate,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleNavigate = () => {
    onNavigate?.();
    onClose?.();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose?.();
    navigate("/login");
  };

  // Sidebar badges (safe, best-effort)
  const { data: appsData } = useQuery({
    queryKey: ["applications", "sidebarCount", user?.id],
    enabled: !!user?.id,
    queryFn: () =>
      applicationsApi.getAll({ page: 0, size: 1 }).then((res) => res.data),
    staleTime: 30_000,
  });

  const { data: remindersRes } = useQuery({
    queryKey: ["reminders", "sidebarUpcoming", user?.id],
    enabled: !!user?.id,
    queryFn: () =>
      remindersApi.getUpcoming({
        days: 365,
        includeOverdue: true,
        limit: 1,
      }),
    staleTime: 30_000,
  });

  const applicationsCount = appsData?.totalElements ?? undefined;
  const hasPendingReminders = (remindersRes?.data?.length ?? 0) > 0;

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

    // ✅ Mobile-only
    {
      to: "/open-jobs",
      label: "Open Jobs",
      icon: BriefcaseBusiness,
      className: "lg:hidden",
    },

    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    {
      to: "/dashboard#reminders",
      label: "Reminders",
      icon: Bell,
      rightSlot: hasPendingReminders ? (
        <span className="h-2 w-2 rounded-full bg-rose-500" />
      ) : null,
    },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (to: string) => {
    if (to.startsWith("/dashboard")) {
      return location.pathname === "/dashboard";
    }
    return location.pathname === to;
  };

  return (
    <aside
      className={cx(
        "flex h-full flex-col border-r border-slate-200 bg-white",
        variant === "drawer" ? "w-72" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between gap-3 px-5">
        <div className="flex items-center gap-3">
        <Link to="/" className="inline-flex items-center gap-2">
 
  <BrandLogo linkToHome={false} size="lg" variant="lockup" />
</Link>        
        </div>

        {variant === "drawer" ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={handleNavigate}
                className={cx(
                  item.className,
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

      {/* ✅ Mobile-only Sign Out */}
      {variant === "drawer" && (
        <div className="border-t border-slate-200 p-3 lg:hidden">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
