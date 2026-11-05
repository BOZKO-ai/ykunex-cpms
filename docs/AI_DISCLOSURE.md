# External Resources and AI Disclosure

## AI tools

**Claude (Anthropic)** was used substantially to generate the initial code of
this project (data model, pages, server actions, styles, seed data, tests and
documentation drafts) from the Week 02 project brief. During the final audit,
the code was read, the PDF was checked as the source of truth, and targeted
changes were made to server-side validation and assessment documentation.

**Candidate completion:** I reviewed the generated source and changed the
disabled-list-item validation in the customer and project server actions. I
ran the unit tests, production build, typecheck, backup command, and the
documented browser journey. I will complete the remaining manual checklist
items before submission and must be able to explain the code I submit.

## Libraries

Next.js, React, TypeScript, Prisma (MySQL), Zod, bcryptjs, jose, Vitest and
tsx are free/open-source dependencies listed in `package.json`.

## Other resources

- Placeholder logo (`public/logo.svg`) was created for this project. Replace
  it with the official Yakunex logo through Settings if authorized.
- No templates or paid assets were used. All seed data is fictional.
- No candidate collaboration or copied candidate implementation was used.
- No secrets, real customer records, paid assets, or unauthorized services are
  included in the submission.

## v3 changes
Claude (Anthropic) was also used to add the calendar, payment ledger, customer report, server-side role checks and the `pro.css` refinement. Candidate to complete: confirm that you reviewed and tested these changes yourself.
