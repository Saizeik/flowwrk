// src/pages/Applications.tsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Sparkles, Plus, Archive } from "lucide-react";
import { applicationsApi, type Application } from "../api";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import AddApplicationModal from "../components/AddApplicationModal";
import { useAuth } from "../providers/authprovider";

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_OPTIONS: Array<{ value: Application["status"] | "ALL"; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "SAVED", label: "Saved" },
  { value: "APPLIED", label: "Applied" },
  { value: "OA", label: "Online Assessment" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
];

export default function Applications() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { profile } = useAuth();

  const showArchivedApps = Boolean(profile?.showArchivedApps);

  const [addOpen, setAddOpen] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Application["status"] | "ALL">("ALL");
  const [dateRange, setDateRange] = useState<"all" | "7" | "30" | "90">("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["applications", "list"],
    queryFn: async () => {
      const res = await applicationsApi.getAll({ page: 0, size: 2000 });
      return res.data.content as Application[];
    },
    staleTime: 30_000,
  });

  const apps = data ?? [];

  const filtered = useMemo(() => {
    let arr = [...apps];

    if (!showArchivedApps) {
      arr = arr.filter((a) => !a.archived);
    }

    if (status !== "ALL") {
      arr = arr.filter((a) => a.status === status);
    }

    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter((a) => {
        return (
          a.company?.toLowerCase().includes(s) ||
          a.role?.toLowerCase().includes(s) ||
          a.location?.toLowerCase().includes(s)
        );
      });
    }

    if (dateRange !== "all") {
      const days = Number(dateRange);
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      arr = arr.filter((a) => {
        const d = new Date(a.updatedAt ?? a.createdAt);
        return !Number.isNaN(d.getTime()) && d >= cutoff;
      });
    }

    // newest first (updatedAt fallback createdAt)
    arr.sort((a, b) => {
      const da = new Date(a.updatedAt ?? a.createdAt).getTime();
      const db = new Date(b.updatedAt ?? b.createdAt).getTime();
      return db - da;
    });

    return arr;
  }, [apps, showArchivedApps, status, q, dateRange]);

  const totals = useMemo(() => {
    const open = apps.filter((a) => !a.archived);
    const by = (s: Application["status"]) => open.filter((a) => a.status === s).length;

    return {
      totalOpen: open.length,
      saved: by("SAVED"),
      applied: by("APPLIED"),
      interview: by("INTERVIEW") + by("OA"),
      offer: by("OFFER"),
      archived: apps.filter((a) => a.archived).length,
    };
  }, [apps]);

  return (
    <div className="space-y-6">
      {/* backdrop glow */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute right-0 top-6 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute left-24 bottom-0 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Applications
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Search, filter, and keep your pipeline moving.
            </p>
          </div>

          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Application
          </button>
        </div>
      </div>

      {/* stats chips */}
      <div className="flex flex-wrap gap-2">
        <Chip label="Open" value={totals.totalOpen} tone="blue" />
        <Chip label="Saved" value={totals.saved} tone="slate" />
        <Chip label="Applied" value={totals.applied} tone="violet" />
        <Chip label="Interview" value={totals.interview} tone="amber" />
        <Chip label="Offers" value={totals.offer} tone="emerald" />
        <Chip label="Archived" value={totals.archived} tone="rose" icon={<Archive className="h-3.5 w-3.5" />} />
      </div>

      {/* filters */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search role, company, location…"
              className={cx(
                "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm",
                "placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-600/20"
              )}
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className={cx(
                "w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm",
                "outline-none focus:ring-2 focus:ring-blue-600/20"
              )}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className={cx(
                "w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none",
                "focus:ring-2 focus:ring-blue-600/20"
              )}
            >
              <option value="all">All time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>

            <div className="hidden md:flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
              <span className="mr-2 text-sm font-medium text-slate-700">Results</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                <Sparkles className="h-3.5 w-3.5" />
                {filtered.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* list */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-3 text-sm text-slate-600">Loading applications…</p>
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Failed to load applications.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-700">No applications found.</p>
          <p className="mt-1 text-sm text-slate-500">
            Try clearing filters or add your first one.
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Application
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => navigate(`/applications/${app.id}`)}
              className={cx(
                "group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition",
                "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                      {(app.company?.trim()?.[0] ?? "?").toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {app.role}
                      </div>
                      <div className="mt-0.5 truncate text-sm text-slate-600">
                        {app.company}
                      </div>
                      {app.location ? (
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {app.location}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {app.archived ? (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                      <Archive className="h-3.5 w-3.5" />
                      Archived
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <StatusBadge status={app.status} />
                  <PriorityBadge priority={app.priority} />
                  <span className="text-xs text-slate-400">
                    Updated {new Date(app.updatedAt ?? app.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 h-px w-full bg-slate-100" />

              <div className="mt-3 flex items-center justify-between">
                <Link
                  to={`/applications/${app.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  Open details →
                </Link>

                <span className="text-xs text-slate-400 group-hover:text-slate-500">
                  Tap to open
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <AddApplicationModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ["applications", "list"] });
          qc.invalidateQueries({ queryKey: ["apps"] });
        }}
      />
    </div>
  );
}

function Chip({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "slate" | "blue" | "violet" | "amber" | "emerald" | "rose";
  icon?: React.ReactNode;
}) {
  const cls =
    tone === "blue"
      ? "bg-blue-50 text-blue-700 ring-blue-200/60"
      : tone === "violet"
      ? "bg-violet-50 text-violet-700 ring-violet-200/60"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700 ring-amber-200/60"
      : tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
      : tone === "rose"
      ? "bg-rose-50 text-rose-700 ring-rose-200/60"
      : "bg-slate-100 text-slate-700 ring-slate-200/80";

  return (
    <div className={cx("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1", cls)}>
      {icon ? icon : null}
      <span>{label}</span>
      <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold">{value}</span>
    </div>
  );
}
