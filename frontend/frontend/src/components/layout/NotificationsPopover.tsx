import React, { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Bell, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { remindersApi, type Reminder } from "../../api";

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function useOnClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handler();
    };

    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

function urgency(remindAt: string) {
  const d = new Date(remindAt);
  if (isPast(d) && !isToday(d)) {
    return { label: "Overdue", pill: "bg-rose-500/15 text-rose-300 border-rose-500/30", icon: "text-rose-300" };
  }
  if (isToday(d)) {
    return { label: "Today", pill: "bg-orange-500/15 text-orange-200 border-orange-500/30", icon: "text-orange-200" };
  }
  if (isTomorrow(d)) {
    return { label: "Tomorrow", pill: "bg-yellow-500/15 text-yellow-200 border-yellow-500/30", icon: "text-yellow-200" };
  }
  return { label: "Upcoming", pill: "bg-indigo-500/15 text-indigo-200 border-indigo-500/30", icon: "text-indigo-200" };
}

type Props = {
  open: boolean;
  onClose: () => void;
  days?: number; // default 14
};

export default function NotificationsPopover({ open, onClose, days = 14 }: Props) {
  const qc = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(panelRef, () => {
    if (open) onClose();
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const upcomingQuery = useQuery({
    queryKey: ["reminders_upcoming", days],
    queryFn: () => remindersApi.getUpcoming({ days, includeOverdue: true, limit: 25 }),
    enabled: open, // only fetch when opened (fast + cached thereafter)
    staleTime: 60_000,
  });

  const reminders = useMemo(() => upcomingQuery.data?.data ?? [], [upcomingQuery.data]);

  const completeMut = useMutation({
    mutationFn: (id: string) => remindersApi.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders_upcoming", days] });
      // also refresh any per-app reminders lists, since completion affects them
      qc.invalidateQueries({ queryKey: ["reminders"] });
    },
  });

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
            <Bell className="h-4 w-4 text-white/80" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">Reminders</div>
            <div className="text-[11px] text-white/60">Next {days} days</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-white/70 hover:bg-white/5"
        >
          Close
        </button>
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-auto p-2">
        {upcomingQuery.isLoading ? (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading reminders…
          </div>
        ) : upcomingQuery.isError ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            Failed to load reminders.
          </div>
        ) : reminders.length === 0 ? (
          <div className="rounded-xl bg-white/5 p-4 text-sm text-white/70">
            No upcoming reminders.
          </div>
        ) : (
          <div className="space-y-2">
            {reminders.map((r: Reminder) => {
              const u = urgency(r.remindAt);
              const line1 =
                r.application?.company || r.application?.role
                  ? `${r.application?.company ?? "Unknown"} — ${r.application?.role ?? "Role"}`
                  : "Application";

              return (
                <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{line1}</div>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={cx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]", u.pill)}>
                          <Clock className={cx("h-3 w-3", u.icon)} />
                          {u.label}
                        </span>

                        <span className="text-[11px] text-white/60">
                          {format(new Date(r.remindAt), "MMM d • h:mm a")}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-white/80">{r.message}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => completeMut.mutate(r.id)}
                      disabled={completeMut.isPending}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-60"
                      title="Mark as done"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="text-[11px] text-white/50">
          Tip: “Done” hides it everywhere and keeps your pipeline clean.
        </div>
      </div>
    </div>
  );
}
