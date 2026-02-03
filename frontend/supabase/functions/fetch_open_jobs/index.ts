// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Input = {
  job_titles?: string[];
  // If provided, we interpret it as a single location override
  // OR a comma-separated list like "Seattle,WA; Bellevue,WA"
  location?: string;
  max_results_per_title?: number;
  // Optional: allow explicit multi-locations from caller
  locations?: string[];
};

function asString(v: any, fallback = ""): string {
  if (v == null) return fallback;
  const s = String(v).trim();
  return s.length ? s : fallback;
}

function pickJobUrl(job: any): string | null {
  const candidates = [
    job?.job_url,
    job?.apply_options?.[0]?.link,
    job?.related_links?.[0]?.link,
    job?.share_link,
    job?.google_jobs_link,
  ].filter(Boolean);

  if (!candidates.length) return null;
  return String(candidates[0]);
}

/**
 * SerpAPI google_jobs frequently returns:
 * detected_extensions.posted_at = "3 days ago"
 * which is NOT parseable to a timestamp safely.
 *
 * Sometimes it returns a parseable date. We'll only save date_posted
 * if Date.parse() succeeds, otherwise null.
 */
function parseDatePosted(job: any): string | null {
  const raw =
    job?.detected_extensions?.posted_at_date ??
    job?.detected_extensions?.posted_at ??
    job?.detected_extensions?.posted ??
    null;

  if (!raw) return null;

  const s = String(raw);

  // Attempt parse. If it fails, store null.
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) return null;

  return new Date(ms).toISOString();
}

/**
 * Stable fallback ID when SerpAPI job_id is missing:
 * - Prefer job.job_id if present
 * - Else hash-ish key from job_url (good enough for dedupe)
 */
function buildSourceJobId(job: any, jobUrl: string): string {
  const jid = job?.job_id ? String(job.job_id) : null;
  if (jid && jid.trim().length) return jid;

  // fallback: use URL as stable ID
  return jobUrl;
}

serve(async (req) => {
  const startedAt = Date.now();

  // ✅ Always return JSON
  const jsonResponse = (status: number, body: any) =>
    new Response(JSON.stringify(body, null, 2), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE || !SERPAPI_KEY) {
      return jsonResponse(500, {
        ok: false,
        error:
          "Missing env vars. Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SERPAPI_KEY",
      });
    }

    // 🔒 Optional auth gate (recommended when called from GitHub Actions)
    // If you want to require a bearer token, uncomment below.
    // const auth = req.headers.get("authorization") || "";
    // if (!auth.startsWith("Bearer ")) {
    //   return jsonResponse(401, { ok: false, error: "Missing Bearer token" });
    // }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    let body: Input = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const DEFAULT_TITLES = [
      "Frontend Engineer",
      "Backend Engineer",
      "Full Stack Developer",
      "Software Engineer",
      "Client Administrator",
    ];

    const DEFAULT_LOCATIONS = [
      "Seattle, WA, United States",
      "Bellevue, WA, United States",
      "Redmond, WA, United States",
      "Kirkland, WA, United States",
      "Everett,WA, United States",
    ];

    const jobTitles =
      Array.isArray(body.job_titles) && body.job_titles.length
        ? body.job_titles
        : DEFAULT_TITLES;

    // locations can come from:
    // - body.locations (preferred)
    // - body.location (single override)
    // - default metro set
    let locations: string[] = DEFAULT_LOCATIONS;

    if (Array.isArray(body.locations) && body.locations.length) {
      locations = body.locations.map((x) => asString(x)).filter(Boolean);
    } else if (body.location && asString(body.location)) {
      // allow a single string override (one location)
      locations = [asString(body.location)];
    }

    const maxResults = Math.min(
      Math.max(body.max_results_per_title ?? 25, 1),
      100
    );

    const source = "serpapi_google_jobs";

    const summary = {
      ok: true,
      source,
      requested_titles: jobTitles,
      requested_locations: locations,
      max_results_per_title: maxResults,

      searched_requests: 0, // title x location calls
      fetched_jobs_total: 0,
      upsert_success: 0,
      skipped_no_url: 0,

      per_query_counts: [] as Array<{
        query: string;
        location: string;
        fetched: number;
        attempted: number;
        upserted: number;
        skipped_no_url: number;
        serpapi_http?: number;
        error?: string;
      }>,

      upsert_errors: [] as Array<{
        query: string;
        location: string;
        role?: string;
        company?: string;
        reason: string;
      }>,

      serpapi_errors: [] as Array<{
        query: string;
        location: string;
        reason: string;
      }>,

      ms: 0,
    };

    // 🔁 loops: job title × location
    for (const query of jobTitles) {
      for (const location of locations) {
        summary.searched_requests += 1;

        const per = {
          query,
          location,
          fetched: 0,
          attempted: 0,
          upserted: 0,
          skipped_no_url: 0,
        } as any;

        const url =
          `https://serpapi.com/search.json?engine=google_jobs` +
          `&q=${encodeURIComponent(query)}` +
          `&location=${encodeURIComponent(location)}` +
          `&hl=en&gl=us` +
          `&api_key=${encodeURIComponent(SERPAPI_KEY)}`;

        let json: any;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            per.serpapi_http = res.status;
            summary.serpapi_errors.push({
              query,
              location,
              reason: `SerpAPI HTTP ${res.status}`,
            });
            summary.per_query_counts.push(per);
            continue;
          }
          json = await res.json();
        } catch (e: any) {
          per.error = e?.message ?? String(e);
          summary.serpapi_errors.push({
            query,
            location,
            reason: per.error,
          });
          summary.per_query_counts.push(per);
          continue;
        }

        const jobs = Array.isArray(json?.jobs_results) ? json.jobs_results : [];
        per.fetched = jobs.length;
        summary.fetched_jobs_total += jobs.length;

        const slice = jobs.slice(0, maxResults);

        for (const job of slice) {
          const jobUrl = pickJobUrl(job);
          if (!jobUrl) {
            per.skipped_no_url += 1;
            summary.skipped_no_url += 1;
            continue;
          }

          const sourceJobId = buildSourceJobId(job, jobUrl);
          const datePosted = parseDatePosted(job);

          // ✅ Only columns that exist in YOUR open_jobs schema:
          // id, source, source_job_id, company, role, location, job_url, date_posted, created_at, serpapi_job_id
          const row = {
            source,
            source_job_id: sourceJobId,
            serpapi_job_id: job?.job_id ? String(job.job_id) : null,
            company: asString(job?.company_name ?? job?.company, "Unknown"),
            role: asString(job?.title, "Unknown"),
            location: asString(job?.location ?? location, location),
            job_url: jobUrl,
            date_posted: datePosted, // nullable iso timestamp
          };

          per.attempted += 1;

          // ✅ IMPORTANT: this onConflict must match your UNIQUE index (see SQL below)
          const { error } = await supabase
            .from("open_jobs")
            .upsert(row, { onConflict: "source,source_job_id" });

          if (error) {
            summary.upsert_errors.push({
              query,
              location,
              role: row.role,
              company: row.company,
              reason: error.message,
            });
            continue;
          }

          per.upserted += 1;
          summary.upsert_success += 1;
        }

        summary.per_query_counts.push(per);
      }
    }

    summary.ms = Date.now() - startedAt;
    return jsonResponse(200, summary);
  } catch (e: any) {
    return jsonResponse(500, {
      ok: false,
      error: e?.message ?? String(e),
    });
  }
});
