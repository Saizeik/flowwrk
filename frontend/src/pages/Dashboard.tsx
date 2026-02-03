import React, { useState } from "react";
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
} from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/authprovider";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  badgeColor,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
}) {
  const Icon = icon;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">{title}</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {value}
          </div>
          {subtitle ? (
            <div className="mt-2 text-sm text-slate-500">{subtitle}</div>
          ) : null}
        </div>
        <div
          className={cx(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            badgeColor
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
  dot,
  children,
}: {
  title: string;
  count: number;
  dot: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-[280px] rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cx("h-2 w-2 rounded-full", dot)} />
          <span className="text-sm font-semibold text-slate-900">{title}</span>
        </div>
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-medium text-slate-600">
          {count}
        </span>
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
  accent,
  onClick,
}: {
  role: string;
  company: string;
  dateLabel?: string;
  footer?: React.ReactNode;
  accent: string;
  onClick?: () => void;
}) {
  const initial = (company || "?").trim().charAt(0).toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cx(
              "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold",
              accent
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
          <div className="text-xs text-slate-400">{dateLabel}</div>
        ) : null}
      </div>
      {footer ? <div className="mt-3">{footer}</div> : null}
    </button>
  );
}

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

  // ✅ Open jobs feed (top 6 newest)
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

  const reminderPill = (d: string) => {
    const date = new Date(d);
    const overdue = isPast(date) && !isToday(date);
    return (
      <span
        className={cx(
          "inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-medium",
          overdue ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-600"
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Applications"
          value={totalApplications}
          subtitle="Across your tracker"
          icon={FileText}
          badgeColor="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="Interviews"
          value={interviewsCount}
          subtitle="In progress"
          icon={CalendarCheck}
          badgeColor="bg-violet-50 text-violet-700"
        />
        <StatCard
          title="Offers"
          value={offersCount}
          subtitle={offersCount > 0 ? "Nice." : "Keep going"}
          icon={DollarSign}
          badgeColor="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Reminder Completion"
          value={`${reminderRate}%`}
          subtitle={`${reminderDone} of ${reminderTotal} done`}
          icon={BarChart3}
          badgeColor="bg-amber-50 text-amber-700"
        />
      </div>

      {/* View toggle + actions */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
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
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
          >
            + Add Application
          </button>
        </div>
      </div>

      {/* Kanban mini columns */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <Column title="Saved" count={saved.length} dot="bg-slate-400">
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
              accent="bg-slate-100 text-slate-700"
              onClick={() => navigate(`/applications/${app.id}`)}
            />
          ))}
          {saved.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No saved jobs yet.
            </div>
          ) : null}
        </Column>

        <Column title="Applied" count={applied.length} dot="bg-blue-600">
          {applied.slice(0, 3).map((app) => (
            <MiniCard
              key={app.id}
              role={app.role}
              company={app.company}
              dateLabel={format(new Date(app.created_at), "MMM d")}
              accent="bg-rose-50 text-rose-700"
              onClick={() => navigate(`/applications/${app.id}`)}
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Applied</span>
                  <span className="text-xs text-slate-400" />
                </div>
              }
            />
          ))}
          {applied.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Add your first application.
            </div>
          ) : null}
        </Column>

        <Column title="Interview" count={interview.length} dot="bg-violet-600">
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
                accent="bg-violet-50 text-violet-700"
                onClick={() => navigate(`/applications/${app.id}`)}
                footer={reminder ? reminderPill(reminder.remind_at) : undefined}
              />
            );
          })}
          {interview.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No interviews scheduled.
            </div>
          ) : null}
        </Column>

        <Column title="Offer" count={offer.length} dot="bg-emerald-600">
          {offer.slice(0, 3).map((app) => (
            <MiniCard
              key={app.id}
              role={app.role}
              company={app.company}
              dateLabel={format(new Date(app.created_at), "MMM d")}
              accent="bg-amber-50 text-amber-700"
              onClick={() => navigate(`/applications/${app.id}`)}
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-700">Offer</span>
                  <span className="text-xs text-slate-400">Congrats 🎉</span>
                </div>
              }
            />
          ))}
          {offer.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No offers yet.
            </div>
          ) : null}
        </Column>
      </div>

      {/* ✅ Open Jobs Widget */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Open Jobs Feed
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
              No open jobs available yet. Once your Edge Function runs, jobs will
              show up here.
            </div>
          ) : (
            openJobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
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
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
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

      {/* Reminders section (unchanged) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Upcoming reminders
            </div>
            <div className="mt-1 text-sm text-slate-500">
              (Reminders table required — optional)
            </div>
          </div>
          <Link
            to="/applications"
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
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
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                  {r.message || "Follow-up"}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{formatReminderDate(r.remind_at)}</span>
                  {r.application_id ? (
                    <button
                      onClick={() => navigate(`/applications/${r.application_id}`)}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 font-medium text-slate-600 hover:bg-slate-100"
                      title="Open application"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </button>
                  ) : null}
                </div>
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
  );
}
