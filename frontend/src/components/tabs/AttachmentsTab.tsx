import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Download, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { attachmentsApi, type Attachment } from "../../api";
import FileUploader from "../FileUploader";

interface AttachmentsTabProps {
  applicationId: string;
}

export default function AttachmentsTab({ applicationId }: AttachmentsTabProps) {
  const queryClient = useQueryClient();

  const attachmentsQuery = useQuery<Attachment[]>({
    queryKey: ["attachments", applicationId],
    enabled: !!applicationId,
    queryFn: async () => {
      const res = await attachmentsApi.getByApp(applicationId);
      return res.data ?? [];
    },
    staleTime: 30_000,
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      await attachmentsApi.delete(applicationId, attachmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", applicationId] });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      // Implement later in attachmentsApi.getDownloadUrl
      const res = await attachmentsApi.getDownloadUrl(attachmentId);
      return res as any;
    },
  });

  const attachments = attachmentsQuery.data ?? [];

  if (attachmentsQuery.isLoading) {
    return <div className="text-sm text-slate-600">Loading attachments…</div>;
  }

  if (attachmentsQuery.isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        Failed to load attachments:{" "}
        {(attachmentsQuery.error as any)?.message ?? "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FileUploader
        applicationId={applicationId}
        onUploadComplete={() =>
          queryClient.invalidateQueries({ queryKey: ["attachments", applicationId] })
        }
      />

      <div className="space-y-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <Paperclip className="mt-0.5 h-5 w-5 text-slate-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {attachment.fileName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {(attachment.sizeBytes / 1024).toFixed(1)} KB ·{" "}
                    {attachment.uploadedAt
                      ? format(new Date(attachment.uploadedAt), "MMM d, yyyy")
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    // This will throw until you implement getDownloadUrl
                    try {
                      const r: any = await downloadMutation.mutateAsync(attachment.id);
                      const url = r?.data?.downloadUrl ?? r?.downloadUrl;
                      if (url) window.open(url, "_blank", "noopener,noreferrer");
                    } catch (e) {
                      console.error(e);
                      alert("Download not implemented yet.");
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                  disabled={deleteAttachmentMutation.isPending}
                  className="inline-flex items-center justify-center rounded-xl bg-rose-600 p-2 text-white hover:bg-rose-700 disabled:opacity-60"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {attachments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No attachments yet.
          </div>
        )}
      </div>
    </div>
  );
}
