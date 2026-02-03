import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { subWeeks, eachWeekOfInterval, endOfWeek, format } from "date-fns";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Target, CheckCircle, Clock, Award } from "lucide-react";
import { applicationsApi, type Application } from "../api";

const STATUS_ORDER: Application["status"][] = [
  "SAVED",
  "APPLIED",
  "OA",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

const STATUS_LABELS: Record<Application["status"], string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  OA: "Online Assessment",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const STATUS_COLORS: Record<Application["status"], string> = {
  SAVED: "#B06645",
  APPLIED: "#3B82F6",
  OA: "#8B5CF6",
  INTERVIEW: "#EAB308",
  OFFER: "#10B981",
  REJECTED: "#EF4444",
};

function toDateSafe(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function Analytics() {
  /**
   * IMPORTANT: match the rest of the app
   * - queryKey is ["apps"]
   * - response shape is res.data.content
   */
  const { data: apps = [], isLoading, error } = useQuery<Application[]>({
    queryKey: ["apps"],
    queryFn: async () => {
      const res = await applicationsApi.getAll({ page: 0, size: 5000 });
      return res.data.content;
    },
  });

  const computed = useMemo(() => {
    const totalApps = Array.isArray(apps) ? apps.length : 0;
    const safeApps: Application[] = Array.isArray(apps) ? apps : [];

    // ===== Status distribution =====
    const statusCounts: Record<string, number> = {};
    for (const s of STATUS_ORDER) statusCounts[s] = 0;

    for (const app of safeApps) {
      const s = app?.status;
      if (s) statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    }

    const statusData = STATUS_ORDER.map((s) => ({
      status: s,
      name: STATUS_LABELS[s],
      value: statusCounts[s] ?? 0,
    })).filter((x) => x.value > 0);

    // ===== Applications per week (last 12 weeks) =====
    const twelveWeeksAgo = subWeeks(new Date(), 12);
    const weeks = eachWeekOfInterval({ start: twelveWeeksAgo, end: new Date() });

    const weeklyData = weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart);

      const count = safeApps.filter((app) => {
        const d = toDateSafe(app.dateApplied) ?? toDateSafe(app.createdAt);
        if (!d) return false;
        return d >= weekStart && d <= weekEnd;
      }).length;

      return {
        week: format(weekStart, "MMM d"),
        applications: count,
      };
    });

    // ===== Priority distribution =====
    const priorityCounts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    for (const app of safeApps) {
      const p = app.priority ?? "MEDIUM";
      priorityCounts[p] = (priorityCounts[p] ?? 0) + 1;
    }
    const priorityData = (["LOW", "MEDIUM", "HIGH"] as const).map((p) => ({
      name: p,
      value: priorityCounts[p] ?? 0,
    }));

    // ===== Conversion metrics =====
    const appliedCount = safeApps.filter((a) =>
      ["APPLIED", "OA", "INTERVIEW", "OFFER"].includes(a.status)
    ).length;

    const interviewedCount = safeApps.filter((a) =>
      ["INTERVIEW", "OFFER"].includes(a.status)
    ).length;

    const offerCount = safeApps.filter((a) => a.status === "OFFER").length;

    // Response Rate: got past APPLIED (OA/INTERVIEW/OFFER/REJECTED)
    const respondedApps = safeApps.filter((a) =>
      ["OA", "INTERVIEW", "OFFER", "REJECTED"].includes(a.status)
    ).length;

    const responseRate = totalApps > 0 ? Math.round((respondedApps / totalApps) * 100) : 0;

    // Avg time to offer: days between dateApplied (or createdAt) and now (simple)
    const offeredApps = safeApps.filter((a) => a.status === "OFFER");
    const avgTimeToOffer =
      offeredApps.length > 0
        ? Math.round(
            offeredApps.reduce((sum, a) => {
              const applied = toDateSafe(a.dateApplied) ?? toDateSafe(a.createdAt);
              if (!applied) return sum;
              const days = Math.floor(
                (Date.now() - applied.getTime()) / (1000 * 60 * 60 * 24)
              );
              return sum + Math.max(0, days);
            }, 0) / offeredApps.length
          )
        : 0;

    const interviewSuccessRate =
      interviewedCount > 0 ? Math.round((offerCount / interviewedCount) * 100) : 0;

    const interviewRate = appliedCount > 0 ? ((interviewedCount / appliedCount) * 100).toFixed(1) : "0";
    const offerRate = interviewedCount > 0 ? ((offerCount / interviewedCount) * 100).toFixed(1) : "0";
    const overallSuccessRate = appliedCount > 0 ? ((offerCount / appliedCount) * 100).toFixed(1) : "0";

    return {
      totalApps,
      appliedCount,
      interviewedCount,
      offerCount,
      respondedApps,
      responseRate,
      avgTimeToOffer,
      interviewSuccessRate,
      interviewRate,
      offerRate,
      overallSuccessRate,
      statusData,
      weeklyData,
      priorityData,
      statusCounts,
    };
  }, [apps]);

  if (isLoading) return <div className="text-sm text-slate-600">Loading...</div>;

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Failed to load analytics.
      </div>
    );
  }

  const stats = [
    { label: "Total Applications", value: computed.totalApps, icon: Target, color: "text-blue-600" },
    { label: "Applied+", value: computed.appliedCount, icon: TrendingUp, color: "text-indigo-600" },
    { label: "Interviewed", value: computed.interviewedCount, icon: TrendingUp, color: "text-yellow-600" },
    { label: "Offers", value: computed.offerCount, icon: CheckCircle, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Analytics</h1>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <stat.icon className={`h-10 w-10 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Key Performance Metrics */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="rounded-lg bg-slate-100 p-2">
                <Target className="h-5 w-5 text-slate-700" />
              </div>
              <span className="text-xs font-bold text-emerald-600">
                {computed.respondedApps > 0 ? "+" : ""}
                {computed.respondedApps}
              </span>
            </div>
            <div className="mb-1 text-3xl font-bold text-gray-900">{computed.responseRate}%</div>
            <div className="text-sm text-gray-600">Response Rate</div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="rounded-lg bg-slate-100 p-2">
                <Clock className="h-5 w-5 text-slate-700" />
              </div>
              <span className="text-xs font-bold text-emerald-600">
                {computed.avgTimeToOffer > 0 ? `~${computed.avgTimeToOffer}d` : "N/A"}
              </span>
            </div>
            <div className="mb-1 text-3xl font-bold text-gray-900">
              {computed.avgTimeToOffer > 0 ? `${computed.avgTimeToOffer} days` : "N/A"}
            </div>
            <div className="text-sm text-gray-600">Avg. Time to Offer</div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="rounded-lg bg-slate-100 p-2">
                <Award className="h-5 w-5 text-slate-700" />
              </div>
              <span className="text-xs font-bold text-emerald-600">
                {computed.offerCount > 0 ? "+" : ""}
                {computed.offerCount}
              </span>
            </div>
            <div className="mb-1 text-3xl font-bold text-gray-900">{computed.interviewSuccessRate}%</div>
            <div className="text-sm text-gray-600">Interview Success</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Applications Over Time */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Applications Per Week</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={computed.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="applications" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Status Distribution</h2>

            {computed.statusData.length === 0 ? (
              <div className="text-sm text-slate-600">No data yet. Add a few applications to see charts.</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={computed.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {computed.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Priority Distribution */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Priority Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={computed.priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Breakdown Table */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Status Breakdown</h2>

            {STATUS_ORDER.map((s) => {
              const value = computed.statusCounts[s] ?? 0;
              if (computed.totalApps === 0) {
                return (
                  <div key={s} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded" style={{ backgroundColor: STATUS_COLORS[s] }} />
                      <span className="text-sm text-gray-700">{STATUS_LABELS[s]}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">0</span>
                  </div>
                );
              }

              return (
                <div key={s} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: STATUS_COLORS[s] }} />
                    <span className="text-sm text-gray-700">{STATUS_LABELS[s]}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{value}</span>
                    <span className="text-xs text-gray-500">
                      ({((value / computed.totalApps) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optional quick-read conversion stats */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
          <div className="grid gap-2 sm:grid-cols-3">
            <div><span className="font-semibold">Applied → Interview:</span> {computed.interviewRate}%</div>
            <div><span className="font-semibold">Interview → Offer:</span> {computed.offerRate}%</div>
            <div><span className="font-semibold">Applied → Offer:</span> {computed.overallSuccessRate}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
