import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import AddApplicationModal from "../components/AddApplicationModal";
import {
  FileText,
  CalendarCheck,
  DollarSign,
  BarChart3,
  Clock,
  ExternalLink,
  Briefcase,
  Plus,
  Sparkles,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/authprovider";

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  theme,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  theme: {
    rail: string;
    iconBg: string;
    iconText: string;
    glow: string;
  };
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        "transition hover:shadow-md"
      )}
    >
      {/* left color rail */}
      <div className={cx("absolute inset-y-0 left-0 w-1.5", theme.rail)} />

      {/* soft glow */}
      <div
        className={cx(
          "pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-30",
          theme.glow
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">{title}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </div>
          {subtitle ? (
            <div className="mt-2 text-sm text-slate-500">{subtitle}</div>
          ) : null}
        </div>

        <div
          className={cx(
            "flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 shadow-sm",
            theme.iconBg,
            theme.iconText
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Column({
  title,
  count,
  theme,
  children,
}: {
  title: string;
  count: number;
  theme: {
    headerBg: string;
    dot: string;
    badgeBg: string;
    badgeText: string;
  };
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={cx("px-4 py-3", theme.headerBg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cx("h-2.5 w-2.5 rounded-full", theme.dot)} />
            <span className="text-sm font-semibold text-slate-900">{title}</span>
          </div>

          <span
            className={cx(
              "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold",
              theme.badgeBg,
              theme.badgeText
            )}
          >
            {count}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

function MiniCard({
  role,
  company,
  dateLabel,
  footer,
  theme,
  onClick,
}: {
  role: string;
  company: string;
  dateLabel?: string;
  footer?: React.ReactNode;
  theme: {
    avatarBg: string;
    avatarText: string;
    borderAccent: string;
  };
  onClick?: () => void;
}) {
  const initial = (company || "?").trim().charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full text-left rounded-2xl border bg-white p-4 shadow-sm transition",
        "hover:shadow-md hover:-translate-y-[1px]",
        theme.borderAccent
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
              theme.avatarBg,
              theme.avatarText
            )}
          >
            {initial}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">
              {role}
            </div>
            <div className="mt-0.5 truncate text-xs text-slate-500">
              {company}
            </div>
          </div>
        </div>

        {dateLabel ? (
          <div className="text-xs text-slate-400 whitespace-nowrap">
            {dateLabel}
          </div>
        ) : null}
      </div>

      {footer ? <div className="mt-3">{footer}</div> : null}
    </button>
  );
}

/** ---------- Types ---------- */
type AppRow = {
  id: string;
  user_id: string;
  company: string;
  role: string;
  status: "SAVED" | "APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED";
  archived: boolean;
  created_at: string;
  updated_at?: string | null;
};

type ReminderRow = {
  id: string;
  user_id: string;
  application_id: string | null;
  message: string | null;
  remind_at: string;
  completed: boolean;
};

type OpenJobRow = {
  id: string;
  source: string;
  company: string;
  role: string;
  location: string | null;
  job_url: string;
  date_posted: string | null;
  created_at: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);

  const appsQuery = useQuery({
    queryKey: ["applications", "dashboard", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as AppRow[];
    },
  });

  const remindersQuery = useQuery({
    queryKey: ["reminders", "all", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user!.id)
        .order("remind_at", { ascending: true });

      if (error) throw error;
      return (data || []) as ReminderRow[];
    },
  });

  const openJobsQuery = useQuery({
    queryKey: ["open_jobs", "dashboard_feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("open_jobs")
        .select("*")
        .order("date_posted", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return (data || []) as OpenJobRow[];
    },
    staleTime: 60_000,
  });

  const allApps = appsQuery.data || [];
  const reminders = remindersQuery.data || [];

  const getAppsByStatus = (status: AppRow["status"]) =>
    allApps.filter((a) => a.status === status && !a.archived);

  const saved = getAppsByStatus("SAVED");
  const applied = getAppsByStatus("APPLIED");
  const interview = getAppsByStatus("INTERVIEW");
  const offer = getAppsByStatus("OFFER");

  const totalApplications = allApps.filter((a) => !a.archived).length;
  const interviewsCount = interview.length;
  const offersCount = offer.length;

  const reminderTotal = reminders.length;
  const reminderDone = reminders.filter((r) => r.completed).length;
  const reminderRate =
    reminderTotal > 0 ? Math.round((reminderDone / reminderTotal) * 100) : 0;

  const dueReminders = reminders
    .filter((r) => !r.completed)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()
    )
    .slice(0, 5);

  const formatReminderDate = (d: string) => {
    const date = new Date(d);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const reminderChip = (d: string) => {
    const date = new Date(d);
    const overdue = isPast(date) && !isToday(date);
    return (
      <span
        className={cx(
          "inline-flex items-center gap-2 rounded-xl border px-2.5 py-1 text-xs font-semibold",
          overdue
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-indigo-200 bg-indigo-50 text-indigo-700"
        )}
      >
        <Clock className="h-3.5 w-3.5" />
        {overdue
          ? `Overdue • ${formatReminderDate(d)}`
          : `Follow-up • ${formatReminderDate(d)}`}
      </span>
    );
  };

  const openJobs = openJobsQuery.data ?? [];

  const handleAddFromOpenJob = (job: OpenJobRow) => {
    navigate("/applications/new", {
      state: {
        prefillJob: {
          company: job.company,
          role: job.role,
          location: job.location ?? "",
          jobUrl: job.job_url,
          datePosted: job.date_posted ?? job.created_at,
        },
      },
    });
  };

  /** ---------- Themes (where the “pop” comes from) ---------- */
  const statThemes = {
    apps: {
      rail: "bg-blue-600",
      iconBg: "bg-blue-50",
      iconText: "text-blue-700",
      glow: "bg-blue-400",
    },
    interviews: {
      rail: "bg-violet-600",
      iconBg: "bg-violet-50",
      iconText: "text-violet-700",
      glow: "bg-violet-400",
    },
    offers: {
      rail: "bg-emerald-600",
      iconBg: "bg-emerald-50",
      iconText: "text-emerald-700",
      glow: "bg-emerald-400",
    },
    reminder: {
      rail: "bg-amber-500",
      iconBg: "bg-amber-50",
      iconText: "text-amber-700",
      glow: "bg-amber-300",
    },
  } as const;

  const colThemes = {
    saved: {
      headerBg: "bg-slate-50",
      dot: "bg-slate-400",
      badgeBg: "bg-slate-200/60",
      badgeText: "text-slate-700",
    },
    applied: {
      headerBg: "bg-blue-50/70",
      dot: "bg-blue-600",
      badgeBg: "bg-blue-100",
      badgeText: "text-blue-700",
    },
    interview: {
      headerBg: "bg-violet-50/70",
      dot: "bg-violet-600",
      badgeBg: "bg-violet-100",
      badgeText: "text-violet-700",
    },
    offer: {
      headerBg: "bg-emerald-50/70",
      dot: "bg-emerald-600",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-700",
    },
  } as const;

  const cardThemes = {
    saved: {
      avatarBg: "bg-slate-100",
      avatarText: "text-slate-700",
      borderAccent: "border-slate-200 hover:border-slate-300",
    },
    applied: {
      avatarBg: "bg-blue-50",
      avatarText: "text-blue-700",
      borderAccent:
        "border-slate-200 hover:border-blue-200 shadow-blue-100/40",
    },
    interview: {
      avatarBg: "bg-violet-50",
      avatarText: "text-violet-700",
      borderAccent:
        "border-slate-200 hover:border-violet-200 shadow-violet-100/40",
    },
    offer: {
      avatarBg: "bg-emerald-50",
      avatarText: "text-emerald-700",
      borderAccent:
        "border-slate-200 hover:border-emerald-200 shadow-emerald-100/40",
    },
  } as const;

  return (
    <div className="relative">
      {/* Page background (subtle but adds “premium”) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-white" />
        <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute top-10 right-0 h-72 w-[32rem] rounded-full bg-violet-200/25 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-[36rem] rounded-full bg-emerald-200/20 blur-3xl" />
      </div>

      <div className="space-y-6">
        {/* Header row (optional small “sparkle” accent) */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Dashboard
          </div>

          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Application
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Applications"
            value={totalApplications}
            subtitle="Across your tracker"
            icon={FileText}
            theme={statThemes.apps}
          />
          <StatCard
            title="Interviews"
            value={interviewsCount}
            subtitle="In progress"
            icon={CalendarCheck}
            theme={statThemes.interviews}
          />
          <StatCard
            title="Offers"
            value={offersCount}
            subtitle={offersCount > 0 ? "Nice." : "Keep going"}
            icon={DollarSign}
            theme={statThemes.offers}
          />
          <StatCard
            title="Reminder Completion"
            value={`${reminderRate}%`}
            subtitle={`${reminderDone} of ${reminderTotal} done`}
            icon={BarChart3}
            theme={statThemes.reminder}
          />
        </div>

        {/* View toggle + actions */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <button className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm">
              Kanban View
            </button>
            <Link
              to="/applications"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              List View
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["applications", "dashboard", user?.id],
                })
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Kanban mini columns */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <Column title="Saved" count={saved.length} theme={colThemes.saved}>
            {saved.slice(0, 3).map((app) => (
              <MiniCard
                key={app.id}
                role={app.role}
                company={app.company}
                dateLabel={
                  app.updated_at
                    ? format(new Date(app.updated_at), "MMM d")
                    : format(new Date(app.created_at), "MMM d")
                }
                theme={cardThemes.saved}
                onClick={() => navigate(`/applications/${app.id}`)}
              />
            ))}
            {saved.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                No saved jobs yet.
              </div>
            ) : null}
          </Column>

          <Column title="Applied" count={applied.length} theme={colThemes.applied}>
            {applied.slice(0, 3).map((app) => (
              <MiniCard
                key={app.id}
                role={app.role}
                company={app.company}
                dateLabel={format(new Date(app.created_at), "MMM d")}
                theme={cardThemes.applied}
                onClick={() => navigate(`/applications/${app.id}`)}
                footer={
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-700">
                      Applied
                    </span>
                    <span className="text-xs text-slate-400" />
                  </div>
                }
              />
            ))}
            {applied.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                Add your first application.
              </div>
            ) : null}
          </Column>

          <Column
            title="Interview"
            count={interview.length}
            theme={colThemes.interview}
          >
            {interview.slice(0, 3).map((app) => {
              const reminder = reminders.find(
                (r) => r.application_id === app.id && !r.completed
              );

              return (
                <MiniCard
                  key={app.id}
                  role={app.role}
                  company={app.company}
                  dateLabel={format(new Date(app.created_at), "MMM d")}
                  theme={cardThemes.interview}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  footer={reminder ? reminderChip(reminder.remind_at) : undefined}
                />
              );
            })}

            {interview.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                No interviews scheduled.
              </div>
            ) : null}
          </Column>

          <Column title="Offer" count={offer.length} theme={colThemes.offer}>
            {offer.slice(0, 3).map((app) => (
              <MiniCard
                key={app.id}
                role={app.role}
                company={app.company}
                dateLabel={format(new Date(app.created_at), "MMM d")}
                theme={cardThemes.offer}
                onClick={() => navigate(`/applications/${app.id}`)}
                footer={
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700">
                      Offer
                    </span>
                    <span className="text-xs text-slate-400">Congrats 🎉</span>
                  </div>
                }
              />
            ))}

            {offer.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                No offers yet.
              </div>
            ) : null}
          </Column>
        </div>

        {/* Open Jobs Widget */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 border border-blue-100">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-slate-900">
                    Open Jobs Feed
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    Live
                  </span>
                </div>
                <div className="mt-0.5 text-sm text-slate-500">
                  Pulled from your shared feed (Supabase `open_jobs`)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["open_jobs", "dashboard_feed"],
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Refresh
              </button>
              <Link
                to="/open-jobs"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
              >
                View all
              </Link>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {openJobsQuery.isLoading ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Loading open jobs…
              </div>
            ) : openJobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No open jobs available yet.
              </div>
            ) : (
              openJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between hover:shadow-sm transition"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {job.role}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 truncate">
                      {job.company}
                      {job.location ? ` • ${job.location}` : ""}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {job.date_posted
                        ? `Posted ${format(new Date(job.date_posted), "MMM d")}`
                        : `Added ${format(new Date(job.created_at), "MMM d")}`}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddFromOpenJob(job)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                      title="Add to your Applications (prefill)"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>

                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                      title="Open external job link"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Apply
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Reminders section */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Upcoming reminders
              </div>
              <div className="mt-1 text-sm text-slate-500">
                Next items you’ll likely act on
              </div>
            </div>
            <Link
              to="/applications"
              className="text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {dueReminders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No reminders due.
              </div>
            ) : null}

            {dueReminders.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:shadow-sm transition"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">
                    {r.message || "Follow-up"}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {reminderChip(r.remind_at)}

                    {r.application_id ? (
                      <button
                        onClick={() => navigate(`/applications/${r.application_id}`)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        title="Open application"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-500">
                  {formatReminderDate(r.remind_at)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <AddApplicationModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            queryClient.invalidateQueries({
              queryKey: ["applications", "dashboard", user?.id],
            });
          }}
        />
      </div>
    </div>
  );
}
