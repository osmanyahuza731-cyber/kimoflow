# KIMO GRAPHYX — Business Management System

A real, connected operations platform for a Ghanaian printing, branding and creative-production company: customers, jobs, quotations, inventory, payments, assets, ledger and reports all sharing one database.

This is a large system, so it will be built in stages. Each stage is fully working before the next starts — no placeholder screens, no fake numbers.

## Foundation (built first, in this stage)

**Backend**
Lovable Cloud is switched on to provide the secure database, logins, file storage and server-side rules. Business rules (stock checks, payment confirmation, permissions) are enforced on the server, not just hidden in the interface.

**Accounts and roles**
Email/password login. Roles: Super Admin, Admin, Secretary/Front Desk, Cashier, Accountant, Graphic Artist, Production Operator, Storekeeper, Manager. Roles are stored in a separate permissions table and checked on the server for every sensitive action.

**Design system**
A restrained ERP look: dense professional tables, clear forms, subtle borders, one icon set, strong typography hierarchy, status badges, GHS currency formatting. No gradients, no decorative cards. Sidebar navigation on desktop, drawer on mobile.

**Navigation**
Dashboard · Registrations · Jobs · Payments · Customers · Assets · Configs · Ledger · Reports

## Data model (stage 1)

Core tables with proper relationships and access rules:
profiles, user_roles, customer_types, customers, categories, services, pricing_rules,
jobs, job_items, job_status_history, quotations, quotation_items, invoices, payments,
stores, inventory_items, inventory_transactions, machines, machine_readings,
maintenance_records, staff, staff_documents, expenses, ledger_entries,
notifications, attachments, audit_logs, settings.

Seeded with real starting configuration: the eleven service categories (Secretarial, Graphic Designs, Large Format Printing, DTF Printing, Packages, Souvenirs, Corporate Branding, Site Services, 3D Signages, Books/Paper work, Finishing), the three customer types, default stores, and a realistic demo dataset (customers, jobs at different stages, stock including a low-stock item, partial payments, an overdue debtor, expenses, machines) so every screen can be tested with real data.

## Stage 1 deliverable (this build)

1. Cloud backend, full schema, access rules, seed data
2. Login, sign-out, role-aware sidebar and role-aware dashboard
3. Registrations: walk-in customer, artist, organisation — with search by name, phone or customer ID
4. Customers list and full customer account page (profile, jobs, invoices, payments, balance, notes, files)
5. Configs: categories, services, customer types, pricing, stores, company profile
6. Dashboard wired to real figures, every metric linking to its module

## Later stages (each a follow-up build)

- **Stage 2** — Jobs: creation wizard, requirements, artwork upload, status workflow with audit trail, job sheet printout
- **Stage 3** — Quotations, costing (material/labour/machine/outsourcing), invoices, conversion to job
- **Stage 4** — Inventory: stores, items, stock in/out/transfer/adjustment, automatic material consumption and the production block when stock is insufficient
- **Stage 5** — Payments: Cash, MoMo (sender number + reference), Bank/Cheque with proof upload and confirmation, partial payments, receipts, debtor ageing
- **Stage 6** — Assets and machines: counters, maintenance schedule and alerts, documents
- **Stage 7** — Expenses, ledger, cash books, profit and loss
- **Stage 8** — Reports with filtering and CSV/PDF export, notifications, customer messaging layer, audit log viewer, staff records
- **Stage 9** — Secure webhook endpoint for future kimographyxgh.com lead capture

## Technical notes

- TanStack Start with server functions; all reads/writes go through the server with role checks
- Row-level security on every table; financial and inventory records are reversed through adjustments, never deleted
- Server-side search, filtering, sorting and pagination throughout
- Printable documents (quotation, invoice, receipt, statement, job sheet) use company profile settings
- Messaging and SMS/WhatsApp are built as an integration layer; nothing is reported as sent unless a provider is configured
