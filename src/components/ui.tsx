import Link from "next/link";
import { daysUntil, fmtDate } from "@/lib/dates";
import { qs } from "@/lib/utils";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children && <div className="actions">{children}</div>}
    </header>
  );
}

/** Status pill. Text is always dark; the colour is only a dot, so any admin-chosen colour stays readable. */
export function Badge({ label, color, active = false }: { label: string; color?: string; active?: boolean }) {
  const bg = color ? `${color}15` : "#6b728015";
  return (
    <span className={`badge${active ? " badge-active" : ""}`} style={{ backgroundColor: bg, borderColor: color ? `${color}30` : undefined }}>
      <span className={`dot${active ? " dot-pulse" : ""}`} style={{ background: color ?? "#6b7280" }} aria-hidden="true" />
      {label}
    </span>
  );
}

export function Progress({ value, color }: { value: number; color?: string }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  return (
    <div className="progress-wrap">
      <div className="progress" role="progressbar" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress: ${clampedValue}%`}>
        <span style={{ width: `${clampedValue}%`, backgroundColor: color, boxShadow: color ? `0 0 10px ${color}60` : undefined }} />
      </div>
      <span className="progress-label">{clampedValue}%</span>
    </div>
  );
}

/** Deadline date plus a text chip (never colour alone) when overdue or due soon. */
export function DeadlineInfo({ deadline, closed, soonDays }: { deadline: Date; closed: boolean; soonDays: number }) {
  const d = daysUntil(deadline);
  let chip: React.ReactNode = null;
  if (!closed) {
    if (d < 0) chip = <span className="chip chip-late">Overdue by {Math.abs(d)} {Math.abs(d) === 1 ? "day" : "days"}</span>;
    else if (d === 0) chip = <span className="chip chip-soon chip-critical">Due today</span>;
    else if (d === 1) chip = <span className="chip chip-soon chip-critical">Due tomorrow</span>;
    else if (d <= soonDays) chip = <span className="chip chip-soon">Due in {d} days</span>;
  }
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
      {fmtDate(deadline)} {chip}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string | number | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => `${basePath}${qs({ ...params, page: p })}`;
  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? <Link href={href(page - 1)}>Previous</Link> : <span className="muted">Previous</span>}
      <span>
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? <Link href={href(page + 1)}>Next</Link> : <span className="muted">Next</span>}
    </nav>
  );
}

export function Skeleton({ 
  className, 
  width, 
  height, 
  circle,
  style,
}: { 
  className?: string; 
  width?: string | number; 
  height?: string | number; 
  circle?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div 
      className={`skeleton ${className || ""}`} 
      style={{ 
        width: width || "100%", 
        height: height || "1rem", 
        borderRadius: circle ? "50%" : "4px",
        ...style,
      }} 
    />
  );
}
