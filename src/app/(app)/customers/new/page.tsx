import { requireUser } from "@/lib/auth";
import { getList } from "@/lib/lists";
import { CustomerForm } from "@/components/forms";
import { PageHeader } from "@/components/ui";
import { saveCustomer } from "../actions";

export const metadata = { title: "Add customer" };

export default async function NewCustomerPage() {
  await requireUser();
  const statuses = await getList("CUSTOMER_STATUS");
  return (
    <>
      <PageHeader title="Add customer" subtitle="Fields marked * are required." />
      <CustomerForm
        action={saveCustomer.bind(null, null)}
        statuses={statuses.map((s) => ({ id: s.id, label: s.label }))}
        cancelHref="/customers"
      />
    </>
  );
}
