import React, { useMemo, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { applicationsApi } from "../api";
import ApplicationForm, {
  ApplicationFormState,
  ImportedData,
} from "./applications/ApplicationForm";
import ImportJobModal from "./ImportJobModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function AddApplicationModal({ open, onClose, onCreated }: Props) {
  const qc = useQueryClient();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  const [initialOverride, setInitialOverride] = useState<Partial<ApplicationFormState> | null>(null);

  const baseInitial = useMemo<Partial<ApplicationFormState>>(
    () => ({
      company: "",
      role: "",
      location: "",
      jobUrl: "",
      priority: "MEDIUM",
      status: "SAVED",
      salaryCurrency: "USD",
      salaryPeriod: "YEAR",
    }),
    []
  );

  const effectiveInitial = useMemo(
    () => ({ ...baseInitial, ...(initialOverride ?? {}) }),
    [baseInitial, initialOverride]
  );

  const createMut = useMutation<any, Error, ApplicationFormState>({
    mutationFn: async (payload) => {
      const res = await applicationsApi.create(payload as any);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apps"] });
      onCreated?.();
      onClose();
      setImportedData(null);
      setInitialOverride(null);
    },
  });

  const handleImportSuccess = (data: any) => {
    const normalized: ImportedData = {
      company: data.company ?? "",
      role: data.role ?? "",
      location: data.location ?? "",
      jobUrl: data.jobUrl ?? "",
      confidence: data.confidence,
      warnings: data.warnings ?? [],
    };

    setImportedData(normalized);

    setInitialOverride({
      ...effectiveInitial,
      company: normalized.company ?? "",
      role: normalized.role ?? "",
      location: normalized.location ?? "",
      jobUrl: normalized.jobUrl ?? "",
    });
  };

  if (!open) return null;

  return (
    <>
      <ImportJobModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full max-w-3xl">
          <ApplicationForm
            title="Add New Application"
            initial={effectiveInitial}
            importedData={importedData}
            onOpenImport={() => setIsImportModalOpen(true)}
            submitting={createMut.isPending}
            submitError={createMut.isError ? "Error creating application" : null}
            onSubmit={(payload) => createMut.mutate(payload)}
            onCancel={onClose}
          />
        </div>
      </div>
    </>
  );
}
