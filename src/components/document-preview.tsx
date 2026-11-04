"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Image as ImageIcon, Download, X, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";

export interface DocumentItem {
  id: number;
  name: string;
  url: string;
  size?: number | string;
  createdAt?: string | Date;
}

export function DocumentPreviewModal({
  doc,
  onClose,
}: {
  doc: DocumentItem | null;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setZoom(1);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (doc) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [doc, onClose]);

  if (!doc) return null;

  const isImage = /\.(jpe?g|png|webp|gif|svg)$/i.test(doc.name) || doc.url.startsWith("data:image/");
  const isPdf = /\.pdf$/i.test(doc.name) || doc.url.startsWith("data:application/pdf");

  return (
    <AnimatePresence>
      <div className="doc-preview-overlay" onClick={onClose} role="presentation">
        <motion.div
          className="doc-preview-modal"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={doc.name}
        >
          {/* Header */}
          <div className="doc-preview-header">
            <div className="doc-preview-title">
              {isImage ? <ImageIcon size={18} className="gold" /> : <FileText size={18} className="gold" />}
              <span title={doc.name}>{doc.name}</span>
            </div>

            <div className="doc-preview-actions">
              {isImage && (
                <div className="zoom-controls">
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              )}

              <a
                href={doc.url}
                download={doc.name}
                className="btn btn-ghost"
                title="Download file"
                target="_blank"
                rel="noreferrer"
              >
                <Download size={15} />
                <span>Download</span>
              </a>

              <button
                type="button"
                className="btn-icon"
                onClick={onClose}
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content Viewer */}
          <div className="doc-preview-body">
            {isImage ? (
              <div className="doc-image-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.url}
                  alt={doc.name}
                  style={{ transform: `scale(${zoom})`, transition: "transform 0.15s ease-out" }}
                  className="doc-preview-img"
                />
              </div>
            ) : isPdf ? (
              <div className="doc-pdf-wrap">
                <iframe
                  src={doc.url}
                  title={doc.name}
                  className="doc-pdf-iframe"
                />
              </div>
            ) : (
              <div className="doc-fallback-wrap">
                <FileText size={64} className="muted" />
                <h3>{doc.name}</h3>
                <p className="muted">This file type cannot be previewed directly in browser.</p>
                <a
                  href={doc.url}
                  download={doc.name}
                  className="btn btn-primary"
                >
                  <Download size={16} />
                  <span>Download file to view</span>
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

