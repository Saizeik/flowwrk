import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { format, isPast, isToday, isTomorrow, addDays } from "date-fns";
import { remindersApi, type Reminder } from "../../api";

type Props = {
  applicationId: string;
};

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function urgencyStyles(remindAtIso: string) {
  const d = new Date(remindAtIso);
  const now = new Date();

  if (isPast(d) && d < now) {
    return { label: "OVERDUE", pill: "bg-rose-50 text-rose-800", border: "border-rose-500" };
  }
  if (isToday(d)) {
    return { label: "TODAY", pill: "bg-orange-50 text-orange-800", border: "border-orange-500" };
  }
  if (isTomorrow(d)) {
    return { label: "TOMORROW", pill: "bg-yellow-50 text-yellow-900", border: "border-yellow-500" };
  }
  return { label: "UPCOMING", pill: "bg-violet-50 text-violet-800", border: "border-violet-500" };
}

export default function RemindersTab({ applicationId }: Props) {
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ remindAtLocal: "", message: "" });

  const remindersQuery = useQuery({
    queryKey: ["reminders", applicationId],
    enabled: !!applicationId,
    queryFn: () => remindersApi.getByApp(applicationId),
    select: (res) => res.data as Reminder[],
  });

  const reminders = remindersQuery.data ?? [];

  const createMut = useMutation({
    mutationFn: async () => {
      if (!form.remindAtLocal) throw new Error("Pick a date/time");
      if (!form.message.trim()) throw new Error("Reminder message is required");

      // datetime-local => ISO
      const remindAtIso = new Date(form.remindAtLocal).toISOString();
      return remindersApi.create(applicationId, { remindAt: remindAtIso, message: form.message.trim() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders", applicationId] });
      setForm({ remindAtLocal: "", message: "" });
      setShowForm(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => remindersApi.delete(applicationId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders", applicationId] }),
  });

  const completeMut = useMutation({
    mutationFn: async (id: string) => remindersApi.complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders", applicationId] }),
  });

  const minLocal = useMemo(() => {
    // prevent picking past times
    return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  }, []);

  if (remindersQuery.isLoading) return <div className="text-sm text-slate-600">Loading reminders…</div>;

  if (remindersQuery.isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Failed to load reminders: {(remindersQuery.error as any)?.message ?? "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm((s) => !s)}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" />
        Add Reminder
      </button>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <input
            type="datetime-local"
            min={minLocal}
            value={form.remindAtLocal}
            onChange={(e) => setForm((f) => ({ ...f, remindAtLocal: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <textarea
            placeholder="Reminder message *"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {createMut.isError ? (
            <div className="text-sm text-rose-700">{(createMut.error as any)?.message ?? "Failed to save"}</div>
          ) : null}

          <div className="flex gap-2">
            <button
              onClick={() => createMut.mutate()}
              disabled={!form.message.trim() || !form.remindAtLocal || createMut.isPending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMut.isPending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {reminders.map((r) => {
          const u = urgencyStyles(r.remindAt);
          return (
            <div
              key={r.id}
              className={cx(
                "rounded-2xl border bg-white p-4 shadow-sm flex items-start justify-between gap-3",
                `border-l-4 ${u.border}`
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cx("text-[11px] font-bold px-2 py-1 rounded", u.pill)}>{u.label}</span>
                  <span className="text-sm text-slate-600">
                    {format(new Date(r.remindAt), "MMM d, yyyy h:mm a")}
                  </span>
                  {r.completed ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                      Completed
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-slate-900 font-medium">{r.message}</p>
              </div>

              <div className="flex items-center gap-2">
                {!r.completed ? (
                  <button
                    onClick={() => completeMut.mutate(r.id)}
                    disabled={completeMut.isPending}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    title="Mark complete"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Done
                  </button>
                ) : null}

                <button
                  onClick={() => deleteMut.mutate(r.id)}
                  disabled={deleteMut.isPending}
                  className="text-rose-600 hover:text-rose-700"
                  title="Delete reminder"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        {reminders.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No reminders yet</p>
        ) : null}
      </div>
    </div>
  );
}
