"use client";

import { useState } from "react";
import { Upload, X, File, Loader2 } from "lucide-react";

export function FileUpload({ 
  onFileSelect, 
  maxSizeMB = 5 
}: { 
  onFileSelect: (file: { name: string; type: string; size: number; data: string } | null) => void;
  maxSizeMB?: number;
}) {
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large (max ${maxSizeMB}MB)`);
      return;
    }

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFile({ name: selectedFile.name, size: selectedFile.size });
      onFileSelect({
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        data: base64,
      });
      setLoading(false);
    };
    reader.onerror = () => {
      setError("Failed to read file");
      setLoading(false);
    };
    reader.readAsDataURL(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    onFileSelect(null);
    setError(null);
  };

  return (
    <div className="file-upload-wrap">
      {!file ? (
        <div className="upload-zone">
          <input 
            type="file" 
            id="file-upload" 
            onChange={handleFileChange} 
            className="sr-only"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <label htmlFor="file-upload" className="upload-label">
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Upload size={20} />
            )}
            <span>{loading ? "Reading file..." : "Attach Document (PDF, Images, etc.)"}</span>
          </label>
          {error && <p className="error-text" style={{ marginTop: "0.5rem" }}>{error}</p>}
        </div>
      ) : (
        <div className="file-preview-card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
            <File size={20} className="text-primary" />
            <div style={{ overflow: "hidden" }}>
              <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {file.name}
              </strong>
              <span className="muted" style={{ fontSize: "0.75rem" }}>
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
          <button type="button" onClick={clearFile} className="btn-icon" style={{ border: "none" }}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
