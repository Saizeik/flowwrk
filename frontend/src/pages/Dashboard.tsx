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
  Plus,
  Sparkles,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/authprovider";

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

/** ---------- Visual tokens (keeps colors consistent) ---------- */
type Tone = "blue" | "violet" | "emerald" | "amber" | "slate" | "rose";

const tone = (t: Tone) => {
  switch (t) {
    case "blue":
      return {
        ring: "ring-blue-500/10",
        border: "border-blue-200/60",
        bg: "bg-gradient-to-br from-blue-50 via-white to-white",
        icon: "bg-blue-600 text-white",
        chip: "bg-blue-50 text-blue-700",
        accent: "from-blue-500/15 via-transparent to-transparent",
        leftBar: "bg-blue-600",
      };
    case "violet":
      return {
        ring: "ring-violet-500/10",
        border: "border-violet-200/60",
        bg: "bg-gradient-to-br from-violet-50 via-white to-white",
        icon: "bg-violet-600 text-white",
        chip: "bg-violet-50 text-violet-700",
        accent: "from-violet-500/15 via-transparent to-transparent",
        leftBar: "bg-violet-600",
      };
    case "emerald":
      return {
        ring: "ring-emerald-500/10",
        border: "border-emerald-200/60",
        bg: "bg-gradient-to-br from-emerald-50 via-white to-white",
        icon: "bg-emerald-600 text-white",
        chip: "bg-emerald-50 text-emerald-700",
        accent: "from-emerald-500/15 via-transparent to-transparent",
        leftBar: "bg-emerald-600",
      };
    case "amber":
      return {
        ring: "ring-amber-500/10",
        border: "border-amber-200/60",
        bg: "bg-gradient-to-br from-amber-50 via-white to-white",
        icon: "bg-amber-600 text-white",
        chip: "bg-amber-50 text-amber-700",
        accent: "from-amber-500/15 via-transparent to-transparent",
        leftBar: "bg-amber-600",
      };
    case "rose":
      return {
        ring: "ring-rose-500/10",
        border: "border-rose-200/60",
        bg: "bg-gradient-to-br from-rose-50 via-white to-white",
        icon: "bg-rose-600 text-white",
        chip: "bg-rose-50 text-rose-700",
        accent: "from-rose-500/15 via-transparent to-transparent",
        leftBar: "bg-rose-600",
      };
    case "slate":
    default:
      return {
        ring: "ring-slate-500/10",
        border: "border-slate-200/70",
        bg: "bg-gradient-to-br from-slate-50 via-white to-white",
        icon: "bg-slate-900 text-white",
        chip: "bg-slate-100 text-slate-700",
        accent: "from-slate-500/10 via-transparent to-transparent",
        leftBar: "bg-slate-400",
      };
  }
};

