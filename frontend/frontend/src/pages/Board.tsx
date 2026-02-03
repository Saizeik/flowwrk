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
import { Search, Filter, Minimize2, Maximize2 } from "lucide-react";

import { applicationsApi, type Application } from "../api";
import ApplicationCard from "../components/ApplicationCard";
import { useAuth } from "../providers/authprovider";

const STATUSES: Array<{ id: Application["status"]; label: string; color: string }> = [
  { id: "SAVED", label: "Saved", color: "bg-gray-100" },
  { id: "APPLIED", label: "Applied", color: "bg-blue-100" },
  { id: "OA", label: "Online Assessment", color: "bg-purple-100" },
  { id: "INTERVIEW", label: "Interview", color: "bg-yellow-100" },
  { id: "OFFER", label: "Offer", color: "bg-green-100" },
  { id: "REJECTED", label: "Rejected", color: "bg-red-100" },
];

const ITEMS_PER_COLUMN = 5;

export default function Board() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [compactView, setCompactView] = useState(true);
  const [dateRange, setDateRange] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(
    STATUSES.reduce((acc, s) => ({ ...acc, [s.id]: ITEMS_PER_COLUMN }), {})
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  /**
   * IMPORTANT:
   * Use the same queryKey your app uses elsewhere.
   * Your NewApplication invalidates ["apps"] in your code.
   */
  const { data: apps = [], isLoading, error } = useQuery({
    queryKey: ["apps"],
    queryFn: async () => {
      const res = await applicationsApi.getAll({ page: 0, size: 2000 });
      // Supabase API shape: res.data.content
      return res.data.content;
    },
  });

  const filteredApplications = useMemo(() => {
    let filtered: Application[] = Array.isArray(apps) ? apps : [];

    // Archived filter
    if (!user?.showArchivedApps) {
      filtered = filtered.filter((a) => !a.archived);
    }

    // Search filter
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
  }, [apps, user?.showArchivedApps, searchQuery, companyFilter, dateRange]);

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

      // Optimistic UI update
      queryClient.setQueryData<Application[]>(["apps"], (old) => {
        const arr = Array.isArray(old) ? old : [];
        return arr.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a));
      });

      updateStatusMutation.mutate({ id: applicationId, status: newStatus });
    }

    setActiveId(null);
  };

  const handleDragCancel = () => setActiveId(null);

  const getApplicationsByStatus = (status: Application["status"]) => {
    return filteredApplications.filter((a) => a.status === status);
  };

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
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Failed to load applications.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Application Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            Drag and drop your application cards to update status.
          </p>
        </div>

        <button
          onClick={() => setCompactView((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
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

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by company..."
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            {filteredApplications.length} applications
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              className="rotate-3 opacity-90"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
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
  status: { id: string; label: string; color: string };
  applications: Application[];
  onCardClick: (id: string) => void;
  compactView: boolean;
  visibleCount: number;
  onLoadMore: () => void;
}) {
  const { setNodeRef } = useDroppable({ id: status.id });

  const visibleApps = applications.slice(0, visibleCount);
  const hasMore = applications.length > visibleCount;

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className={`${status.color} rounded-t-lg p-3`}>
        <h3 className="flex items-center justify-between font-semibold text-gray-900">
          <span>{status.label}</span>
          <span className="text-sm font-normal text-gray-600">{applications.length}</span>
        </h3>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-32 space-y-2 overflow-y-auto rounded-b-lg bg-gray-50 p-3 ${
          compactView ? "max-h-96" : "max-h-[600px]"
        }`}
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
          <p className="py-8 text-center text-sm text-gray-400">Drop cards here</p>
        )}

        {hasMore && (
          <button
            onClick={onLoadMore}
            className="w-full rounded-lg py-2 text-sm text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
          >
            Load More ({applications.length - visibleCount} remaining)
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
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ApplicationCard
        application={application}
        onClick={onClick}
        className={compactView ? "text-sm" : ""}
      />
    </div>
  );
}
