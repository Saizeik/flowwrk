import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import {
  Search,
  Filter,
  Minimize2,
  Maximize2,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

import { applicationsApi, type Application } from "../api";
import ApplicationCard from "../components/ApplicationCard";

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

type Tone = "slate" | "blue" | "violet" | "amber" | "emerald" | "rose";

const tone = (t: Tone) => {
  switch (t) {
    case "blue":
      return {
        header: "bg-gradient-to-br from-blue-50 via-white to-white",
        border: "border-blue-200/70",
        ring: "ring-blue-500/10",
        chip: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
        dot: "bg-blue-600",
        empty: "text-blue-700/70",
        drop: "bg-blue-50/50",
      };
    case "violet":
      return {
        header: "bg-gradient-to-br from-violet-50 via-white to-white",
        border: "border-violet-200/70",
        ring: "ring-violet-500/10",
        chip: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/60",
        dot: "bg-violet-600",
        empty: "text-violet-700/70",
        drop: "bg-violet-50/50",
      };
    case "amber":
      return {
        header: "bg-gradient-to-br from-amber-50 via-white to-white",
        border: "border-amber-200/70",
        ring: "ring-amber-500/10",
        chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
        dot: "bg-amber-600",
        empty: "text-amber-800/70",
        drop: "bg-amber-50/50",
      };
    case "emerald":
      return {
        header: "bg-gradient-to-br from-emerald-50 via-white to-white",
        border: "border-emerald-200/70",
        ring: "ring-emerald-500/10",
        chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
        dot: "bg-emerald-600",
        empty: "text-emerald-700/70",
        drop: "bg-emerald-50/50",
      };
    case "rose":
      return {
        header: "bg-gradient-to-br from-rose-50 via-white to-white",
        border: "border-rose-200/70",
        ring: "ring-rose-500/10",
        chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60",
        dot: "bg-rose-600",
        empty: "text-rose-700/70",
        drop: "bg-rose-50/50",
      };
    case "slate":
    default:
      return {
        header: "bg-gradient-to-br from-slate-50 via-white to-white",
        border: "border-slate-200/80",
        ring: "ring-slate-500/10",
        chip: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
        dot: "bg-slate-400",
        empty: "text-slate-500",
        drop: "bg-slate-50",
      };
  }
};

const STATUSES: Array<{
  id: Application["status"];
  label: string;
  toneKey: Tone;
}> = [
  { id: "SAVED", label: "Saved", toneKey: "slate" },
  { id: "APPLIED", label: "Applied", toneKey: "blue" },
  { id: "OA", label: "Online Assessment", toneKey: "violet" },
  { id: "INTERVIEW", label: "Interview", toneKey: "amber" },
  { id: "OFFER", label: "Offer", toneKey: "emerald" },
  { id: "REJECTED", label: "Rejected", toneKey: "rose" },
];

const ITEMS_PER_COLUMN = 5;

export default function Board() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeId, setActiveId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [compactView, setCompactView] = useState(true);

  // ✅ Your requested behavior
  const [showRejected, setShowRejected] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(
    STATUSES.reduce((acc, s) => ({ ...acc, [s.id]: ITEMS_PER_COLUMN }), {})
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data: apps = [], isLoading, error } = useQuery({
    queryKey: ["apps"],
    queryFn: async () => {
      const res = await applicationsApi.getAll({ page: 0, size: 2000 });
      return res.data.content;
    },
  });

  const filteredApplications = useMemo(() => {
    let filtered: Application[] = Array.isArray(apps) ? apps : [];

    // ✅ Archive filter (separate from rejected)
    if (!showArchived) {
      filtered = filtered.filter((a) => !a.archived);
    }

    // ✅ Rejected hidden by default
    if (!showRejected) {
      filtered = filtered.filter((a) => a.status !== "REJECTED");
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a) => {
        return (
          a.company?.toLowerCase().includes(q) ||
          a.role?.toLowerCase().includes(q) ||
          a.location?.toLowerCase().includes(q)
        );
      });
    }

    // Company filter
    if (companyFilter.trim()) {
      const q = companyFilter.toLowerCase();
      filtered = filtered.filter((a) => a.company?.toLowerCase().includes(q));
    }

    // Date range filter (uses dateApplied)
    if (dateRange !== "all") {
      const days = Number(dateRange);
      if (Number.isFinite(days) && days > 0) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((a) => {
          if (!a.dateApplied) return false;
          const d = new Date(a.dateApplied);
          return !Number.isNaN(d.getTime()) && d >= cutoff;
        });
      }
    }

    return filtered;
  }, [apps, showArchived, showRejected, searchQuery, companyFilter, dateRange]);

  const updateStatusMutation = useMutation({
    mutationFn: async (vars: { id: string; status: Application["status"] }) => {
      await applicationsApi.updateStatus(vars.id, vars.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const applicationId = String(active.id);
      const newStatus = String(over.id) as Application["status"];

      // optimistic update
      queryClient.setQueryData<Application[]>(["apps"], (old) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.map((a) =>
          a.id === applicationId ? { ...a, status: newStatus } : a
        );
      });

      updateStatusMutation.mutate({ id: applicationId, status: newStatus });
    }

    setActiveId(null);
  };

  const handleDragCancel = () => setActiveId(null);

  const getApplicationsByStatus = (status: Application["status"]) =>
    filteredApplications.filter((a) => a.status === status);

  const activeApplication = activeId
    ? filteredApplications.find((a) => a.id === activeId) ?? null
    : null;

  const loadMore = (statusId: string) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [statusId]: (prev[statusId] ?? ITEMS_PER_COLUMN) + ITEMS_PER_COLUMN,
    }));
  };

  if (isLoading) return <div className="text-sm text-slate-600">Loading...</div>;

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Failed to load applications.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* subtle backdrop glows */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-0 top-0 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute right-0 top-6 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute left-24 bottom-0 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Application Pipeline
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Drag and drop cards to update status.
            </p>
          </div>

          <button
            onClick={() => setCompactView((v) => !v)}
            className={cx(
              "inline-flex items-center gap-2 rounded-xl border bg-white/80 px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur",
              "border-slate-200 hover:bg-white"
            )}
          >
            {compactView ? (
              <>
                <Maximize2 className="h-4 w-4" />
                <span>Expanded View</span>
              </>
            ) : (
              <>
                <Minimize2 className="h-4 w-4" />
                <span>Compact View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search role, company, location…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cx(
                "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900",
                "placeholder:text-slate-400 shadow-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              )}
            />
          </div>

          <div className="relative md:col-span-2">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by company…"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className={cx(
                "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900",
                "placeholder:text-slate-400 shadow-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              )}
            />
          </div>

          <div className="md:col-span-1">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={cx(
                "w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none",
                "focus:ring-2 focus:ring-blue-600/20"
              )}
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>

          <div className="md:col-span-1 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <span className="text-sm font-medium text-slate-700">Results</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
              <Sparkles className="h-3.5 w-3.5" />
              {filteredApplications.length}
            </span>
          </div>
        </div>

        {/* toggles row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TogglePill
            on={showRejected}
            setOn={setShowRejected}
            labelOn="Showing Rejected"
            labelOff="Show Rejected"
          />
          <TogglePill
            on={showArchived}
            setOn={setShowArchived}
            labelOn="Showing Archived"
            labelOff="Show Archived"
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Horizontal Kanban */}
        <div
          className={cx(
            "flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory",
            "-mx-4 px-4 sm:mx-0 sm:px-0",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          {STATUSES.map((status) => (
            <Column
              key={status.id}
              status={status}
              applications={getApplicationsByStatus(status.id)}
              onCardClick={(id: string) => navigate(`/applications/${id}`)}
              compactView={compactView}
              visibleCount={visibleCounts[status.id]}
              onLoadMore={() => loadMore(status.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId && activeApplication ? (
            <ApplicationCard
              application={activeApplication}
              className="rotate-2 opacity-95"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function TogglePill({
  on,
  setOn,
  labelOn,
  labelOff,
}: {
  on: boolean;
  setOn: (v: boolean) => void;
  labelOn: string;
  labelOff: string;
}) {
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className={cx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
        on
          ? "bg-slate-900 text-white ring-slate-900"
          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
      )}
    >
      {on ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      {on ? labelOn : labelOff}
    </button>
  );
}

function Column({
  status,
  applications,
  onCardClick,
  compactView,
  visibleCount,
  onLoadMore,
}: {
  status: { id: string; label: string; toneKey: Tone };
  applications: Application[];
  onCardClick: (id: string) => void;
  compactView: boolean;
  visibleCount: number;
  onLoadMore: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });
  const t = tone(status.toneKey);

  const visibleApps = applications.slice(0, visibleCount);
  const hasMore = applications.length > visibleCount;

  return (
    <div
      className={cx(
        "w-[320px] min-w-[320px] snap-start overflow-hidden rounded-2xl border bg-white shadow-sm ring-1",
        t.border,
        t.ring
      )}
    >
      <div className={cx("border-b px-4 py-3", t.border, t.header)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cx("h-2.5 w-2.5 rounded-full", t.dot)} />
            <h3 className="text-sm font-semibold text-slate-900">{status.label}</h3>
          </div>
          <span
            className={cx(
              "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-medium",
              t.chip
            )}
          >
            {applications.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cx(
          "space-y-3 p-4 bg-slate-50/60 overflow-y-auto",
          compactView ? "max-h-[520px]" : "max-h-[760px]",
          isOver ? cx("ring-2 ring-inset", t.ring, t.drop) : null
        )}
      >
        {visibleApps.map((application) => (
          <DraggableCard
            key={application.id}
            application={application}
            onClick={() => onCardClick(application.id)}
            compactView={compactView}
          />
        ))}

        {applications.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
            <p className={cx("text-sm font-medium", t.empty)}>Drop cards here</p>
            <p className="mt-1 text-xs text-slate-500">
              Drag an application into this stage.
            </p>
          </div>
        )}

        {hasMore && (
          <button
            onClick={onLoadMore}
            className={cx(
              "w-full rounded-xl border bg-white px-3 py-2 text-sm font-medium shadow-sm",
              "border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            Load more{" "}
            <span className="text-slate-500">
              ({applications.length - visibleCount} remaining)
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  application,
  onClick,
  compactView,
}: {
  application: Application;
  onClick: () => void;
  compactView: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.6 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cx(isDragging && "cursor-grabbing")}
    >
      <ApplicationCard
        application={application}
        onClick={onClick}
        className={compactView ? "text-sm" : ""}
      />
    </div>
  );
}
