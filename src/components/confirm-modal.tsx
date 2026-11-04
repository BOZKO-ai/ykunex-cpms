"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmBtnRef.current?.focus();
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="confirm-modal-overlay" onClick={onCancel} role="presentation">
          <motion.div
            className="confirm-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
          >
            <div className="confirm-modal-header">
              <div className={`confirm-modal-icon-wrap confirm-${confirmVariant}`}>
                <AlertTriangle size={20} />
              </div>
              <div className="confirm-modal-text">
                <h3 id="confirm-modal-title">{title}</h3>
                <p id="confirm-modal-desc">{message}</p>
              </div>
              <button 
                type="button" 
                className="confirm-modal-close" 
                onClick={onCancel}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                ref={confirmBtnRef}
                className={confirmVariant === "danger" ? "btn btn-danger" : "btn btn-primary"}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Drop-in replacement for native window.confirm() in forms.
 * Opens the custom glassmorphic confirmation modal and submits the parent form on confirmation.
 */
export function ModernConfirmButton({
  message,
  title,
  confirmLabel,
  children,
  className = "btn btn-danger",
  ariaLabel,
  confirmVariant = "danger",
}: {
  message: string;
  title?: string;
  confirmLabel?: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  confirmVariant?: "danger" | "warning" | "primary";
}) {
  const [showModal, setShowModal] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = () => {
    setShowModal(false);
    const form = btnRef.current?.closest("form");
    if (form) {
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.submit();
      }
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={className}
        aria-label={ariaLabel}
        onClick={() => setShowModal(true)}
      >
        {children}
      </button>

      <ConfirmModal
        isOpen={showModal}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        confirmVariant={confirmVariant}
        onConfirm={handleConfirm}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}

