import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, canEdit, isManager } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { fmtDate, fmtDateTime, toInputDate, todayUTC } from "@/lib/dates";
import { money } from "@/lib/utils";
import { Badge, DeadlineInfo, PageHeader, Progress } from "@/components/ui";
import { ActionForm, ConfirmButton, Field, SubmitButton } from "@/components/form";
import { addTask, addUpdate, deleteTask, setProjectArchived, toggleTaskFromForm, addDocument, deleteDocument } from "../actions";
import { FileUpload } from "@/components/file-upload";
import { ProjectTimer } from "@/components/project-timer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProjectDocumentsList } from "@/components/project-documents";
import { PaymentLedger } from "@/components/payment-ledger";
import { File as FileIcon, Download, Trash2, Paperclip, Printer } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await db.project.findUnique({ where: { id: Number((await params).id) || 0 } });
  return { title: p?.name ?? "Project" };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const p = await db.project.findUnique({
    where: { id },
    include: {
      customer: true,
      status: true,
      serviceArea: true,
      assignedTo: true,
      updates: { orderBy: { createdAt: "desc" }, include: { author: true } },
      tasks: { orderBy: [{ done: "asc" }, { deadline: "asc" }, { id: "asc" }], include: { assignee: true } },
      documents: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: [{ paidOn: "desc" }, { id: "desc" }] },
    },
  });
  if (!p) notFound();
  const s = await getSettings();
  const doneCount = p.tasks.filter((t) => t.done).length;
  const taskUsers = await db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  const today = todayUTC();

  const userCanEdit = canEdit(user);
  const userIsManager = isManager(user);

  return (
    <>
      <Breadcrumbs 
        items={[
          { label: "Projects", href: "/projects" },
          { label: p.name }
        ]} 
      />

      <PageHeader title={p.name} subtitle={p.archived ? "This project is archived." : undefined}>
        <Link href={`/projects/${p.id}/report`} target="_blank" className="btn" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
          <Printer size={15} /> Report
        </Link>
        {userIsManager && (
          <>
            <Link href={`/projects/${p.id}/edit`} className="btn">
              Edit
            </Link>
            {p.archived ? (
              <form action={setProjectArchived.bind(null, p.id, false)}>
                <button type="submit" className="btn">
                  Restore
                </button>
              </form>
            ) : (
              <form action={setProjectArchived.bind(null, p.id, true)}>
                <ConfirmButton message={`Archive "${p.name}"? It will be hidden from the project list and dashboard. You can restore it later.`}>
                  Archive
                </ConfirmButton>
              </form>
            )}
          </>
        )}
      </PageHeader>

      <section className="card project-details-card" aria-labelledby="details">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Project overview</p>
            <h2 id="details">Details</h2>
          </div>
          <span className="project-id">#{p.id}</span>
        </div>
        <dl className="meta project-details-grid">
          <div className="detail-item">
            <dt>Customer</dt>
            <dd>
              <Link href={`/customers/${p.customerId}`}>{p.customer.name}</Link>
            </dd>
          </div>
          <div className="detail-item">
            <dt>Status</dt>
            <dd>
              <Badge label={p.status.label} color={p.status.color} active={!p.status.isClosed} />
            </dd>
          </div>
          <div className="detail-item">
            <dt>Service area</dt>
            <dd>{p.serviceArea.label}</dd>
          </div>
          <div className="detail-item">
            <dt>Assigned to</dt>
            <dd>{p.assignedTo?.name ?? "Unassigned"}</dd>
          </div>
          <div className="detail-item">
            <dt>Start date</dt>
            <dd>{fmtDate(p.startDate)}</dd>
          </div>
          <div className="detail-item">
            <dt>Deadline</dt>
            <dd>
              <DeadlineInfo deadline={p.deadline} closed={p.status.isClosed} soonDays={s.dueSoonDays} />
            </dd>
          </div>
          <div className="detail-item detail-finance">
            <dt>Budget</dt>
            <dd>{money(p.budget)}</dd>
          </div>
          <div className="detail-item detail-finance">
            <dt>Paid</dt>
            <dd>{money(p.paidAmount)}</dd>
          </div>
          <div className="detail-item detail-finance">
            <dt>Due</dt>
            <dd>{money(p.budget === null ? null : Math.max(0, p.budget - p.paidAmount))}</dd>
          </div>
          <div className="detail-item">
            <dt>Payment status</dt>
            <dd>
              <span className={`payment-status payment-status-${p.budget === null ? "unknown" : p.paidAmount >= p.budget ? "paid" : p.paidAmount > 0 ? "partial" : "due"}`}>
                {p.budget === null ? "Not set" : p.paidAmount >= p.budget ? "Paid" : p.paidAmount > 0 ? "Partially paid" : "Unpaid"}
              </span>
            </dd>
          </div>
          <div className="detail-item detail-progress">
            <dt>Progress</dt>
            <dd>
              <Progress value={p.progress} />
            </dd>
          </div>
        </dl>
        {p.description && (
          <div className="project-description">
            <h3>Description</h3>
            <p className="pre">{p.description}</p>
          </div>
        )}
      </section>

      <PaymentLedger
        projectId={p.id}
        budget={p.budget}
        paid={p.paidAmount}
        payments={p.payments}
        canRecord={userCanEdit}
        canRemove={userIsManager}
      />

      <div className="grid-2">
        <section className="card" aria-labelledby="documents">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 id="documents" style={{ margin: 0 }}>Documents</h2>
          <span className="muted" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Paperclip size={16} /> {p.documents.length} attached
          </span>
        </div>

        {userCanEdit && (
          <div className="card" style={{ background: "rgba(255,255,255,0.02)", marginBottom: "1.5rem" }}>
            <ActionForm action={addDocument.bind(null, p.id)} prefix="add-doc">
              <FileUpload />
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                <SubmitButton>Attach File</SubmitButton>
              </div>
            </ActionForm>
          </div>
        )}

        <ProjectDocumentsList
          documents={p.documents.map(d => ({
            id: d.id,
            name: d.name,
            type: d.type,
            size: d.size,
            data: d.data,
            createdAt: d.createdAt,
          }))}
          projectId={p.id}
          userCanEdit={userCanEdit}
          deleteAction={async (docId: number) => {
            "use server";
            await deleteDocument(p.id, docId);
          }}
        />
      </section>

      <section className="card" aria-labelledby="updates">
          <h2 id="updates">Updates ({p.updates.length})</h2>
          {userCanEdit && (
            <ActionForm action={addUpdate.bind(null, p.id)} className="form-grid" prefix="upd">
              <Field name="note" label="What happened?" as="textarea" rows={3} required wide placeholder="e.g. Client approved the design mock-ups." />
              <Field name="progress" label="New progress (%)" type="number" min={0} max={100} step={1} hint={`Optional. Currently ${p.progress}%.`} />
              <div className="form-actions" style={{ alignSelf: "end" }}>
                <SubmitButton>Post update</SubmitButton>
              </div>
            </ActionForm>
          )}
          {p.updates.length === 0 ? (
            <p className="empty">No updates yet. {userCanEdit && "Post the first one above."}</p>
          ) : (
            <ol className="timeline">
              {p.updates.map((u) => (
                <li key={u.id}>
                  <div className="tl-head">
                    <strong>{fmtDateTime(u.createdAt)}</strong> · {u.author.name}
                    {u.progress !== null && <span className="chip">Progress set to {u.progress}%</span>}
                  </div>
                  <p>{u.note}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card" aria-labelledby="tasks">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
            <h2 id="tasks" style={{ margin: 0 }}>
              Checklist {p.tasks.length > 0 && `(${doneCount}/${p.tasks.length} done)`}
            </h2>
            <ProjectTimer projectId={p.id} projectName={p.name} />
          </div>
          {p.tasks.length === 0 ? (
            <p className="muted">No tasks yet.</p>
          ) : (
            <ul className="checklist">
              {p.tasks.map((t) => (
                <li key={t.id}>
                  {userCanEdit ? (
                    <form action={toggleTaskFromForm}>
                      <input type="hidden" name="taskId" value={t.id} />
                      <button type="submit" className="check-btn" aria-pressed={t.done}>
                        <span className="box" aria-hidden="true">
                          {t.done ? "✓" : ""}
                        </span>
                        <span className={t.done ? "done" : undefined}>
                          {t.title}
                          <span className="task-meta">
                            <span className={`task-priority task-priority-${t.priority.toLowerCase()}`}>{t.priority.toLowerCase()}</span>
                            {t.assignee && <span>{t.assignee.name}</span>}
                            {t.deadline && !t.done && (
                              <span className={t.deadline < today ? "task-overdue" : undefined}>
                                Due {fmtDate(t.deadline)}{t.deadline < today ? " · overdue" : ""}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </form>
                  ) : (
                    <div className="check-btn" style={{ cursor: "default" }}>
                      <span className="box" aria-hidden="true">
                        {t.done ? "✓" : ""}
                      </span>
                      <span className={t.done ? "done" : undefined}>{t.title}</span>
                    </div>
                  )}
                  {userIsManager && (
                    <form action={deleteTask.bind(null, p.id, t.id)}>
                      <ConfirmButton message={`Remove the task "${t.title}"?`} className="btn btn-link" ariaLabel={`Remove task ${t.title}`}>
                        Remove
                      </ConfirmButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
          {userCanEdit && (
            <ActionForm action={addTask.bind(null, p.id)} className="task-form" prefix="task">
              <Field name="title" label="New task" required />
              <Field name="priority" label="Priority" as="select" defaultValue="MEDIUM">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Field>
              <Field name="deadline" label="Deadline" type="date" />
              <Field name="assigneeId" label="Assign to" as="select">
                <option value="">Unassigned</option>
                {taskUsers.map((taskUser) => <option key={taskUser.id} value={taskUser.id}>{taskUser.name}</option>)}
              </Field>
              <SubmitButton className="btn">Add task</SubmitButton>
            </ActionForm>
          )}
        </section>
      </div>
    </>
  );
}
