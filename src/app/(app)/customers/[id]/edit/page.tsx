import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getList } from "@/lib/lists";
import { CustomerForm } from "@/components/forms";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageHeader } from "@/components/ui";
import { saveCustomer } from "../../actions";

export const metadata = { title: "Edit customer" };

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const c = await db.customer.findUnique({ where: { id } });
  if (!c) notFound();
  const statuses = await getList("CUSTOMER_STATUS", [c.statusId]);
  return (
    <>
      <Breadcrumbs 
        items={[
          { label: "Customers", href: "/customers" },
          { label: c.name, href: `/customers/${c.id}` },
          { label: "Edit" }
        ]} 
      />
      <PageHeader title={`Edit ${c.name}`} subtitle="Fields marked * are required." />
      <CustomerForm
        action={saveCustomer.bind(null, c.id)}
        customer={c}
        statuses={statuses.map((s) => ({ id: s.id, label: s.label }))}
        cancelHref={`/customers/${c.id}`}
      />
    </>
  );
}
