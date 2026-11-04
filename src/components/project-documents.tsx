"use client";

import { useState } from "react";
import { FileIcon, Download, Trash2, Eye } from "lucide-react";
import { fmtDateTime } from "@/lib/dates";
import { DocumentPreviewModal, DocumentItem } from "./document-preview";
import { ModernConfirmButton } from "./confirm-modal";

export interface ProjectDoc {
  id: number;
  name: string;
  type: string;
  size: number;
  data: string;
  createdAt: string | Date;
}

export function ProjectDocumentsList({
  documents,
  projectId,
  userCanEdit,
  deleteAction,
}: {
  documents: ProjectDoc[];
  projectId: number;
  userCanEdit: boolean;
  deleteAction: (docId: number) => Promise<void>;
}) {
  const [activePreview, setActivePreview] = useState<DocumentItem | null>(null);

  if (documents.length === 0) {
    return <p className="empty">No documents attached yet.</p>;
  }

  return (
    <>
      <div className="items">
        {documents.map((doc) => {
          const isPreviewable = /\.(jpe?g|png|webp|gif|svg|pdf)$/i.test(doc.name) || 
            doc.type.startsWith("image/") || 
            doc.type === "application/pdf";

          return (
            <div key={doc.id} className="item-row">
              <div 
                style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, cursor: isPreviewable ? "pointer" : "default" }}
                onClick={() => {
                  if (isPreviewable) {
                    setActivePreview({
                      id: doc.id,
                      name: doc.name,
                      url: doc.data,
                      size: doc.size,
                      createdAt: doc.createdAt,
                    });
                  }
                }}
              >
                <div className="stat-icon" style={{ width: "38px", height: "38px", minWidth: "38px" }}>
                  <FileIcon size={18} />
                </div>
                <div style={{ overflow: "hidden" }}>
                  <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.name}
                  </strong>
                  <span className="muted" style={{ fontSize: "0.78rem" }}>
                    {doc.type} • {(doc.size / 1024).toFixed(1)} KB • Uploaded {fmtDateTime(new Date(doc.createdAt))}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {isPreviewable && (
                  <button
                    type="button"
                    className="btn-icon"
                    title="Preview file"
                    onClick={() => setActivePreview({
                      id: doc.id,
                      name: doc.name,
                      url: doc.data,
                      size: doc.size,
                      createdAt: doc.createdAt,
                    })}
                  >
                    <Eye size={16} />
                  </button>
                )}

                <a 
                  href={doc.data} 
                  download={doc.name} 
                  className="btn-icon" 
                  title="Download"
                >
                  <Download size={16} />
                </a>

                {userCanEdit && (
                  <form action={deleteAction.bind(null, doc.id)}>
                    <ModernConfirmButton
                      message={`Are you sure you want to delete "${doc.name}"? This file will be permanently removed.`}
                      title="Delete Document"
                      confirmLabel="Delete"
                      className="btn-icon"
                      ariaLabel={`Delete ${doc.name}`}
                    >
                      <Trash2 size={16} style={{ color: "var(--error)" }} />
                    </ModernConfirmButton>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <DocumentPreviewModal
        doc={activePreview}
        onClose={() => setActivePreview(null)}
      />
    </>
  );
}
