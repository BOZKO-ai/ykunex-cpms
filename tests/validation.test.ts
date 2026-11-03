import { describe, expect, it } from "vitest";
import { customerSchema, passwordChangeSchema, projectSchema, updateSchema, userCreateSchema } from "../src/lib/validation";
import { parseDate } from "../src/lib/dates";
import { readableText } from "../src/lib/color";

const validProject = {
  name: "Website",
  customerId: "1",
  serviceAreaId: "2",
  statusId: "3",
  startDate: "2026-11-02",
  deadline: "2026-11-06",
  progress: "10",
  assignedToId: "",
  budget: "",
};

describe("parseDate", () => {
  it("accepts a real date", () => expect(parseDate("2026-11-06")?.toISOString()).toContain("2026-11-06"));
  it("rejects impossible dates and bad formats", () => {
    expect(parseDate("2026-02-31")).toBeNull();
    expect(parseDate("06/11/2026")).toBeNull();
    expect(parseDate("")).toBeNull();
  });
});

describe("customerSchema", () => {
  const base = { name: "Acme", type: "BUSINESS", statusId: "1" };
  it("accepts minimal valid input (email/phone optional)", () => expect(customerSchema.safeParse(base).success).toBe(true));
  it("requires a name", () => expect(customerSchema.safeParse({ ...base, name: "  " }).success).toBe(false));
  it("rejects a malformed email", () => expect(customerSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false));
  it("accepts a valid email", () => expect(customerSchema.safeParse({ ...base, email: "a@b.com" }).success).toBe(true));
  it("rejects a bad phone number", () => expect(customerSchema.safeParse({ ...base, phone: "abc" }).success).toBe(false));
  it("rejects an unknown customer type", () => expect(customerSchema.safeParse({ ...base, type: "OTHER" }).success).toBe(false));
});

describe("projectSchema", () => {
  it("accepts valid input", () => expect(projectSchema.safeParse(validProject).success).toBe(true));
  it("rejects a deadline before the start date", () => {
    const r = projectSchema.safeParse({ ...validProject, deadline: "2026-11-01" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["deadline"]);
  });
  it("accepts a same-day deadline", () => expect(projectSchema.safeParse({ ...validProject, deadline: "2026-11-02" }).success).toBe(true));
  it("rejects progress above 100", () => expect(projectSchema.safeParse({ ...validProject, progress: "101" }).success).toBe(false));
  it("rejects a negative budget", () => expect(projectSchema.safeParse({ ...validProject, budget: "-5" }).success).toBe(false));
  it("rejects a non-numeric budget", () => expect(projectSchema.safeParse({ ...validProject, budget: "abc" }).success).toBe(false));
  it("requires a customer", () => expect(projectSchema.safeParse({ ...validProject, customerId: "" }).success).toBe(false));
});

describe("updateSchema", () => {
  it("requires a note", () => expect(updateSchema.safeParse({ note: "" }).success).toBe(false));
  it("treats empty progress as 'unchanged'", () => {
    const r = updateSchema.safeParse({ note: "Done", progress: "" });
    expect(r.success && r.data.progress).toBeNull();
  });
});

describe("readableText", () => {
  it("uses dark text on gold and light text on near-black", () => {
    expect(readableText("#B8912F")).toBe("#111111");
    expect(readableText("#1F1F1F")).toBe("#ffffff");
  });
});

describe("userCreateSchema", () => {
  const base = { name: "New Staff", email: "new@yakunex.example", password: "Passw0rd", role: "STAFF" };
  it("accepts a valid user", () => expect(userCreateSchema.safeParse(base).success).toBe(true));
  it("rejects a weak password", () => expect(userCreateSchema.safeParse({ ...base, password: "password" }).success).toBe(false));
  it("rejects a malformed email", () => expect(userCreateSchema.safeParse({ ...base, email: "nope" }).success).toBe(false));
  it("rejects an unknown role", () => expect(userCreateSchema.safeParse({ ...base, role: "SUPER" }).success).toBe(false));
});

describe("passwordChangeSchema", () => {
  const base = { currentPassword: "old-pass1", newPassword: "Brand0new", confirmPassword: "Brand0new" };
  it("accepts matching passwords", () => expect(passwordChangeSchema.safeParse(base).success).toBe(true));
  it("rejects mismatched confirmation", () => {
    const r = passwordChangeSchema.safeParse({ ...base, confirmPassword: "different1" });
    expect(r.success).toBe(false);
  });
  it("rejects a weak new password", () => expect(passwordChangeSchema.safeParse({ ...base, newPassword: "short", confirmPassword: "short" }).success).toBe(false));
});
