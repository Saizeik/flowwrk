/// <reference types="vite/client" />
import { supabase } from "./lib/supabase";

/** =========================
 * Types
 * ========================= */

export interface User {
  id: string;
  name: string;
  email: string;
  emailNotifications: boolean;
  autoArchiveOldApps: boolean;
  showArchivedApps: boolean;
  hasPassword: boolean;
  oauthProvider: string | null;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  location?: string;
  status: "SAVED" | "APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED";
  dateApplied?: string;
  jobUrl?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  archived: boolean;

  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: "YEAR" | "HOUR" | "MONTH" | "WEEK";

  createdAt: string;
  updatedAt: string;
}

export interface OpenJob {
  company: string;
  role: string;
  location: string;
  datePosted: string;
  jobUrl: string;
}

export interface Note {
  id: string;
  applicationId: string;
  content: string; // UI uses "content", DB uses "body"
  createdAt: string;
}

export interface Contact {
  id: string;
  applicationId: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

/** Raw row shape (matches your application_contacts schema) */
export type ApplicationContact = {
  id: string;
  user_id: string;
  application_id: string;
  name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export interface Reminder {
  id: string;
  applicationId: string;
  remindAt: string;
  message: string;
  completed: boolean;
  createdAt: string;

  /** Optional when we join applications in getUpcoming() */
  application?: {
    company?: string | null;
    role?: string | null;
  };
}

export interface Attachment {
  id: string;
  applicationId: string;
  objectKey: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface Activity {
  id: string;
  applicationId: string;
  activityType: string;
  message: string;
  createdAt: string;
}

export interface Analytics {
  statusCounts: Record<string, number>;
  appsPerWeek: Record<string, number>;
  conversionRates: {
    appliedToInterview: number;
    interviewToOffer: number;
    appliedToOffer: number;
  };
  avgTimeInStage: Record<string, number>;
}

/** =========================
 * Helpers
 * ========================= */

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

function mapAppRow(row: any): Application {
  return {
    id: row.id,
    company: row.company ?? "",
    role: row.role ?? "",
    location: row.location ?? undefined,
    status: row.status,
    dateApplied: row.date_applied ?? row.applied_at ?? undefined,
    jobUrl: row.job_url ?? row.link ?? undefined,
    priority: (row.priority ?? "MEDIUM") as Application["priority"],
    archived: Boolean(row.archived ?? false),

    salaryMin: row.salary_min ?? undefined,
    salaryMax: row.salary_max ?? undefined,
    salaryCurrency: row.salary_currency ?? "USD",
    salaryPeriod: (row.salary_period ?? "YEAR") as Application["salaryPeriod"],

    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

function mapNoteRow(row: any): Note {
  return {
    id: row.id,
    applicationId: row.application_id,
    content: row.body ?? "",
    createdAt: row.created_at,
  };
}

function mapContactRow(row: any): Contact {
  return {
    id: row.id,
    applicationId: row.application_id,
    name: row.name ?? "",
    title: row.title ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

function mapReminderRow(row: any): Reminder {
  // When we join applications in getUpcoming(),
  // Supabase returns { applications: { company, role } }
  const app = row.applications ?? row.application ?? null;

  return {
    id: row.id,
    applicationId: row.application_id,
    remindAt: row.remind_at,
    message: row.message ?? "",
    completed: Boolean(row.completed ?? false),
    createdAt: row.created_at,
    application: app
      ? {
          company: app.company ?? null,
          role: app.role ?? null,
        }
      : undefined,
  };
}

/** =========================
 * Auth API (kept for legacy imports)
 * ========================= */

export const authApi = {
  register: async (data: { name: string; email: string; password: string }) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) throw error;
    return { data: { message: "Check your email to confirm your account." } };
  },

  login: async (data: { email: string; password: string }) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) throw error;

    return {
      data: {
        token: authData.session?.access_token ?? "",
        user: {
          id: authData.user.id,
          name: "",
          email: authData.user.email ?? "",
          emailNotifications: true,
          autoArchiveOldApps: false,
          showArchivedApps: false,
          hasPassword: true,
          oauthProvider: authData.user.app_metadata?.provider ?? null,
        } as User,
      },
    };
  },

  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error("Not authenticated");

    return {
      data: {
        id: data.user.id,
        name: "",
        email: data.user.email ?? "",
        emailNotifications: true,
        autoArchiveOldApps: false,
        showArchivedApps: false,
        hasPassword: true,
        oauthProvider: data.user.app_metadata?.provider ?? null,
      } as User,
    };
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    if (error) throw error;
    return { data: { ok: true } };
  },

  forgotPassword: async (data: { email: string }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
    return { data: { ok: true } };
  },

  resetPassword: async (data: { token: string | null; newPassword: string }) => {
    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    if (error) throw error;
    return { data: { ok: true } };
  },
};

/** =========================
 * Open Jobs API
 * ========================= */

export const jobsApi = {
  getOpenInternships: async (
    page: number = 0,
    size: number = 20,
    filters?: { q?: string; location?: string }
  ) => {
    let query = supabase
      .from("open_jobs")
      .select("*", { count: "exact" })
      .order("date_posted", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(page * size, page * size + size - 1);

    if (filters?.q?.trim()) {
      const q = filters.q.trim().replace(/%/g, "");
      // your table is: company, role (not job_title in your schema)
      query = query.or(`role.ilike.%${q}%,company.ilike.%${q}%`);
    }
    if (filters?.location?.trim()) {
      query = query.ilike("location", `%${filters.location.trim()}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const mapped: OpenJob[] = (data ?? []).map((r: any) => ({
      company: r.company ?? "",
      role: r.role ?? "",
      location: r.location ?? "",
      datePosted: r.date_posted ?? r.created_at,
      jobUrl: r.job_url,
    }));

    return { data: mapped, meta: { total: count ?? mapped.length } };
  },
};

/** =========================
 * Applications API
 * ========================= */

export const applicationsApi = {
  getAll: async (params?: {
    status?: string;
    q?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }) => {
    const userId = await requireUserId();
    const page = params?.page ?? 0;
    const size = params?.size ?? 50;

    let query = supabase
      .from("applications")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    if (params?.status) query = query.eq("status", params.status);

    if (params?.q?.trim()) {
      const q = params.q.trim().replace(/%/g, "");
      query = query.or(`company.ilike.%${q}%,role.ilike.%${q}%,location.ilike.%${q}%`);
    }

    if (params?.from) query = query.gte("created_at", params.from);
    if (params?.to) query = query.lte("created_at", params.to);

    query = query
      .order("updated_at", { ascending: false })
      .range(page * size, page * size + size - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const content = (data ?? []).map(mapAppRow);
    const totalElements = count ?? content.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));

    return { data: { content, totalPages, totalElements } };
  },

  getById: async (id: string) => {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .single();

    if (error) throw error;
    return { data: mapAppRow(data) };
  },

  create: async (data: Partial<Application>) => {
    const userId = await requireUserId();

    const normalizeInt = (v: any) => {
      if (v === null || v === undefined || v === "") return null;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    };

    const payload = {
      user_id: userId,
      company: (data.company ?? "").trim(),
      role: (data.role ?? "").trim(),
      location: data.location ?? null,
      status: data.status ?? "SAVED",
      date_applied: data.dateApplied ?? null,
      job_url: data.jobUrl ?? null,
      priority: data.priority ?? "MEDIUM",
      archived: data.archived ?? false,

      salary_min: normalizeInt(data.salaryMin),
      salary_max: normalizeInt(data.salaryMax),
      salary_currency: data.salaryCurrency ?? "USD",
      salary_period: data.salaryPeriod ?? "YEAR",

      updated_at: new Date().toISOString(),
    };

    const { data: row, error } = await supabase
      .from("applications")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    return { data: mapAppRow(row) };
  },

  update: async (id: string, data: Partial<Application>) => {
    const userId = await requireUserId();

    const payload: any = { updated_at: new Date().toISOString() };

    if (data.company !== undefined) payload.company = data.company;
    if (data.role !== undefined) payload.role = data.role;
    if (data.location !== undefined) payload.location = data.location;
    if (data.status !== undefined) payload.status = data.status;
    if (data.dateApplied !== undefined) payload.date_applied = data.dateApplied;
    if (data.jobUrl !== undefined) payload.job_url = data.jobUrl;
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.archived !== undefined) payload.archived = data.archived;

    if (data.salaryMin !== undefined) payload.salary_min = data.salaryMin ?? null;
    if (data.salaryMax !== undefined) payload.salary_max = data.salaryMax ?? null;
    if (data.salaryCurrency !== undefined) payload.salary_currency = data.salaryCurrency ?? "USD";
    if (data.salaryPeriod !== undefined) payload.salary_period = data.salaryPeriod ?? "YEAR";

    const { data: row, error } = await supabase
      .from("applications")
      .update(payload)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return { data: mapAppRow(row) };
  },

  delete: async (id: string) => {
    const userId = await requireUserId();
    const { error } = await supabase.from("applications").delete().eq("user_id", userId).eq("id", id);
    if (error) throw error;
    return { data: { ok: true } };
  },

  updateStatus: async (id: string, status: Application["status"]) => {
    return applicationsApi.update(id, { status });
  },
};

/** =========================
 * Notes API
 * Table: application_notes (body)
 * ========================= */

export const notesApi = {
  getByApp: async (appId: string) => {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("application_notes")
      .select("*")
      .eq("user_id", userId)
      .eq("application_id", appId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: (data ?? []).map(mapNoteRow) };
  },

  create: async (appId: string, content: string) => {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("application_notes")
      .insert({ user_id: userId, application_id: appId, body: content })
      .select("*")
      .single();

    if (error) throw error;
    return { data: mapNoteRow(data) };
  },

  delete: async (appId: string, noteId: string) => {
    const userId = await requireUserId();
    const { error } = await supabase
      .from("application_notes")
      .delete()
      .eq("user_id", userId)
      .eq("application_id", appId)
      .eq("id", noteId);

    if (error) throw error;
    return { data: { ok: true } };
  },
};

/** =========================
 * Contacts API
 * Table: application_contacts
 * ========================= */

export const contactsApi = {
  getByApp: async (appId: string) => {
    const userId = await requireUserId();

    const { data, error } = await supabase
      .from("application_contacts")
      .select("*")
      .eq("user_id", userId)
      .eq("application_id", appId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: (data ?? []).map(mapContactRow) };
  },

  create: async (
    appId: string,
    contact: {
      name?: string | null;
      title?: string | null;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
    }
  ) => {
    const userId = await requireUserId();

    const { data, error } = await supabase
      .from("application_contacts")
      .insert({
        user_id: userId,
        application_id: appId,
        name: contact.name ?? null,
        title: contact.title ?? null,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        notes: contact.notes ?? null,
      })
      .select("*")
      .single();

    if (error) throw error;
    return { data: mapContactRow(data) };
  },

  update: async (
    appId: string,
    contactId: string,
    patch: {
      name?: string | null;
      title?: string | null;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
    }
  ) => {
    const userId = await requireUserId();

    const { data, error } = await supabase
      .from("application_contacts")
      .update({
        name: patch.name ?? null,
        title: patch.title ?? null,
        email: patch.email ?? null,
        phone: patch.phone ?? null,
        notes: patch.notes ?? null,
      })
      .eq("user_id", userId)
      .eq("application_id", appId)
      .eq("id", contactId)
      .select("*")
      .single();

    if (error) throw error;
    return { data: mapContactRow(data) };
  },

  delete: async (appId: string, contactId: string) => {
    const userId = await requireUserId();

    const { error } = await supabase
      .from("application_contacts")
      .delete()
      .eq("user_id", userId)
      .eq("application_id", appId)
      .eq("id", contactId);

    if (error) throw error;
    return { data: { ok: true } };
  },
};

/** =========================
 * Reminders API
 * Table: reminders
 * ========================= */

export const remindersApi = {
  getByApp: async (appId: string) => {
    const userId = await requireUserId();

    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId)
      .eq("application_id", appId)
      .order("remind_at", { ascending: true });

    if (error) throw error;
    return { data: (data ?? []).map(mapReminderRow) };
  },

  /** ✅ upcoming reminders across all applications, with company/role joined */
  getUpcoming: async (opts?: {
    days?: number; // default 14
    includeOverdue?: boolean; // default true
    limit?: number; // default 25
  }) => {
    const userId = await requireUserId();

    const days = opts?.days ?? 14;
    const includeOverdue = opts?.includeOverdue ?? true;
    const limit = opts?.limit ?? 25;

    const now = new Date();
    const start = includeOverdue
      ? new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      : now;
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("reminders")
      // requires reminders.application_id FK to applications.id (recommended)
      .select("*, applications ( company, role )")
      .eq("user_id", userId)
      .eq("completed", false)
      .gte("remind_at", start.toISOString())
      .lte("remind_at", end.toISOString())
      .order("remind_at", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return { data: (data ?? []).map(mapReminderRow) };
  },

  create: async (appId: string, data: { remindAt: string; message: string }) => {
    const userId = await requireUserId();

    const { data: row, error } = await supabase
      .from("reminders")
      .insert({
        user_id: userId,
        application_id: appId,
        remind_at: data.remindAt,
        message: data.message,
        completed: false,
      })
      .select("*")
      .single();

    if (error) throw error;
    return { data: mapReminderRow(row) };
  },

  delete: async (appId: string, id: string) => {
    const userId = await requireUserId();

    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("user_id", userId)
      .eq("application_id", appId)
      .eq("id", id);

    if (error) throw error;
    return { data: { ok: true } };
  },

  complete: async (id: string) => {
    const userId = await requireUserId();

    const { data, error } = await supabase
      .from("reminders")
      .update({ completed: true })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return { data: mapReminderRow(data) };
  },
};

/** =========================
 * Optional placeholders (keep imports from breaking)
 * ========================= */

export const attachmentsApi = {
  getByApp: async (_appId: string) => ({ data: [] as Attachment[] }),
  presign: async (_appId: string, _data: any) => {
    throw new Error("Not implemented (use Supabase Storage later).");
  },
  confirm: async (_appId: string, _data: any) => {
    throw new Error("Not implemented.");
  },
  getDownloadUrl: async (_attachmentId: string) => {
    throw new Error("Not implemented.");
  },
  delete: async (_appId: string, _attachmentId: string) => {
    throw new Error("Not implemented.");
  },
};

export const activityApi = {
  getByApp: async (_appId: string) => ({ data: [] as Activity[] }),
};

export const analyticsApi = {
  get: async () => {
    const { data } = await applicationsApi.getAll({ page: 0, size: 2000 });
    const apps = data.content;

    const statusCounts: Record<string, number> = {};
    for (const a of apps) statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;

    const applied = statusCounts.APPLIED ?? 0;
    const interview = (statusCounts.INTERVIEW ?? 0) + (statusCounts.OA ?? 0);
    const offer = statusCounts.OFFER ?? 0;

    const conversionRates = {
      appliedToInterview: applied ? (interview / applied) * 100 : 0,
      interviewToOffer: interview ? (offer / interview) * 100 : 0,
      appliedToOffer: applied ? (offer / applied) * 100 : 0,
    };

    const payload: Analytics = {
      statusCounts,
      appsPerWeek: {},
      conversionRates,
      avgTimeInStage: {},
    };

    return { data: payload };
  },
};

/** =========================
 * Default export (IMPORTANT)
 * Some files do: import api from "../../api"
 * ========================= */

const apiClient = {
  authApi,
  applicationsApi,
  notesApi,
  contactsApi,
  remindersApi,
  attachmentsApi,
  activityApi,
  analyticsApi,
  jobsApi,
};

export default apiClient;
