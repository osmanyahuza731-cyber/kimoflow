# Roadmap

## Done
- [x] Schema, RLS, RPCs, numbering sequences, audit triggers
- [x] Auth (first user = super admin), role-aware shell, dashboard with live figures
- [x] Registrations, Customers (list + account page), Jobs (list/new/detail, workflow, costing, materials, files), Payments (record/confirm/reject/reverse, receipts, debtors), Assets & stock (items, moves, machines, maintenance), Configs (incl. users/roles, audit log), Ledger, Reports
- [x] Type-check clean; smoke-tested all 9 modules signed in; verified job approve → record payment → confirm → receipt → balance update

## Remaining
- [ ] Notifications (internal system) — not built
- [ ] Customer messaging layer (no provider configured) — not built
- [ ] Website lead webhook for kimographyxgh.com — not built
- [ ] In-app backups — not built (rely on platform backups)
- [ ] Mobile viewport pass on key flows
- [ ] Job materials: seed recipes exist (service_materials=4) but job_materials=0 — verify material consumption flow on a job with materials
