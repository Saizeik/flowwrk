import { format, isToday, isYesterday } from "date-fns";
import { Activity } from "src/api";
import { Clock, CheckCircle2, Briefcase, Bell, XCircle } from "lucide-react";

interface ActivityTabProps {
  activities: Activity[];
  /** optional: cap list for performance */
  limit?: number;
}

function dayLabel(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

function activityIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("appl")) return CheckCircle2;
  if (t.includes("remind")) return Bell;
  if (t.includes("interview")) return Briefcase;
  if (t.includes("reject")) return XCircle;
  return Clock;
}

export default function ActivityTab({ activities, limit = 50 }: ActivityTabProps) {
  const sliced = activities.slice(0, limit);

  // group by day label
  const groups = sliced.reduce<Record<string, Activity[]>>((acc, a) => {
    const d = new Date(a.createdAt);
    const key = dayLabel(d);
    (acc[key] ||= []).push(a);
    return acc;
  }, {});

  const groupEntries = Object.entries(groups);

  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-slate-600 font-medium">No activity yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Activity will appear here when you add applications, update statuses, or complete reminders.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupEntries.map(([label, items]) => (
        <div key={label}>
          <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {label}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {items.map((activity) => {
                const Icon = activityIcon(activity.activityType);
                return (
                  <li key={activity.id} className="px-4 py-3 sm:px-5">
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          {activity.activityType}
                        </p>

                        {activity.message ? (
                          <p className="mt-0.5 text-sm text-slate-600">
                            {activity.message}
                          </p>
                        ) : null}

                        <p className="mt-1 text-xs text-slate-500">
                          {format(new Date(activity.createdAt), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ))}

      {activities.length > limit ? (
        <div className="text-center text-xs text-slate-500">
          Showing latest {limit} activities
        </div>
      ) : null}
    </div>
  );
}
