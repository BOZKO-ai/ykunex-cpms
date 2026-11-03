"use client";

import { createContext, useActionState, useContext } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/forms";
import { Loader2 } from "lucide-react";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const Ctx = createContext<{ state: FormState; prefix: string }>({ state: {}, prefix: "f" });

/** Form wired to a server action. Shows a summary message and passes field errors/values to <Field>. */
export function ActionForm({
  action,
  children,
  className,
  style,
  prefix = "f",
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  prefix?: string;
}) {
  const [state, formAction] = useActionState(action, {} as FormState);
  return (
    <form action={formAction} className={className} style={style} noValidate>
      <Ctx.Provider value={{ state, prefix }}>
        {state.message && (
          <div role={state.ok ? "status" : "alert"} className={`alert wide ${state.ok ? "alert-ok" : "alert-error"}`}>
            {state.message}
          </div>
        )}
        {children}
      </Ctx.Provider>
    </form>
  );
}

type FieldProps = {
  name: string;
  label: string;
  type?: string;
  as?: "input" | "select" | "textarea";
  defaultValue?: string | number | null;
  required?: boolean;
  hint?: string;
  wide?: boolean;
  rows?: number;
  hideLabel?: boolean;
  min?: number;
  max?: number;
  step?: string | number;
  placeholder?: string;
  autoComplete?: string;
  children?: React.ReactNode;
};

/** Label + input + hint + error, with the right aria attributes. Keeps what the user typed after a failed save. */
export function Field(p: FieldProps) {
  const { state, prefix } = useContext(Ctx);
  const error = state.errors?.[p.name];
  const value = state.values?.[p.name] ?? (p.defaultValue == null ? "" : String(p.defaultValue));
  const id = `${prefix}-${p.name}`;
  const described = [error ? `${id}-err` : "", p.hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
  const key = `${p.name}:${value}`;
  const common = {
    id,
    name: p.name,
    defaultValue: value,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": described,
    "aria-required": p.required ? true : undefined,
    className: error ? "has-error" : undefined,
  } as const;

  return (
    <div className={`field${p.wide ? " wide" : ""}`}>
      <label htmlFor={id} className={p.hideLabel ? "sr-only" : undefined}>
        {p.label}
        {p.required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      {p.as === "select" ? (
        <select key={key} {...common}>
          {p.children}
        </select>
      ) : p.as === "textarea" ? (
        <textarea key={key} rows={p.rows ?? 3} {...common} />
      ) : (
        <input
          key={key}
          type={p.type ?? "text"}
          min={p.min}
          max={p.max}
          step={p.step}
          placeholder={p.placeholder}
          autoComplete={p.autoComplete}
          {...common}
        />
      )}
      {p.hint && (
        <p id={`${id}-hint`} className="hint">
          {p.hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ children, className = "btn btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" size={16} style={{ marginRight: "0.5rem" }} />
          Saving…
        </>
      ) : children}
    </button>
  );
}

/** Submit button that asks for confirmation first (used for every archive/remove action). */
export function ConfirmButton({
  message,
  children,
  className = "btn btn-danger",
  ariaLabel,
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="check-inline">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} /> {label}
    </label>
  );
}