function StatCard({
  title,
  value,
  subtitle,
  icon,
  toneKey,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  toneKey: Tone;
}) {
  const Icon = icon;
  const t = tone(toneKey);

  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl border p-5 shadow-sm",
        "transition hover:-translate-y-[1px] hover:shadow-md",
        "ring-1",
        t.border,
        t.ring,
        t.bg
      )}
    >
      {/* Soft accent wash */}
      <div
        className={cx(
          "pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full blur-2xl",
          "bg-gradient-to-br",
          t.accent
        )}
      />
      {/* Subtle diagonal shine */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.8),transparent_55%)]" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-600">{title}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </div>
          {subtitle ? (
            <div className="mt-2 text-sm text-slate-500">{subtitle}</div>
          ) : null}
        </div>

        <div className={cx("flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm", t.icon)}>
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
  toneKey,
  children,
}: {
  title: string;
  count: number;
  dot: string;
  toneKey: Tone;
  children: React.ReactNode;
}) {
  const t = tone(toneKey);
  return (
    <div
      className={cx(
        "min-w-[290px] snap-start overflow-hidden rounded-2xl border shadow-sm",
        "bg-white",
        t.border
      )}
    >
      {/* Tinted header strip */}
      <div className={cx("border-b px-4 py-3", t.border, t.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cx("h-2 w-2 rounded-full", dot)} />
            <span className="text-sm font-semibold text-slate-900">{title}</span>
          </div>
          <span className={cx("inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-medium", t.chip)}>
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
  toneKey,
  onClick,
}: {
  role: string;
  company: string;
  dateLabel?: string;
  footer?: React.ReactNode;
  toneKey: Tone;
  onClick?: () => void;
}) {
  const t = tone(toneKey);
  const initial = (company || "?").trim().charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group relative w-full overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm",
        "transition hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/25",
        t.border
      )}
    >
      {/* Left accent bar */}
      <span className={cx("absolute left-0 top-0 h-full w-1", t.leftBar)} />
      {/* Subtle gradient wash on hover */}
      <span className={cx("pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100", t.bg)} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold shadow-sm",
              t.chip
            )}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{role}</div>
            <div className="mt-0.5 truncate text-xs text-slate-500">{company}</div>
          </div>
        </div>

        {dateLabel ? (
          <div className="shrink-0 text-xs text-slate-400">{dateLabel}</div>
        ) : null}
      </div>

      {footer ? <div className="relative mt-3">{footer}</div> : null}
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

  const dueReminders = useMemo(() => {
    return reminders
      .filter((r) => !r.completed)
      .slice()
      .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime())
      .slice(0, 5);
  }, [reminders]);

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
          "inline-flex items-center gap-2 rounded-xl px-2.5 py-1 text-xs font-medium",
          overdue
            ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60"
            : "bg-slate-50 text-slate-700 ring-1 ring-slate-200/70"
        )}
      >
        <Clock className="h-3.5 w-3.5" />
        {overdue ? `Overdue • ${formatReminderDate(d)}` : `Follow-up • ${formatReminderDate(d)}`}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Subtle colorful backdrop (very light) */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute right-0 top-8 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute left-24 bottom-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Applications"
            value={totalApplications}
            subtitle="Across your tracker"
            icon={FileText}
            toneKey="blue"
          />
          <StatCard
            title="Interviews"
            value={interviewsCount}
            subtitle="In progress"
            icon={CalendarCheck}
            toneKey="violet"
          />
          <StatCard
            title="Offers"
            value={offersCount}
            subtitle={offersCount > 0 ? "Nice." : "Keep going"}
            icon={DollarSign}
            toneKey="emerald"
          />
          <StatCard
            title="Reminder Completion"
            value={`${reminderRate}%`}
            subtitle={`${reminderDone} of ${reminderTotal} done`}
            icon={BarChart3}
            toneKey="amber"
          />
        </div>
      </div>

      {/* View toggle + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur sm:w-auto">
          <button className="flex-1 rounded-xl bg-gradient-to-b from-blue-50 to-white px-3 py-2 text-sm font-medium text-blue-700 ring-1 ring-blue-200/50 sm:flex-none">
            Kanban View
          </button>
          <Link
            to="/applications"
            className="flex-1 rounded-xl px-3 py-2 text-center text-sm font-medium text-slate-600 hover:bg-slate-50 sm:flex-none"
          >
            List View
          </Link>
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className={cx(
            "inline-flex w-full items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-white shadow-sm sm:w-auto",
            "bg-gradient-to-b from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700"
          )}
        >
          <Plus className="h-4 w-4" />
          Add Application
        </button>
      </div>

      {/* Kanban mini columns */}
      <div
        className={cx(
          "flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory",
          "-mx-4 px-4 sm:mx-0 sm:px-0",
          "overscroll-x-contain",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        <Column title="Saved" count={saved.length} dot="bg-slate-400" toneKey="slate">
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
              toneKey="slate"
              onClick={() => navigate(`/applications/${app.id}`)}
            />
          ))}
          {saved.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
              No saved jobs yet.
            </div>
          ) : null}
        </Column>

        <Column title="Applied" count={applied.length} dot="bg-blue-600" toneKey="blue">
          {applied.slice(0, 3).map((app) => (
            <MiniCard
              key={app.id}
              role={app.role}
              company={app.company}
              dateLabel={format(new Date(app.created_at), "MMM d")}
              toneKey="blue"
              onClick={() => navigate(`/applications/${app.id}`)}
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Applied</span>
                  <span className="text-xs text-slate-400" />
                </div>
              }
            />
          ))}
          {applied.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
              Add your first application.
            </div>
          ) : null}
        </Column>

        <Column title="Interview" count={interview.length} dot="bg-violet-600" toneKey="violet">
          {interview.slice(0, 3).map((app) => {
            const reminder = reminders.find((r) => r.application_id === app.id && !r.completed);
            return (
              <MiniCard
                key={app.id}
                role={app.role}
                company={app.company}
                dateLabel={format(new Date(app.created_at), "MMM d")}
                toneKey="violet"
                onClick={() => navigate(`/applications/${app.id}`)}
                footer={reminder ? reminderPill(reminder.remind_at) : undefined}
              />
            );
          })}
          {interview.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
              No interviews scheduled.
            </div>
          ) : null}
        </Column>

        <Column title="Offer" count={offer.length} dot="bg-emerald-600" toneKey="emerald">
          {offer.slice(0, 3).map((app) => (
            <MiniCard
              key={app.id}
              role={app.role}
              company={app.company}
              dateLabel={format(new Date(app.created_at), "MMM d")}
              toneKey="emerald"
              onClick={() => navigate(`/applications/${app.id}`)}
              footer={
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Offer
                  </span>
                  <span className="text-xs text-slate-500">Congrats 🎉</span>
                </div>
              }
            />
          ))}
          {offer.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
              No offers yet.
            </div>
          ) : null}
        </Column>
      </div>

      {/* Reminders */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Upcoming reminders</div>
            <div className="mt-1 text-sm text-slate-500">Your next follow-ups.</div>
          </div>
          <Link to="/applications" className="text-sm font-medium text-blue-700 hover:text-blue-800">
            View all
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {dueReminders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
              No reminders due.
            </div>
          ) : null}

          {dueReminders.map((r) => {
            const date = new Date(r.remind_at);
            const overdue = isPast(date) && !isToday(date);

            return (
              <div
                key={r.id}
                className={cx(
                  "flex flex-col gap-2 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                  overdue
                    ? "border-rose-200/70 bg-rose-50/40"
                    : "border-slate-200 bg-white"
                )}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">
                    {r.message || "Follow-up"}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className={cx(overdue && "text-rose-700 font-medium")}>
                      {formatReminderDate(r.remind_at)}
                    </span>

                    {r.application_id ? (
                      <button
                        onClick={() => navigate(`/applications/${r.application_id}`)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-2.5 py-1 font-medium text-slate-700 ring-1 ring-slate-200/70 hover:bg-slate-100"
                        title="Open application"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Optional right-side pill */}
                <div className="shrink-0">{reminderPill(r.remind_at)}</div>
              </div>
            );
          })}
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
