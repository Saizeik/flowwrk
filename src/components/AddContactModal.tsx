import React, { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/authprovider";

type Props = {
  open: boolean;
  onClose: () => void;
  applicationId: string; // ✅ required: contact belongs to an application
  onCreated?: () => void;
};

type FormState = {
  name: string;
  title: string;
  email: string;
  phone: string;
  notes: string;
};

export default function AddContactModal({
  open,
  onClose,
  applicationId,
  onCreated,
}: Props) {
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>({
    name: "",
    title: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!form.name.trim()) return false;
    // email optional, but if provided it should look valid-ish
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      return false;
    return true;
  }, [form]);

  if (!open) return null;

  const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be signed in.");
      return;
    }

    if (!applicationId) {
      setError("Missing applicationId.");
      return;
    }

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);

    const payload = {
      user_id: user.id,
      application_id: applicationId,
      name: form.name.trim(),
      title: form.title.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    };

    const { error: insertError } = await supabase
      .from("application_contacts")
      .insert(payload);

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setForm({ name: "", title: "", email: "", phone: "", notes: "" });
    onCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Add contact</h2>
          <button
            className="text-slate-500 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={submit}>
          <div>
            <label className="text-sm text-slate-600">Name *</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.name}
              onChange={update("name")}
              placeholder="e.g. Jordan Lee"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Title</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.title}
              onChange={update("title")}
              placeholder="e.g. Recruiter / Hiring Manager"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.email}
                onChange={update("email")}
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label className="text-sm text-slate-600">Phone</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.phone}
                onChange={update("phone")}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600">Notes</label>
            <textarea
              className="mt-1 w-full min-h-[90px] rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.notes}
              onChange={update("notes")}
              placeholder="Anything helpful about this contact..."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
              disabled={loading || !canSubmit}
            >
              {loading ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
