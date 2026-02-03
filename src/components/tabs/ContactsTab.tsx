import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Plus, Save, Trash2, User, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/authprovider";

type Props = {
  applicationId: string;
};

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

type Draft = {
  name: string;
  title: string;
  email: string;
  phone: string;
  notes: string;
};

const emptyDraft: Draft = { name: "", title: "", email: "", phone: "", notes: "" };

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function toDraft(c?: ContactRow | null): Draft {
  return {
    name: c?.name ?? "",
    title: c?.title ?? "",
    email: c?.email ?? "",
    phone: c?.phone ?? "",
    notes: c?.notes ?? "",
  };
}

function normalizeDraft(d: Draft) {
  return {
    name: d.name.trim() || null,
    title: d.title.trim() || null,
    email: d.email.trim() || null,
    phone: d.phone.trim() || null,
    notes: d.notes.trim() || null,
  };
}

export default function ContactsTab({ applicationId }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);

  const canWrite = !!user?.id && !!applicationId;

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

  const contacts = useMemo(() => contactsQuery.data ?? [], [contactsQuery.data]);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not signed in");
      if (!applicationId) throw new Error("Missing application id");

      const payload = normalizeDraft(draft);

      // Require at least name or email
      if (!payload.name && !payload.email) {
        throw new Error("Add at least a name or email.");
      }

      const { error } = await supabase.from("application_contacts").insert({
        user_id: user.id,
        application_id: applicationId,
        ...payload,
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["application_contacts", applicationId, user?.id] });
      setDraft(emptyDraft);
      setCreating(false);
    },
  });

  const updateMut = useMutation({
    mutationFn: async (vars: { id: string; draft: Draft }) => {
      if (!user?.id) throw new Error("Not signed in");

      const payload = normalizeDraft(vars.draft);

      // Require at least name or email
      if (!payload.name && !payload.email) {
        throw new Error("Add at least a name or email.");
      }

      const { error } = await supabase
        .from("application_contacts")
        .update(payload)
        .eq("id", vars.id)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["application_contacts", applicationId, user?.id] });
      setEditingId(null);
      setEditDraft(emptyDraft);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Not signed in");
      const { error } = await supabase
        .from("application_contacts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["application_contacts", applicationId, user?.id] });
    },
  });

  const startEdit = (c: ContactRow) => {
    setEditingId(c.id);
    setEditDraft(toDraft(c));
  };

  if (contactsQuery.isLoading) {
    return <div className="text-sm text-slate-600">Loading contacts…</div>;
  }

  if (contactsQuery.isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Failed to load contacts: {(contactsQuery.error as any)?.message ?? "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Contacts</div>
          <div className="mt-1 text-sm text-slate-500">
            Store recruiters / hiring managers per application.
          </div>
        </div>

        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            disabled={!canWrite}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add contact
          </button>
        ) : null}
      </div>

      {/* Create Form */}
      {creating ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field
              label="Name"
              icon={User}
              value={draft.name}
              onChange={(v) => setDraft((d) => ({ ...d, name: v }))}
              placeholder="Jane Recruiter"
            />
            <Field
              label="Title"
              icon={User}
              value={draft.title}
              onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
              placeholder="Engineering Manager"
            />
            <Field
              label="Email"
              icon={Mail}
              value={draft.email}
              onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
              placeholder="jane@company.com"
            />
            <Field
              label="Phone"
              icon={Phone}
              value={draft.phone}
              onChange={(v) => setDraft((d) => ({ ...d, phone: v }))}
              placeholder="(555) 555-5555"
            />
            <TextArea
              label="Notes"
              value={draft.notes}
              onChange={(v) => setDraft((d) => ({ ...d, notes: v }))}
              placeholder="Met at career fair…"
            />
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setDraft(emptyDraft);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>

            <button
              type="button"
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !canWrite}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {createMut.isPending ? "Saving…" : "Save"}
            </button>
          </div>

          {createMut.isError ? (
            <div className="mt-3 text-sm text-rose-700">
              {(createMut.error as any)?.message ?? "Failed to save contact"}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* List */}
      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          No contacts yet.
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => {
            const isEditing = editingId === c.id;

            return (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {!isEditing ? (
                      <>
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {c.name || "Unnamed contact"}
                        </div>
                        <div className="mt-0.5 truncate text-sm text-slate-500">
                          {c.title || "—"}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          {c.email ? (
                            <a
                              className="inline-flex items-center gap-2 hover:underline"
                              href={`mailto:${c.email}`}
                            >
                              <Mail className="h-4 w-4" />
                              {c.email}
                            </a>
                          ) : null}
                          {c.phone ? (
                            <a
                              className="inline-flex items-center gap-2 hover:underline"
                              href={`tel:${c.phone}`}
                            >
                              <Phone className="h-4 w-4" />
                              {c.phone}
                            </a>
                          ) : null}
                        </div>

                        {c.notes ? (
                          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                            {c.notes}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Field
                          label="Name"
                          icon={User}
                          value={editDraft.name}
                          onChange={(v) => setEditDraft((d) => ({ ...d, name: v }))}
                        />
                        <Field
                          label="Title"
                          icon={User}
                          value={editDraft.title}
                          onChange={(v) => setEditDraft((d) => ({ ...d, title: v }))}
                        />
                        <Field
                          label="Email"
                          icon={Mail}
                          value={editDraft.email}
                          onChange={(v) => setEditDraft((d) => ({ ...d, email: v }))}
                        />
                        <Field
                          label="Phone"
                          icon={Phone}
                          value={editDraft.phone}
                          onChange={(v) => setEditDraft((d) => ({ ...d, phone: v }))}
                        />
                        <TextArea
                          label="Notes"
                          value={editDraft.notes}
                          onChange={(v) => setEditDraft((d) => ({ ...d, notes: v }))}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMut.mutate(c.id)}
                          disabled={deleteMut.isPending}
                          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditDraft(emptyDraft);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => updateMut.mutate({ id: c.id, draft: editDraft })}
                          disabled={updateMut.isPending}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />
                          {updateMut.isPending ? "Saving…" : "Save"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {updateMut.isError && isEditing ? (
                  <div className="mt-3 text-sm text-rose-700">
                    {(updateMut.error as any)?.message ?? "Failed to update contact"}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: any;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block md:col-span-2">
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}
