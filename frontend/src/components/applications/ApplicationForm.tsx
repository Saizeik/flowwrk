import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Link as LinkIcon, AlertCircle } from "lucide-react";

// If you already have these types elsewhere, keep them there and remove duplicates.
// This file is designed to be a self-contained form component.
export type SalaryPeriod = "YEAR" | "HOUR" | "MONTH" | "WEEK";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Status = "SAVED" | "APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED";

export type ApplicationFormState = {
  company: string;
  role: string;
  location?: string;
  jobUrl?: string;
  dateApplied?: string;
  priority: Priority;
  status: Status;

  // ✅ Salary fields
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string; // default "USD"
  salaryPeriod?: SalaryPeriod; // default "YEAR"
};

export type ImportedData = {
  company?: string;
  role?: string;
  location?: string;
  jobUrl?: string;
  confidence?: "HIGH" | "MED" | "LOW";
  warnings?: string[];
};

// Optional badge - if you already have one in ImportJobModal, you can remove this and pass a ReactNode instead
function ConfidenceBadge({ confidence }: { confidence?: ImportedData["confidence"] }) {
  if (!confidence) return null;
  const cls =
    confidence === "HIGH"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : confidence === "MED"
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-rose-100 text-rose-800 border-rose-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {confidence}
    </span>
  );
}

