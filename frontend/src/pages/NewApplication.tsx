import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi, type OpenJob } from "../api";

import ApplicationForm, {
  ApplicationFormState,
  type ImportedData,
} from "../components/applications/ApplicationForm";

import ImportJobModal from "../components/ImportJobModal";

export default function NewApplication() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const location = useLocation();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedData, setImportedData] = useState<ImportedData | null>(null);

  const job = (location.state as any)?.prefillJob as OpenJob | undefined;

  // Base initial values
  const initial = useMemo<Partial<ApplicationFormState>>(() => {
    if (!job) return { priority: "MEDIUM", status: "SAVED", salaryCurrency: "USD", salaryPeriod: "YEAR" };
    return {
      company: job.company,
      role: job.role,
      location: job.location,
      jobUrl: job.jobUrl,
      priority: "MEDIUM",
      status: "SAVED",
      salaryCurrency: "USD",
      salaryPeriod: "YEAR",
    };
  }, [job]);

  // When user imports, we update the imported banner + initial values by passing a changed initial object
  const [initialOverride, setInitialOverride] = useState<Partial<ApplicationFormState> | null>(null);

  useEffect(() => {
    // if job prefill changes, clear import override
    setInitialOverride(null);
    setImportedData(null);
  }, [job?.jobUrl]);

  const createMut = useMutation<any, Error, ApplicationFormState>({
    mutationFn: async (payload) => {
      // IMPORTANT: applicationsApi expects your mapped Application fields.
      // Our ApplicationFormState matches your applicationsApi.create mapping:
      // company, role, location, jobUrl, dateApplied, status, priority, salaryMin/Max/Currency/Period
      const res = await applicationsApi.create(payload as any);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apps"] });
      navigate("/applications");
    },
  });

  const handleImportSuccess = (data: any) => {
    // Your ImportJobModal already returns ImportedData; we normalize to our ImportedData type.
    const normalized: ImportedData = {
      company: data.company ?? "",
      role: data.role ?? "",
      location: data.location ?? "",
      jobUrl: data.jobUrl ?? "",
      confidence: data.confidence,
      warnings: data.warnings ?? [],
    };

    setImportedData(normalized);

    // Push values into the form by updating "initial"
    setInitialOverride((prev) => ({
      ...(prev ?? initial),
      company: normalized.company ?? "",
      role: normalized.role ?? "",
      location: normalized.location ?? "",
      jobUrl: normalized.jobUrl ?? "",
      priority: (prev?.priority ?? initial.priority ?? "MEDIUM") as any,
      status: (prev?.status ?? initial.status ?? "SAVED") as any,
    }));
  };

  const effectiveInitial = useMemo(
    () => ({ ...initial, ...(initialOverride ?? {}) }),
    [initial, initialOverride]
  );

  return (
    <>
      <ImportJobModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApplicationForm
          title="New Application"
          initial={effectiveInitial}
          importedData={importedData}
          onOpenImport={() => setIsImportModalOpen(true)}
          submitting={createMut.isPending}
          submitError={createMut.isError ? "Error creating application" : null}
          onSubmit={(payload) => createMut.mutate(payload)}
          onCancel={() => navigate("/applications")}
        />
      </div>
    </>
  );
}
