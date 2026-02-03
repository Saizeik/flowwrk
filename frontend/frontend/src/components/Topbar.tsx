import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase } from "lucide-react";
import { useAuth } from "../providers/authprovider";
import { supabase } from "../lib/supabase";


function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Topbar() {
  const navigate = useNavigate();
  const loc = useLocation();

  // If Topbar renders outside AuthProvider, don't hard crash
  let auth: ReturnType<typeof useAuth> | null = null;

  try {
    auth = useAuth();
  } catch {
    return (
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <div className="text-sm text-slate-600">JobJourney</div>
        <div className="text-sm text-slate-500">
          <Link to="/login" className="text-blue-700 hover:underline">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const { signOut, user, loading } = auth;

  const onSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err: any) {
      console.error("Sign out failed:", err?.message ?? err);
    }
  };

  // Badge: count jobs posted in last 24 hours (optional)
  const jobsBadgeQuery = useQuery({
    queryKey: ["open_jobs", "badge", user?.id],
    enabled: !!user?.id, // show only for signed-in users
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("open_jobs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since);

      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000, // 1 min
  });

  const badgeCount = jobsBadgeQuery.data ?? 0;

  const isActive = (path: string) => loc.pathname.startsWith(path);

  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4">
      <div className="text-sm font-semibold text-slate-700">
        <Link to="/dashboard" className="hover:underline">
          JobTrack
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Open Jobs entry point */}
        {user ? (
          <button
            type="button"
            onClick={() => navigate("/open-jobs")}
            className={cx(
              "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium shadow-sm transition",
              isActive("/open-jobs")
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
            title="Browse Open Jobs"
          >
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Open Jobs</span>

            {/* Badge */}
            {badgeCount > 0 ? (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-100 px-1.5 text-[11px] font-semibold text-emerald-700">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            ) : null}
          </button>
        ) : null}

        {loading ? (
          <div className="text-sm text-slate-500">Loading…</div>
        ) : user ? (
          <>
          // inside the return() right side, add:
<Link
  to="/open-jobs"
  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
>
  Open Jobs
</Link>

            <div className="hidden sm:block text-xs text-slate-500">
              {user.email}
            </div>
            <button
              onClick={onSignOut}
              className="text-sm text-slate-700 hover:underline"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link to="/login" className="text-sm text-slate-700 hover:underline">
            Login
          </Link>
        )}
      </div>
    </div>
  );
}
