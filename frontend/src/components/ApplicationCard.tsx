import { MapPin, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import { Application } from "src/api";

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
  className?: string;
}

function companyInitial(company?: string) {
  const c = (company ?? "").trim();
  return c ? c[0].toUpperCase() : "?";
}

function formatSalaryRange(app: {
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: "YEAR" | "HOUR" | "MONTH" | "WEEK";
}) {
  const { salaryMin, salaryMax, salaryCurrency = "USD", salaryPeriod = "YEAR" } = app;
  if (!salaryMin && !salaryMax) return null;

  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`);

  const range =
    salaryMin && salaryMax ? `${fmt(salaryMin)} - ${fmt(salaryMax)}` :
    salaryMin ? `${fmt(salaryMin)}+` :
    salaryMax ? `Up to ${fmt(salaryMax)}` :
    null;

  const periodLabel =
    salaryPeriod === "HOUR" ? "/hr" :
    salaryPeriod === "MONTH" ? "/mo" :
    salaryPeriod === "WEEK" ? "/wk" :
    "/yr";

  return salaryCurrency === "USD"
    ? `${range} ${periodLabel}`
    : `${range} ${salaryCurrency} ${periodLabel}`;
}

export default function ApplicationCard({ application, onClick, className = "" }: ApplicationCardProps) {
  const salaryText = formatSalaryRange(application);

  return (
    <div
      onClick={onClick}
      className={[
        "group relative rounded-2xl border border-slate-200 bg-white p-4",
        "shadow-sm ring-1 ring-slate-500/5 transition-all duration-200 cursor-pointer",
        "hover:-translate-y-[1px] hover:shadow-md hover:border-slate-300",
        "active:translate-y-0 active:scale-[0.99]",
        className,
      ].join(" ")}
    >
      {/* top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          {/* avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white text-sm font-semibold shadow-sm">
            {companyInitial(application.company)}
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{application.role}</h3>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{application.company}</span>
            </div>
          </div>
        </div>

        <PriorityBadge priority={application.priority} />
      </div>

      {/* salary shimmer */}
      {salaryText && (
        <div className="mt-3">
          <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <div
              className="
                pointer-events-none absolute inset-0
                translate-x-[-60%]
                bg-gradient-to-r from-transparent via-white/50 to-transparent
                group-hover:animate-[shimmer_1.2s_ease-in-out_infinite]
              "
            />
            <div className="relative text-sm font-semibold text-emerald-700">
              {salaryText}
            </div>
          </div>
        </div>
      )}

      {/* meta */}
      <div className="mt-3 space-y-2">
        {application.location && (
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{application.location}</span>
          </div>
        )}

        {application.dateApplied && (
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{format(new Date(application.dateApplied), "MMM d, yyyy")}</span>
          </div>
        )}
      </div>

      <div className="mt-3">
        <StatusBadge status={application.status} />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-60%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
    </div>
  );
}
