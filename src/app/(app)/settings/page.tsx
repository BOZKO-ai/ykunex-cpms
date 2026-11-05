import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { LISTS, getAllList, type ListKey } from "@/lib/lists";
import { ActionForm, Check, Field, SubmitButton } from "@/components/form";
import { PageHeader } from "@/components/ui";
import { addListItem, saveBranding, toggleListItem, updateListItem } from "./actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const s = await getSettings();
  const keys = Object.keys(LISTS) as ListKey[];
  const lists = await Promise.all(keys.map(async (k) => ({ key: k, title: LISTS[k], items: await getAllList(k) })));

  return (
    <>
      <PageHeader title="Settings" subtitle="Change how the system looks and which options staff can choose. No code changes needed." />

      <section className="card" aria-labelledby="branding">
        <h2 id="branding">Branding and general</h2>
        <ActionForm action={saveBranding} className="form-grid" prefix="brand">
          <Field name="companyName" label="Company name" required defaultValue={s.companyName} wide />
          <Field name="primaryColor" label="Primary colour (buttons, highlights)" type="color" defaultValue={s.primaryColor} />
          <Field name="accentColor" label="Accent colour (sidebar, links)" type="color" defaultValue={s.accentColor} />
          <Field
            name="dueSoonDays"
            label="“Due soon” window (days)"
            type="number"
            min={1}
            max={60}
            required
            defaultValue={s.dueSoonDays}
            hint="Projects with a deadline within this many days are flagged as due soon."
          />
          <div className="field">
            <label htmlFor="brand-logo">Logo (PNG, JPG, WebP or SVG, max 300 KB)</label>
            <input id="brand-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" />
            <div style={{ display: "flex", gap: ".75rem", alignItems: "center", marginTop: ".5rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="logo-preview" src={s.logoDataUrl || "/logo.svg"} alt="Current logo" />
              {s.logoDataUrl && <Check name="removeLogo" label="Remove custom logo" />}
            </div>
          </div>
          <div className="form-actions wide">
            <SubmitButton>Save settings</SubmitButton>
          </div>
        </ActionForm>
      </section>

      {lists.map((l) => {
        const activeCount = l.items.filter((i) => i.active).length;
        return (
          <section key={l.key} className="card" aria-labelledby={`h-${l.key}`}>
            <h2 id={`h-${l.key}`}>{l.title}</h2>
            <ul className="items">
              {l.items.map((it) => (
                <li key={it.id} className={`item-row${it.active ? "" : " disabled"}`}>
                  <ActionForm action={updateListItem.bind(null, it.id)} className="item-form" prefix={`item-${it.id}`}>
                    <Field name="label" label={`Name of ${it.label}`} hideLabel required defaultValue={it.label} />
                    {l.key !== "SERVICE_AREA" && <Field name="color" label={`Colour of ${it.label}`} hideLabel type="color" defaultValue={it.color} />}
                    {l.key === "PROJECT_STATUS" && <Check name="isClosed" label="Counts as finished" defaultChecked={it.isClosed} />}
                    <SubmitButton className="btn btn-ghost">Save</SubmitButton>
                  </ActionForm>
                  <form action={toggleListItem.bind(null, it.id)}>
                    {!it.active && <span className="chip">Disabled</span>}
                    <button
                      type="submit"
                      className="btn btn-ghost"
                      disabled={it.active && activeCount <= 1}
                      title={it.active && activeCount <= 1 ? "At least one option must stay enabled" : undefined}
                    >
                      {it.active ? "Disable" : "Enable"}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
            <ActionForm action={addListItem.bind(null, l.key)} className="item-form" style={{ marginTop: "1.5rem" }} prefix={`add-${l.key}`}>
              <Field name="label" label={`Add to ${l.title.toLowerCase()}`} required />
              {l.key !== "SERVICE_AREA" && <Field name="color" label="Colour" type="color" defaultValue="#6b7280" />}
              {l.key === "PROJECT_STATUS" && <Check name="isClosed" label="Counts as finished" />}
              <SubmitButton>Add</SubmitButton>
            </ActionForm>
            <p className="hint" style={{ marginTop: "1rem" }}>Disabled options stay on existing records but can&rsquo;t be chosen for new ones.</p>
          </section>
        );
      })}

      <section className="card" aria-labelledby="data">
        <h2 id="data">Data export and backup</h2>
        <p style={{ marginBottom: "1.5rem" }}>Download everything as CSV (opens in Excel). To back up the whole database, run <code>npm run backup</code> on the server.</p>
        <div className="actions">
          <a className="btn" href="/export/customers">
            Customers CSV
          </a>
          <a className="btn" href="/export/projects">
            Projects CSV
          </a>
          <a className="btn" href="/export/payments">
            Payments CSV
          </a>
        </div>
      </section>
    </>
  );
}
