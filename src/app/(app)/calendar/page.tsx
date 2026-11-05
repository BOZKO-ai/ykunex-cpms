import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { DAY, daysUntil, fmtDate, todayUTC } from "@/lib/dates";
import { one, qs, type SP } from "@/lib/utils";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Calendar" };

type Tone = "late" | "soon" | "ok" | "done";
type Ev = { key: string; date: Date; label: string; sub: string; href: string; tone: Tone; task: boolean };

const TONE_TEXT: Record<Tone, string> = { late: "Overdue", soon: "Due soon", ok: "On track", done: "Finished" };
const TONE_MARK: Record<Tone, string> = { late: "▲", soon: "●", ok: "○", done: "✓" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const s = await getSettings();
  const sp = await searchParams;
  const today = todayUTC();

  // ?m=2026-11 picks the month; anything invalid falls back to the current month.
  const m = /^(\d{4})-(\d{2})$/.exec(one(sp.m));
  let year = today.getUTCFullYear();
  let month = today.getUTCMonth();
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12 && Number(m[1]) >= 2000 && Number(m[1]) <= 2100) {
    year = Number(m[1]);
    month = Number(m[2]) - 1;
  }
  const mine = one(sp.mine) === "1";
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  const daysInMonth = Math.round((end.getTime() - start.getTime()) / DAY);
  const lead = (start.getUTCDay() + 6) % 7; // week starts on Monday

  const [projects, tasks] = await Promise.all([
    db.project.findMany({
      where: { archived: false, deadline: { gte: start, lt: end }, ...(mine ? { assignedToId: user.uid } : {}) },
      include: { customer: true, status: true },
      orderBy: { deadline: "asc" },
    }),
    db.task.findMany({
      where: {
        done: false,
        deadline: { gte: start, lt: end },
        project: { archived: false },
        ...(mine ? { OR: [{ assigneeId: user.uid }, { project: { assignedToId: user.uid } }] } : {}),
      },
      include: { project: true },
      orderBy: { deadline: "asc" },
    }),
  ]);

  const toneFor = (d: Date, closed: boolean): Tone => {
    if (closed) return "done";
    const n = daysUntil(d);
    return n < 0 ? "late" : n <= s.dueSoonDays ? "soon" : "ok";
  };

  const events: Ev[] = [
    ...projects.map((p) => ({
      key: `p${p.id}`,
      date: p.deadline,
      label: p.name,
      sub: p.customer.name,
      href: `/projects/${p.id}`,
      tone: toneFor(p.deadline, p.status.isClosed),
      task: false,
    })),
    ...tasks.map((t) => ({
      key: `t${t.id}`,
      date: t.deadline as Date,
      label: t.title,
      sub: `Task in ${t.project.name}`,
      href: `/projects/${t.projectId}`,
      tone: toneFor(t.deadline as Date, false),
      task: true,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const byDay = new Map<number, Ev[]>();
  for (const e of events) {
    const d = e.date.getUTCDate();
    byDay.set(d, [...(byDay.get(d) ?? []), e]);
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  const monthKey = (d: Date) => d.toISOString().slice(0, 7);
  const prev = monthKey(new Date(Date.UTC(year, month - 1, 1)));
  const next = monthKey(new Date(Date.UTC(year, month + 1, 1)));
  const title = start.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const isThisMonth = year === today.getUTCFullYear() && month === today.getUTCMonth();

  return (
    <>
      <PageHeader title="Calendar" subtitle="Project deadlines and open task deadlines, month by month.">
        <Link href={`/calendar${qs({ m: monthKey(today), mine: mine ? "1" : undefined })}`} className="btn">
          Today
        </Link>
        <Link href={`/calendar${qs({ m: monthKey(start), mine: mine ? undefined : "1" })}`} className={`btn${mine ? " btn-primary" : ""}`} aria-pressed={mine}>
          {mine ? "Showing my work" : "Show only my work"}
        </Link>
      </PageHeader>

      <div className="cal-bar">
        <Link href={`/calendar${qs({ m: prev, mine: mine ? "1" : undefined })}`} className="btn" aria-label="Previous month">
          <ChevronLeft size={16} />
        </Link>
        <h2 className="cal-title">{title}</h2>
        <Link href={`/calendar${qs({ m: next, mine: mine ? "1" : undefined })}`} className="btn" aria-label="Next month">
          <ChevronRight size={16} />
        </Link>
      </div>

      <ul className="cal-legend" aria-label="Legend">
        {(Object.keys(TONE_TEXT) as Tone[]).map((t) => (
          <li key={t}>
            <span className={`cal-key ${t}`} aria-hidden="true">{TONE_MARK[t]}</span> {TONE_TEXT[t]}
          </li>
        ))}
        <li>
          <span className="cal-key task" aria-hidden="true">☐</span> Task deadline
        </li>
      </ul>

      <div className="table-wrap">
        <table className="cal">
          <caption className="sr-only">Deadlines in {title}</caption>
          <thead>
            <tr>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <th key={d} scope="col">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => (
              <tr key={i}>
                {w.map((d, j) => {
                  if (d === null) return <td key={j} className="cal-out" aria-hidden="true" />;
                  const list = byDay.get(d) ?? [];
                  const isToday = isThisMonth && d === today.getUTCDate();
                  return (
                    <td key={j} className={isToday ? "cal-today" : undefined}>
                      <span className="cal-num" aria-current={isToday ? "date" : undefined}>
                        {d}
                      </span>
                      {list.slice(0, 3).map((e) => (
                        <Link key={e.key} href={e.href} className={`cal-ev ${e.tone}${e.task ? " task" : ""}`} title={`${TONE_TEXT[e.tone]}: ${e.label} (${e.sub})`}>
                          <span aria-hidden="true">{e.task ? "☐" : TONE_MARK[e.tone]} </span>
                          <span className="sr-only">{TONE_TEXT[e.tone]}: </span>
                          {e.label}
                        </Link>
                      ))}
                      {list.length > 3 && (
                        <a href="#agenda" className="cal-more">
                          +{list.length - 3} more
                        </a>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card" id="agenda" aria-labelledby="agenda-h" style={{ marginTop: "1.25rem" }}>
        <h2 id="agenda-h">Agenda for {title}</h2>
        {events.length === 0 ? (
          <p className="empty">Nothing is due this month.</p>
        ) : (
          <ul className="items">
            {events.map((e) => (
              <li key={e.key} className="item-row">
                <span>
                  <Link href={e.href}>
                    <strong>{e.label}</strong>
                  </Link>
                  <br />
                  <span className="muted">{e.sub}</span>
                </span>
                <span className="cal-agenda-meta">
                  <span className="num">{fmtDate(e.date)}</span>
                  <span className={`chip cal-chip ${e.tone}`}>{TONE_TEXT[e.tone]}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