function formatSalaryPreview(app: {
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: SalaryPeriod;
}) {
  const { salaryMin, salaryMax, salaryCurrency = "USD", salaryPeriod = "YEAR" } = app;
  if (!salaryMin && !salaryMax) return null;

  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`);

  const range =
    salaryMin && salaryMax
      ? `${fmt(salaryMin)} - ${fmt(salaryMax)}`
      : salaryMin
      ? `${fmt(salaryMin)}+`
      : salaryMax
      ? `Up to ${fmt(salaryMax)}`
      : null;

  const periodLabel =
    salaryPeriod === "HOUR" ? "/hr" : salaryPeriod === "MONTH" ? "/mo" : salaryPeriod === "WEEK" ? "/wk" : "/yr";

  return salaryCurrency === "USD" ? `${range} ${periodLabel}` : `${range} ${salaryCurrency} ${periodLabel}`;
}

type Props = {
  title: string;

  initial?: Partial<ApplicationFormState>;
  submitting?: boolean;
  submitError?: string | null;

  // ✅ your TS error fix: we now support onChange
  onChange?: (next: ApplicationFormState) => void;

  // Actions
  onSubmit: (payload: ApplicationFormState) => void;
  onCancel?: () => void;

  // Import URL UI
  onOpenImport?: () => void;
  importedData?: ImportedData | null;
};

export default function ApplicationForm({
  title,
  initial,
  submitting = false,
  submitError = null,
  onSubmit,
  onCancel,
  onChange,
  onOpenImport,
  importedData,
}: Props) {
  const defaultState: ApplicationFormState = useMemo(
    () => ({
      company: "",
      role: "",
      location: "",
      jobUrl: "",
      dateApplied: undefined,
      priority: "MEDIUM",
      status: "SAVED",
      salaryMin: undefined,
      salaryMax: undefined,
      salaryCurrency: "USD",
      salaryPeriod: "YEAR",
      ...(initial ?? {}),
    }),
    [initial]
  );

  const [form, setForm] = useState<ApplicationFormState>(defaultState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Keep internal state in sync if initial changes (prefill job, import success, etc)
  useEffect(() => {
    setForm(defaultState);
    onChange?.(defaultState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultState.company, defaultState.role, defaultState.location, defaultState.jobUrl]);

  const salaryPreview = formatSalaryPreview(form);

  const setAndNotify = (next: ApplicationFormState) => {
    setForm(next);
    onChange?.(next);
  };

  const validate = (data: ApplicationFormState) => {
    const nextErrors: Record<string, string> = {};
    if (!data.company?.trim()) nextErrors.company = "Company is required";
    if (!data.role?.trim()) nextErrors.role = "Role is required";

    if (data.salaryMin && data.salaryMin < 0) nextErrors.salaryMin = "Min salary must be >= 0";
    if (data.salaryMax && data.salaryMax < 0) nextErrors.salaryMax = "Max salary must be >= 0";
    if (data.salaryMin && data.salaryMax && data.salaryMax < data.salaryMin) {
      nextErrors.salaryMax = "Max salary must be >= Min salary";
    }

    return nextErrors;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(form);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 mt-1">Track the details so your pipeline stays clean.</p>
        </div>

        {onOpenImport && (
          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <LinkIcon className="h-4 w-4" />
            Import from URL
          </button>
        )}
      </div>

      {/* Imported banner */}
      {importedData && (
        <div className="px-6 pt-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-blue-900">Auto-imported from URL</p>
                <ConfidenceBadge confidence={importedData.confidence} />
              </div>
            </div>

            {!!importedData.warnings?.length && (
              <div className="mt-3 space-y-1">
                {importedData.warnings.map((w, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-yellow-900">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-blue-700 mt-3">Review and edit the fields below before saving.</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={submit} className="px-6 py-6 space-y-5">
        {/* Company */}
        <div>
          <label className="text-sm font-medium text-slate-700">Company</label>
          <input
            value={form.company}
            onChange={(e) => {
              const next = { ...form, company: e.target.value };
              setAndNotify(next);
              if (errors.company) setErrors((p) => ({ ...p, company: "" }));
            }}
            placeholder="Company"
            className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 ${
              errors.company ? "border-rose-400" : "border-slate-200"
            }`}
          />
          {errors.company && <p className="mt-1 text-sm text-rose-600">{errors.company}</p>}
        </div>

        {/* Role */}
        <div>
          <label className="text-sm font-medium text-slate-700">Role</label>
          <input
            value={form.role}
            onChange={(e) => {
              const next = { ...form, role: e.target.value };
              setAndNotify(next);
              if (errors.role) setErrors((p) => ({ ...p, role: "" }));
            }}
            placeholder="Role"
            className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 ${
              errors.role ? "border-rose-400" : "border-slate-200"
            }`}
          />
          {errors.role && <p className="mt-1 text-sm text-rose-600">{errors.role}</p>}
        </div>

        {/* Location + Job URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Location</label>
            <input
              value={form.location ?? ""}
              onChange={(e) => setAndNotify({ ...form, location: e.target.value })}
              placeholder="Location"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Job URL</label>
            <input
              value={form.jobUrl ?? ""}
              onChange={(e) => setAndNotify({ ...form, jobUrl: e.target.value })}
              placeholder="https://..."
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
        </div>

        {/* Priority + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setAndNotify({ ...form, priority: e.target.value as Priority })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Med</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setAndNotify({ ...form, status: e.target.value as Status })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="SAVED">Saved</option>
              <option value="APPLIED">Applied</option>
              <option value="OA">OA</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Date Applied */}
        <div>
          <label className="text-sm font-medium text-slate-700">Date Applied</label>
          <div className="mt-1">
          <DatePicker
  selected={form.dateApplied ? new Date(form.dateApplied) : null}
  onChange={(date: Date | null) =>
    setAndNotify({
      ...form,
      // store as YYYY-MM-DD to match Supabase date column
      dateApplied: date ? date.toISOString().slice(0, 10) : undefined,
    })
  }
  dateFormat="MMM d, yyyy"
  placeholderText="Select date"
  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
  wrapperClassName="w-full"
/>

          </div>
        </div>

        {/* Salary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Salary</p>
              <p className="text-xs text-slate-500 mt-0.5">Optional, but helps prioritize higher-value roles.</p>
            </div>

            {salaryPreview && (
              <div className="text-sm font-semibold text-emerald-700">{salaryPreview}</div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-medium text-slate-600">Min</label>
              <input
                type="number"
                inputMode="numeric"
                value={form.salaryMin ?? ""}
                onChange={(e) => {
                  const v = e.target.value === "" ? undefined : Number(e.target.value);
                  const next = { ...form, salaryMin: Number.isFinite(v as any) ? v : undefined };
                  setAndNotify(next);
                  if (errors.salaryMin) setErrors((p) => ({ ...p, salaryMin: "" }));
                }}
                placeholder="120000"
                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 ${
                  errors.salaryMin ? "border-rose-400" : "border-slate-200"
                }`}
              />
              {errors.salaryMin && <p className="mt-1 text-xs text-rose-600">{errors.salaryMin}</p>}
            </div>

            <div className="sm:col-span-1">
              <label className="text-xs font-medium text-slate-600">Max</label>
              <input
                type="number"
                inputMode="numeric"
                value={form.salaryMax ?? ""}
                onChange={(e) => {
                  const v = e.target.value === "" ? undefined : Number(e.target.value);
                  const next = { ...form, salaryMax: Number.isFinite(v as any) ? v : undefined };
                  setAndNotify(next);
                  if (errors.salaryMax) setErrors((p) => ({ ...p, salaryMax: "" }));
                }}
                placeholder="150000"
                className={`mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 ${
                  errors.salaryMax ? "border-rose-400" : "border-slate-200"
                }`}
              />
              {errors.salaryMax && <p className="mt-1 text-xs text-rose-600">{errors.salaryMax}</p>}
            </div>

            <div className="sm:col-span-1">
              <label className="text-xs font-medium text-slate-600">Period</label>
              <select
                value={form.salaryPeriod ?? "YEAR"}
                onChange={(e) => setAndNotify({ ...form, salaryPeriod: e.target.value as SalaryPeriod })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="YEAR">Year</option>
                <option value="MONTH">Month</option>
                <option value="WEEK">Week</option>
                <option value="HOUR">Hour</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="text-xs font-medium text-slate-600">Currency</label>
              <input
                value={form.salaryCurrency ?? "USD"}
                onChange={(e) => setAndNotify({ ...form, salaryCurrency: e.target.value || "USD" })}
                placeholder="USD"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        {submitError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
