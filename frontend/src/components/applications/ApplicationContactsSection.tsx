import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/authprovider";

type ContactRow = {
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

type Props = {
  applicationId: string;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function ApplicationContactsSection({ applicationId }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: "",
    title: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [error, setError] = useState<string | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["application_contacts", applicationId, user?.id],
    enabled: !!user?.id && !!applicationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_contacts")
        .select("*")
        .eq("user_id", user!.id)
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as ContactRow[];
    },
  });

  const createContact = useMutation({
    mutationFn: async () => {
      setError(null);

      if (!user?.id) throw new Error("You must be signed in.");

      const trimmed = {
        name: form.name.trim() || null,
        title: form.title.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim() || null,
      };

      // Minimal validation (tweak as you want)
      if (!trimmed.name && !trimmed.email) {
        throw new Error("Add at least a name or email.");
      }

      const payload = {
        user_id: user.id,
        application_id: applicationId,
        ...trimmed,
      };

      const { error } = await supabase.from("application_contacts").insert(payload);
      if (error) throw error;

      return true;
    },
    onSuccess: () => {
      setForm({ name: "", title: "", email: "", phone: "", notes: "" });
      qc.invalidateQueries({ queryKey: ["application_contacts", applicationId, user?.id] });
    },
    onError: (e: any) => {
      setError(e?.message ?? "Failed to add contact");
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (contactId: string) => {
      setError(null);
      if (!user?.id) throw new Error("You must be signed in.");

      const { error } = await supabase
        .from("application_contacts")
        .delete()
        .eq("id", contactId)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["application_contacts", applicationId, user?.id] });
    },
    onError: (e: any) => {
      setError(e?.message ?? "Failed to delete contact");
    },
  });

  const contacts = contactsQuery.data ?? [];
  const isLoading = contactsQuery.isLoading;

  const canSubmit = useMemo(() => {
    return (
      !!form.name.trim() ||
      !!form.email.trim() ||
      !!form.phone.trim() ||
      !!form.title.trim() ||
      !!form.notes.trim()
    );
  }, [form]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Contacts</div>
          <div className="mt-1 text-xs text-slate-500">
            Recruiters, hiring managers, referrals, etc.
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-slate-600">Name</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Jane Doe"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Title</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Recruiter"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Email</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="jane@company.com"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Phone</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="(555) 555-5555"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-600">Notes</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Context, last message, next step…"
          />
        </div>
      </div>

      {error ? <div className="mt-3 text-sm text-rose-600">{error}</div> : null}

      <div className="mt-4 flex justify-end">
        <button
          disabled={!canSubmit || createContact.isPending}
          onClick={() => createContact.mutate()}
          className={cx(
            "rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm",
            "bg-slate-900 hover:bg-slate-800",
            (!canSubmit || createContact.isPending) && "opacity-60 cursor-not-allowed"
          )}
        >
          {createContact.isPending ? "Saving..." : "Add Contact"}
        </button>
      </div>

      {/* List */}
      <div className="mt-6">
        {isLoading ? (
          <div className="text-sm text-slate-500">Loading contacts…</div>
        ) : contacts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            No contacts yet.
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">
                    {c.name || c.email || "Contact"}
                    {c.title ? <span className="ml-2 text-xs text-slate-500">• {c.title}</span> : null}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {c.email ? <span className="mr-3">{c.email}</span> : null}
                    {c.phone ? <span>{c.phone}</span> : null}
                  </div>
                  {c.notes ? <div className="mt-2 text-sm text-slate-600">{c.notes}</div> : null}
                </div>

                <button
                  onClick={() => deleteContact.mutate(c.id)}
                  disabled={deleteContact.isPending}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
