import { useState } from "react";
import { Upload, X, File, Loader2 } from "lucide-react";
import api from "../api";

interface FileUploaderProps {
  applicationId: string;
  onUploadComplete?: () => void;
}

export default function FileUploader({
  applicationId,
  onUploadComplete,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      // Step 1: Get presigned URL
      const presignResponse = await api.post(
        `/apps/${applicationId}/attachments/presign`,
        {
          fileName: selectedFile.name,
          contentType: selectedFile.type,
          sizeBytes: selectedFile.size,
        }
      );

      const { uploadUrl, objectKey } = presignResponse.data;

      // Step 2: Upload to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file to storage");
      }

      // Step 3: Confirm upload
      await api.post(`/apps/${applicationId}/attachments/confirm`, {
        objectKey,
        fileName: selectedFile.name,
        contentType: selectedFile.type,
        sizeBytes: selectedFile.size,
      });

      setSelectedFile(null);
      onUploadComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="flex-1 cursor-pointer">
          <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {selectedFile ? selectedFile.name : "Choose file to upload..."}
            </span>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>

        {selectedFile && (
          <button
            onClick={() => setSelectedFile(null)}
            className="p-2 text-gray-400 hover:text-gray-600"
            disabled={uploading}
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {selectedFile && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {selectedFile && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <File className="h-4 w-4" />
          <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
        </div>
      )}
    </div>
  );
}
