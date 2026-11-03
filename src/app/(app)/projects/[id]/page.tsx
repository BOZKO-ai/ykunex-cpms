import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, canEdit, isManager } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import { money } from "@/lib/utils";
import { Badge, DeadlineInfo, PageHeader, Progress } from "@/components/ui";
import { ActionForm, ConfirmButton, Field, SubmitButton } from "@/components/form";
import { addTask, addUpdate, deleteTask, setProjectArchived, toggleTaskFromForm, addDocument, deleteDocument } from "../actions";
import { FileUpload } from "@/components/file-upload";
import { File as FileIcon, Download, Trash2, Paperclip } from "lucide-react";

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
      tasks: { orderBy: { id: "asc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!p) notFound();
  const s = await getSettings();
  const doneCount = p.tasks.filter((t) => t.done).length;

  const userCanEdit = canEdit(user);
  const userIsManager = isManager(user);

  return (
    <>
      <PageHeader title={p.name} subtitle={p.archived ? "This project is archived." : undefined}>
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

      <section className="card" aria-labelledby="details">
        <h2 id="details">Details</h2>
        <dl className="meta">
          <div>
            <dt>Customer</dt>
            <dd>
              <Link href={`/customers/${p.customerId}`}>{p.customer.name}</Link>
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <Badge label={p.status.label} color={p.status.color} />
            </dd>
          </div>
          <div>
            <dt>Service area</dt>
            <dd>{p.serviceArea.label}</dd>
          </div>
          <div>
            <dt>Assigned to</dt>
            <dd>{p.assignedTo?.name ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt>Start date</dt>
            <dd>{fmtDate(p.startDate)}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>
              <DeadlineInfo deadline={p.deadline} closed={p.status.isClosed} soonDays={s.dueSoonDays} />
            </dd>
          </div>
          <div>
            <dt>Budget</dt>
            <dd>{money(p.budget)}</dd>
          </div>
          <div>
            <dt>Progress</dt>
            <dd>
              <Progress value={p.progress} />
            </dd>
          </div>
        </dl>
        {p.description && (
          <>
            <h3 style={{ marginTop: "1rem" }}>Description</h3>
            <p className="pre">{p.description}</p>
          </>
        )}
      </section>

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
              <FileUpload 
                onFileSelect={(file) => {
                  // This is a bit of a hack to get file data into the form
                  // In a real app we might use a hidden input or a more complex form component
                  if (file) {
                    const form = document.querySelector('form[prefix="add-doc"]') as HTMLFormElement;
                    if (form) {
                      ['name', 'type', 'size', 'data'].forEach(key => {
                        let input = form.querySelector(`input[name="${key}"]`) as HTMLInputElement;
                        if (!input) {
                          input = document.createElement('input');
                          input.type = 'hidden';
                          input.name = key;
                          form.appendChild(input);
                        }
                        input.value = String((file as any)[key]);
                      });
                    }
                  }
                }} 
              />
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                <SubmitButton>Attach File</SubmitButton>
              </div>
            </ActionForm>
          </div>
        )}

        <div className="items">
          {p.documents.length === 0 ? (
            <p className="empty">No documents attached yet.</p>
          ) : (
            p.documents.map((doc) => (
              <div key={doc.id} className="item-row">
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                  <div className="stat-icon" style={{ width: "36px", height: "36px" }}>
                    <FileIcon size={18} />
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.name}
                    </strong>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>
                      {doc.type} • {(doc.size / 1024).toFixed(1)} KB • {fmtDate(doc.createdAt)}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <a 
                    href={doc.data} 
                    download={doc.name} 
                    className="btn-icon" 
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                  {userCanEdit && (
                    <form action={deleteDocument.bind(null, p.id, doc.id)}>
                      <button type="submit" className="btn-icon" title="Delete" style={{ color: "var(--error)" }}>
                        <Trash2 size={16} />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
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
          <h2 id="tasks">
            Checklist {p.tasks.length > 0 && `(${doneCount}/${p.tasks.length} done)`}
          </h2>
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
                        <span className={t.done ? "done" : undefined}>{t.title}</span>
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
            <ActionForm action={addTask.bind(null, p.id)} className="inline-form" prefix="task">
              <Field name="title" label="New task" required />
              <SubmitButton className="btn">Add task</SubmitButton>
            </ActionForm>
          )}
        </section>
      </div>
    </>
  );
}
