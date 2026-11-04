import Link from "next/link";
import type { Customer, Project } from "@prisma/client";
import { ActionForm, Field, SubmitButton } from "./form";
import { toInputDate } from "@/lib/dates";
import type { FormState } from "@/lib/forms";

export type Opt = { id: number; label: string };
type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const options = (items: Opt[], placeholder: string) => (
  <>
    <option value="">{placeholder}</option>
    {items.map((o) => (
      <option key={o.id} value={o.id}>
        {o.label}
      </option>
    ))}
  </>
);

export function CustomerForm({
  action,
  customer,
  statuses,
  cancelHref,
}: {
  action: Action;
  customer?: Customer;
  statuses: Opt[];
  cancelHref: string;
}) {
  return (
    <ActionForm action={action} className="card form-grid">
      <Field name="name" label="Customer / company name" required defaultValue={customer?.name} wide />
      <Field name="contactPerson" label="Contact person" defaultValue={customer?.contactPerson} />
      <Field name="type" label="Customer type" as="select" required defaultValue={customer?.type ?? "BUSINESS"}>
        <option value="BUSINESS">Business</option>
        <option value="INDIVIDUAL">Individual</option>
      </Field>
      <Field name="email" label="Email" type="email" defaultValue={customer?.email} hint="Optional. Example: name@company.com" autoComplete="off" />
      <Field name="phone" label="Phone" type="tel" defaultValue={customer?.phone} hint="Optional. Example: +94 77 123 4567" autoComplete="off" />
      <Field name="statusId" label="Status" as="select" required defaultValue={customer?.statusId}>
        {options(statuses, "Select status…")}
      </Field>
      <Field name="address" label="Address" as="textarea" rows={2} defaultValue={customer?.address} wide />
      <Field name="notes" label="Notes" as="textarea" rows={4} defaultValue={customer?.notes} wide />
      <div className="form-actions wide">
        <SubmitButton>Save customer</SubmitButton>
        <Link href={cancelHref} className="btn btn-ghost">
          Cancel
        </Link>
      </div>
    </ActionForm>
  );
}

export function ProjectForm({
  action,
  project,
  defaultCustomerId,
  customers,
  areas,
  statuses,
  users,
  cancelHref,
}: {
  action: Action;
  project?: Project;
  defaultCustomerId?: number;
  customers: Opt[];
  areas: Opt[];
  statuses: Opt[];
  users: Opt[];
  cancelHref: string;
}) {
  return (
    <ActionForm action={action} className="card form-grid">
      <Field name="name" label="Project name" required defaultValue={project?.name} wide />
      <Field name="customerId" label="Customer" as="select" required defaultValue={project?.customerId ?? defaultCustomerId}>
        {options(customers, "Select customer…")}
      </Field>
      <Field name="serviceAreaId" label="Service area" as="select" required defaultValue={project?.serviceAreaId}>
        {options(areas, "Select service area…")}
      </Field>
      <Field name="statusId" label="Status" as="select" required defaultValue={project?.statusId}>
        {options(statuses, "Select status…")}
      </Field>
      <Field name="assignedToId" label="Assigned staff" as="select" defaultValue={project?.assignedToId}>
        {options(users, "Unassigned")}
      </Field>
      <Field name="startDate" label="Start date" type="date" required defaultValue={toInputDate(project?.startDate)} />
      <Field name="deadline" label="Deadline" type="date" required defaultValue={toInputDate(project?.deadline)} />
      <Field name="progress" label="Progress (%)" type="number" min={0} max={100} step={1} required defaultValue={project?.progress ?? 0} />
      <Field name="budget" label="Budget (LKR)" type="number" min={0} step="any" defaultValue={project?.budget} hint="Optional" />
      <Field name="paidAmount" label="Paid amount (LKR)" type="number" min={0} step="any" defaultValue={project?.paidAmount ?? 0} hint="Cannot exceed the budget" />
      <Field name="description" label="Description" as="textarea" rows={4} defaultValue={project?.description} wide />
      <div className="form-actions wide">
        <SubmitButton>Save project</SubmitButton>
        <Link href={cancelHref} className="btn btn-ghost">
          Cancel
        </Link>
      </div>
    </ActionForm>
  );
}
