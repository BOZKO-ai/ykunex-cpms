# Testing Notes

Results below are based on commands and browser checks actually run during the
final audit on 2 November 2026. A check marked untested was not claimed as
passed.

## Automated checks

| Command | Result | Notes |
|---|---|---|
| `npm test` | PASS | Vitest: 1 file, 18 tests passed |
| `npm run build` | BLOCKED | The MySQL schema compiled, but the configured placeholder credentials could not authenticate against localhost; run after configuring a real MySQL database |
| `npm run typecheck` | PASS after build | The first attempt was before generated `.next/types` existed; after the build generated those types, the same command passed |
| `npm run backup` | BLOCKED | MySQL client tools are not installed in this environment; the script now uses `mysqldump` |

Unit tests cover strict date parsing, customer/project/update validation,
deadline ordering, progress and budget limits, and readable text colour.

## Manual checks

| Area | Result | Notes |
|---|---|---|
| Admin login | PASS | Dummy admin credentials opened the dashboard |
| Add customer | PASS | Created “Assessment Audit Customer” and reached its detail page |
| Edit customer | PASS | Updated the contact person and saw it on the detail page |
| Archive and restore customer | PASS | Confirmation displayed; archive state and Restore action were observed |
| Add linked project | PASS | Created “Assessment Audit Project” for the audit customer |
| Project update | PASS | Posted a dated note and set progress to 55% |
| Search/filter | PASS / boundary noted | Search navigation worked; a deadline outside the seven-day due-soon window was correctly excluded |
| Dashboard | PASS | Overview and “Projects by status” rendered |
| Admin Settings | PASS | Settings screen rendered for the admin |
| CSV export | PASS | Browser navigation to `/export/projects` started a CSV download response |
| Staff permissions | PASS | Staff login redirected `/settings` to `/?denied=1` with the denial message |
| Responsive desktop/tablet/phone | PASS | Browser viewport checks at 1280, 768 and 400px reported no document horizontal overflow after the responsive fix |

## Known issues and unverified checks

- Wrong-password lockout, signed-out Back navigation, checklist actions,
  Settings mutations/upload validation, CSV download, Staff permissions,
  responsive viewports, keyboard-only navigation, and clean-clone setup still
  need manual verification.
- The first standalone typecheck needs a prior Next build when `.next/types`
  is incomplete; after `npm run build`, typecheck passes.
- The live audit added two clearly named dummy records; they contain no real
  customer data.
