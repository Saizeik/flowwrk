import { useMemo, useState, type MouseEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Activity,
  Bell,
  Building2,
  Edit,
  FileText,
  Paperclip,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { applicationsApi, type Application } from "../api";
import StatusBadge from "../components/StatusBadge";
import PriorityBadge from "../components/PriorityBadge";
import DetailsTab from "../components/tabs/DetailsTab";
import NotesTab from "../components/tabs/NotesTab";
import ContactsTab from "../components/tabs/ContactsTab";
import RemindersTab from "../components/tabs/RemindersTab";
import AttachmentsTab from "../components/tabs/AttachmentsTab";
import ActivityTab from "../components/tabs/ActivityTab";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

type Tab =
  | "details"
  | "notes"
  | "contacts"
  | "reminders"
  | "attachments"
  | "history";

const STATUSES: Array<{ id: Application["status"]; label: string }> = [
  { id: "SAVED", label: "Saved" },
  { id: "APPLIED", label: "Applied" },
  { id: "OA", label: "Online Assessment" },
  { id: "INTERVIEW", label: "Interview" },
  { id: "OFFER", label: "Offer" },
  { id: "REJECTED", label: "Rejected" },
];

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] =
    useState<Application | null>(null);

  const {
    data: application,
    isLoading,
    isError,
    error,
  } = useQuery<Application>({
    queryKey: ["application", id],
    enabled: !!id,
    queryFn: async () => {
      const response = await applicationsApi.getById(id!);
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await applicationsApi.update(id!, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", id] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["apps"] }); // board cache
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await applicationsApi.delete(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      navigate("/applications");
    },
  });

  const handleEdit = () => {
    if (!application) return;

    setEditForm({
      ...application,
      // Application type uses dateApplied
      dateApplied: application.dateApplied
        ? format(new Date(application.dateApplied), "yyyy-MM-dd")
        : "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const dataToSave: any = { ...editForm };

    // Convert the edit field back to API model (dateApplied)
    if (dataToSave.dateApplied !== undefined) {
      dataToSave.dateApplied = dataToSave.dateApplied
        ? new Date(dataToSave.dateApplied).toISOString()
        : null;
    }

    updateMutation.mutate(dataToSave);
  };

  const handleDelete = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!application) return;
    setDeleteModalOpen(true);
    setApplicationToDelete(application);
  };

  const confirmDelete = () => {
    if (!applicationToDelete) return;

    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setApplicationToDelete(null);
      },
    });
  };

  const tabs = useMemo(
    () => [
      { id: "details" as Tab, label: "Details", icon: FileText },
      { id: "notes" as Tab, label: "Notes", icon: FileText },
      { id: "contacts" as Tab, label: "Contacts", icon: Users },
      { id: "reminders" as Tab, label: "Reminders", icon: Bell },
      { id: "attachments" as Tab, label: "Attachments", icon: Paperclip },
      { id: "history" as Tab, label: "History", icon: Activity },
    ],
    []
  );

  if (isLoading) return <div className="text-sm text-slate-600">Loading...</div>;

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Failed to load application: {String((error as any)?.message ?? error)}
      </div>
    );
  }

  if (!application) {
    return <div className="text-sm text-slate-600">Application not found</div>;
  }

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.role ?? ""}
                    onChange={(e) =>
                      setEditForm((f: any) => ({ ...f, role: e.target.value }))
                    }
                    className="w-full border-b-2 border-indigo-500 text-2xl font-bold text-slate-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editForm.company ?? ""}
                    onChange={(e) =>
                      setEditForm((f: any) => ({ ...f, company: e.target.value }))
                    }
                    className="w-full border-b border-slate-300 text-lg text-slate-600 focus:outline-none"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {application.role}
                  </h1>
                  <div className="mt-2 flex items-center gap-2 text-lg text-slate-600">
                    <Building2 className="h-5 w-5" />
                    <span className="truncate">{application.company}</span>
                  </div>
                </>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {isEditing ? (
                  <>
                    <select
                      value={editForm.status ?? "APPLIED"}
                      onChange={(e) =>
                        setEditForm((f: any) => ({ ...f, status: e.target.value }))
                      }
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    >
                      {STATUSES.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={editForm.priority ?? "MEDIUM"}
                      onChange={(e) =>
                        setEditForm((f: any) => ({ ...f, priority: e.target.value }))
                      }
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </>
                ) : (
                  <>
                    <StatusBadge status={application.status} />
                    <PriorityBadge priority={application.priority} />
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 sm:w-auto"
                  >
                    <Save className="h-4 w-4" />
                    {updateMutation.isPending ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEdit}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 sm:w-auto"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 disabled:opacity-60 sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200">
            <nav
              className={cx(
                "flex gap-1 overflow-x-auto px-2 py-2",
                "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              )}
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cx(
                      "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "details" && (
              <DetailsTab
                application={application}
                isEditing={isEditing}
                editForm={editForm}
                setEditForm={setEditForm}
              />
            )}

            {/* ✅ Let tabs own their own data fetching (matches your ContactsTab) */}
            {activeTab === "notes" && <NotesTab applicationId={id!} notes={[]} />}
            {activeTab === "contacts" && <ContactsTab applicationId={id!} />}
            {activeTab === "reminders" && <RemindersTab applicationId={id!} reminders={[]} />}
            {activeTab === "attachments" && <AttachmentsTab applicationId={id!} />}
            {activeTab === "history" && <ActivityTab activities={[]} />}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setApplicationToDelete(null);
        }}
        onConfirm={confirmDelete}
        loading={deleteMutation.isPending}
        title="Delete Application"
        message={
          applicationToDelete
            ? `Are you sure you want to delete your application to ${applicationToDelete.company} for ${applicationToDelete.role}? This action cannot be undone.`
            : ""
        }
      />
    </>
  );
}
