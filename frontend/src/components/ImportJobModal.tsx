import React, { useState } from "react";
import {
  X,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import apiClient from "../api";

interface ImportJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: ImportedData) => void;
}

export interface ImportedData {
  company: string;
  role: string;
  location?: string;
  jobUrl?: string;
  description?: string;
  confidence: number;
  warnings: string[];
}

export default function ImportJobModal({
  isOpen,
  onClose,
  onImportSuccess,
}: ImportJobModalProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await apiClient.post<ImportedData>("/apps/import", {
        externalSource: url,
      });
      const data = res.data;

      // If confidence is too low, show error and allow manual entry
      if (data.confidence < 30) {
        setError(
          "Couldn't auto-import this job posting. Please enter details manually."
        );
        setIsLoading(false);
        return;
      }

      // Success - pass data back to parent
      onImportSuccess(data);
      onClose();
      setUrl("");
    } catch (err: any) {
      console.error("Import error:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError(
          "Failed to import job posting. Please try again or enter details manually."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUrl("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Import from URL</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Posting URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              placeholder="https://example.com/jobs/123"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
              autoFocus
            />
            <p className="mt-2 text-sm text-gray-500">
              Paste a link to a job posting from Greenhouse, Lever, Ashby, or
              other job boards
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isLoading || !url.trim()}
            className="cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 80) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
        <CheckCircle2 className="w-3 h-3" />
        High Confidence
      </div>
    );
  } else if (confidence >= 50) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
        <AlertTriangle className="w-3 h-3" />
        Medium Confidence
      </div>
    );
  } else {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
        <AlertCircle className="w-3 h-3" />
        Low Confidence
      </div>
    );
  }
}
