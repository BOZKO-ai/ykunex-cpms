import { z } from "zod";
import { parseDate } from "./dates";

const required = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`);

const optional = (max = 500) => z.string().trim().max(max, `Must be ${max} characters or fewer`).default("");

const optEmail = z
  .string()
  .trim()
  .max(200, "Email is too long")
  .default("")
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), "Enter a valid email address, e.g. name@company.com");

const optPhone = z
  .string()
  .trim()
  .max(30, "Phone number is too long")
  .default("")
  .refine((v) => v === "" || /^\+?[\d\s\-()]{7,}$/.test(v), "Enter a valid phone number, e.g. +94 77 123 4567");

const pickId = (what: string) =>
  z.coerce.number({ invalid_type_error: `Select a ${what}` }).int(`Select a ${what}`).positive(`Select a ${what}`);

const dateField = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((v) => parseDate(v) !== null, `${label} is not a valid date`);

const hexColor = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid colour");

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email"),
  password: z.string().min(1, "Enter your password"),
});

export const customerSchema = z.object({
  name: required("Customer name"),
  contactPerson: optional(120),
  email: optEmail,
  phone: optPhone,
  address: optional(300),
  type: z.enum(["INDIVIDUAL", "BUSINESS"], { errorMap: () => ({ message: "Choose a customer type" }) }),
  statusId: pickId("status"),
  notes: optional(2000),
});

export const projectSchema = z
  .object({
    name: required("Project name"),
    customerId: pickId("customer"),
    serviceAreaId: pickId("service area"),
    statusId: pickId("status"),
    description: optional(3000),
    startDate: dateField("Start date"),
    deadline: dateField("Deadline"),
    progress: z.coerce
      .number({ invalid_type_error: "Progress must be a number" })
      .int("Progress must be a whole number")
      .min(0, "Progress must be between 0 and 100")
      .max(100, "Progress must be between 0 and 100"),
    assignedToId: z
      .string()
      .default("")
      .transform((v) => (v.trim() === "" ? null : Number(v)))
      .pipe(z.number({ invalid_type_error: "Choose a valid staff member" }).int().positive().nullable()),
    budget: z
      .string()
      .trim()
      .default("")
      .transform((v) => (v === "" ? null : Math.round(Number(v) * 100) / 100))
      .pipe(z.number({ invalid_type_error: "Budget must be a number" }).min(0, "Budget cannot be negative").nullable()),
    paidAmount: z
      .string()
      .trim()
      .default("0")
      .transform((v) => (v === "" ? 0 : Math.round(Number(v) * 100) / 100))
      .pipe(z.number({ invalid_type_error: "Paid amount must be a number" }).min(0, "Paid amount cannot be negative")),
  })
  .refine(
    (d) => {
      const s = parseDate(d.startDate);
      const e = parseDate(d.deadline);
      return !s || !e || e >= s;
    },
    { path: ["deadline"], message: "Deadline must be on or after the start date" },
  )
  .refine((d) => d.budget === null || d.paidAmount <= d.budget, {
    path: ["paidAmount"],
    message: "Paid amount cannot exceed the project budget",
  });

export const updateSchema = z.object({
  note: required("Update note", 2000),
  progress: z
    .string()
    .trim()
    .default("")
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(
      z
        .number({ invalid_type_error: "Progress must be a number" })
        .int("Progress must be a whole number")
        .min(0, "Progress must be between 0 and 100")
        .max(100, "Progress must be between 0 and 100")
        .nullable(),
    ),
});

export const taskSchema = z.object({
  title: required("Task", 150),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"], { errorMap: () => ({ message: "Choose a valid priority" }) }).default("MEDIUM"),
  deadline: z
    .string()
    .trim()
    .default("")
    .refine((v) => v === "" || parseDate(v) !== null, "Deadline is not a valid date"),
  assigneeId: z
    .string()
    .default("")
    .transform((v) => (v.trim() === "" ? null : Number(v)))
    .pipe(z.number({ invalid_type_error: "Choose a valid staff member" }).int().positive().nullable()),
});

export const listItemSchema = z.object({
  label: required("Name", 60),
  color: hexColor.default("#6b7280"),
});

export const brandingSchema = z.object({
  companyName: required("Company name", 80),
  primaryColor: hexColor,
  accentColor: hexColor,
  dueSoonDays: z.coerce
    .number({ invalid_type_error: "Enter a number of days" })
    .int("Enter a whole number of days")
    .min(1, "Use between 1 and 60 days")
    .max(60, "Use between 1 and 60 days"),
});

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Use at least one letter and one number")
  .refine((v) => /^[a-zA-Z0-9!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|~`-]+$/.test(v), "Password contains invalid characters");

export const userCreateSchema = z.object({
  name: required("Full name", 120),
  email: optEmail.refine((v) => v !== "", "Email is required"),
  password,
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "VIEWER"], { errorMap: () => ({ message: "Choose a role" }) }),
});

export const userUpdateSchema = z.object({
  name: required("Full name", 120),
  email: optEmail.refine((v) => v !== "", "Email is required"),
  role: z.enum(["ADMIN", "MANAGER", "STAFF", "VIEWER"], { errorMap: () => ({ message: "Choose a role" }) }),
});

export const userProfileSchema = z.object({
  name: required("Full name", 120),
  phone: optPhone,
  bio: optional(1000),
  department: optional(100),
  birthDate: z
    .string()
    .trim()
    .default("")
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || parseDate(v) !== null, "Enter a valid date")
    .nullable(),
  image: z.string().trim().default("").nullable(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
