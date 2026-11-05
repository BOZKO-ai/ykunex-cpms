import { ActionForm, ConfirmButton, Field, SubmitButton } from "./form";
import { addPayment, deletePayment } from "@/app/(app)/projects/actions";
import { fmtDate, toInputDate, todayUTC } from "@/lib/dates";
import { money } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/validation";

type Row = { id: number; amount: number; paidOn: Date; method: string; reference: string; note: string };

/** Payment history for one project: what was agreed, what has been received, what is left. */
export function PaymentLedger({
  projectId,
  budget,
  paid,
  payments,
  canRecord,
  canRemove,
}: {
  projectId: number;
  budget: number | null;
  paid: number;
  payments: Row[];
  canRecord: boolean;
  canRemove: boolean;
}) {
  const balance = budget === null ? null : Math.max(0, budget - paid);
  const pct = budget ? Math.min(100, Math.round((paid / budget) * 100)) : 0;
  const ledgerTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const earlier = Math.round((paid - ledgerTotal) * 100) / 100; // paid before the ledger existed
  const status = budget === null ? "Budget not set" : paid >= budget ? "Paid in full" : paid > 0 ? "Partially paid" : "Unpaid";

  return (
    <section className="card" aria-labelledby="payments">
      <h2 id="payments">Payments</h2>

      <div className="ledger-summary">
        <div>
          <span>Budget</span>
          <strong className="num">{money(budget)}</strong>
        </div>
        <div>
          <span>Received</span>
          <strong className="num">{money(paid)}</strong>
        </div>
        <div>
          <span>Balance</span>
          <strong className="num">{money(balance)}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{status}</strong>
        </div>
      </div>
      {budget !== null && (
        <div className="ledger-meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Share of budget received">
          <span style={{ width: `${pct}%` }} />
        </div>
      )}

      {payments.length === 0 && earlier <= 0 ? (
        <p className="empty">No payments recorded yet.</p>
      ) : (
        <div className="table-wrap" style={{ marginTop: "1rem" }}>
          <table style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Amount</th>
                <th scope="col">Method</th>
                <th scope="col">Reference</th>
                <th scope="col">Note</th>
                {canRemove && <th scope="col">Action</th>}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{fmtDate(p.paidOn)}</td>
                  <td className="num">{money(p.amount)}</td>
                  <td>{PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS] ?? p.method}</td>
                  <td>{p.reference || "—"}</td>
                  <td>{p.note || "—"}</td>
                  {canRemove && (
                    <td>
                      <form action={deletePayment.bind(null, projectId, p.id)}>
                        <ConfirmButton
                          message={`Remove this payment of ${money(p.amount)}? The received total will go down by the same amount.`}
                          className="btn btn-link"
                          ariaLabel={`Remove payment of ${money(p.amount)} from ${fmtDate(p.paidOn)}`}
                        >
                          Remove
                        </ConfirmButton>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
              {earlier > 0 && (
                <tr>
                  <td>—</td>
                  <td className="num">{money(earlier)}</td>
                  <td colSpan={canRemove ? 4 : 3}>Recorded before the payment ledger was added</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {canRecord && (balance === null || balance > 0) && (
        <>
          <h3 style={{ marginTop: "1.25rem" }}>Record a payment</h3>
          <ActionForm action={addPayment.bind(null, projectId)} className="form-grid" prefix="pay">
            <Field name="amount" label="Amount (LKR)" type="number" min={0} step="any" required hint={balance === null ? undefined : `Up to ${money(balance)}`} />
            <Field name="paidOn" label="Payment date" type="date" required defaultValue={toInputDate(todayUTC())} />
            <Field name="method" label="Method" as="select" required defaultValue="BANK_TRANSFER">
              {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Field>
            <Field name="reference" label="Reference / invoice no." hint="Optional" />
            <Field name="note" label="Note" wide hint="Optional" />
            <div className="form-actions wide">
              <SubmitButton>Record payment</SubmitButton>
            </div>
          </ActionForm>
        </>
      )}
    </section>
  );
}
