import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, RefreshCw } from "lucide-react";
import { jobsApi, type OpenJob } from "../api";

type JobsResponse = {
  data: OpenJob[];
  meta?: { total?: number };
};

export default function OpenJobs() {
  const navigate = useNavigate();

  const pageSize = 20;

  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");

  // Debounce-ish: only query with "applied" filters to avoid refetching every keystroke
  const [appliedQ, setAppliedQ] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");

  const queryKey = ["open-jobs", page, pageSize, appliedQ, appliedLocation];

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<JobsResponse>({
    queryKey,
    queryFn: async () => {
      const res = await jobsApi.getOpenInternships(page, pageSize, {
        q: appliedQ,
        location: appliedLocation,
      });

      // The API returns { data: OpenJob[], meta: { total } }
      const jobs = res.data;

      return {
        data: jobs,
        meta: res.meta,
      };
    },
  });

  const openJobs = data?.data ?? [];
  const total = data?.meta?.total;

  const totalPages =
    typeof total === "number" ? Math.max(1, Math.ceil(total / pageSize)) : null;

  const handleAddApplication = (job: OpenJob) => {
    navigate("/applications/new", { state: { prefillJob: job } });
  };

  const onApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setAppliedQ(q.trim());
    setAppliedLocation(location.trim());
  };

  const onClearFilters = () => {
    setQ("");
    setLocation("");
    setAppliedQ("");
    setAppliedLocation("");
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Open Jobs</h1>
          <p className="mt-1 text-sm text-slate-600">
            Shared job feed (from your server refresh). Use search + location to filter.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <form
        onSubmit={onApplyFilters}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title or company (e.g. data analyst)"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          {/* Location */}
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (e.g. Seattle, WA)"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 md:justify-end">
            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
            >
              Apply
            </button>
          </div>
        </div>

        {(appliedQ || appliedLocation) && (
          <div className="mt-3 text-xs text-slate-500">
            Filtering by{" "}
            <span className="font-medium text-slate-700">
              {appliedQ || "—"}
            </span>{" "}
            {appliedLocation ? (
              <>
                in{" "}
                <span className="font-medium text-slate-700">
                  {appliedLocation}
                </span>
              </>
            ) : null}
          </div>
        )}
      </form>

      {/* States */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to fetch open jobs: {String((error as any)?.message ?? error)}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-3 text-sm text-slate-600">Loading jobs...</p>
        </div>
      ) : openJobs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-600">No jobs found.</p>
          <p className="mt-1 text-sm text-slate-500">
            Try clearing filters or refreshing.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {openJobs.map((job: OpenJob, idx: number) => (
              <li key={`${job.jobUrl}-${idx}`} className="hover:bg-slate-50">
                <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-slate-900">
                      {job.role}
                    </h3>
                    <p className="mt-0.5 truncate text-sm text-slate-600">
                      {job.company}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>📍 {job.location || "—"}</span>
                      <span>
                        📅{" "}
                        {job.datePosted
                          ? new Date(job.datePosted).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => handleAddApplication(job)}
                      className="rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                    >
                      Add to my Applications
                    </button>

                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                    >
                      Apply
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-500">
          {typeof total === "number" ? (
            <>
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)}{" "}
              of {total} jobs
            </>
          ) : (
            <>Page {page + 1}</>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || isFetching}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            Previous
          </button>

          <span className="text-sm text-slate-600">
            Page {page + 1}
            {totalPages ? ` of ${totalPages}` : ""}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={
              isFetching || (totalPages ? page + 1 >= totalPages : openJobs.length < pageSize)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
