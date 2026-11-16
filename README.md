# Kimoflow

KIMO GRAPHYX — MASTER WEB APPLICATION DEVELOPMENT PROMPT

1. ROLE

Act as a senior full-stack software architect, UI/UX designer, database engineer, security engineer, and production web developer.

You are building a real-world business management system for KIMO GRAPHYX.

Do NOT build a simple demo, static website, mock dashboard, or collection of disconnected pages.

Build a complete, interconnected, production-ready business management web application.

The application must feel like software designed and developed by an experienced human product team—not like generic AI-generated code.

Every important button, form, menu, calculation, workflow, filter, search field, status change, upload, and action must work.

2. BUSINESS SYSTEM OBJECTIVE

KIMO GRAPHYX needs a centralized business management system accessible from anywhere through secure login.

The system must manage:

Customers

Walk-in customers

Artists

Organizations/NGOs

Jobs

Services

Categories

Quotations

Invoices

Payments

Debtors

Creditors

Inventory

Stores

Consumables

Materials

Machines

Assets

Staff

Staff documents

Expenses

Ledger

Cash books

Profit and loss

Reports

Customer communication

System configuration

User permissions

Audit logs

The original business requirements specifically require customer, job, payment, report, asset, ledger and staff information to be maintained and updated centrally, with staff access controlled according to their job responsibilities.

3. IMPORTANT DEVELOPMENT RULE

Do not treat each page as an isolated interface.

The application must have a single connected data model.

For example:

REGISTRATION
↓
CUSTOMER
↓
JOB
↓
SERVICES
↓
QUOTATION / COSTING
↓
MATERIAL REQUIREMENTS
↓
INVENTORY CHECK
↓
JOB APPROVAL
↓
PRODUCTION
↓
PAYMENT
↓
RECEIPT
↓
DEBTOR BALANCE
↓
JOB COMPLETION
↓
PROFIT / LOSS
↓
REPORTING

Actions in one module must automatically update related modules.

Do not use fake numbers or hard-coded values to simulate functionality.

4. MAIN NAVIGATION

Use the following primary navigation structure:

DASHBOARD

REGISTRATIONS

JOBS

PAYMENTS

CUSTOMERS

ASSETS

CONFIGS

LEDGER

REPORTS

The original system specification identifies:

REGISTRATION – JOBS – PAYMENT – CUSTOMERS – ASSETS – CONFIGS – LEDGER – REPORTS.

You may add supporting submenus where necessary, but do not remove these core modules.

5. DESIGN DIRECTION

The interface must look like a professional Ghanaian printing, branding and creative-production company's internal business platform.

Avoid the stereotypical AI-generated SaaS appearance.

DO NOT:

Overuse gradients

Use excessive rounded cards

Put every item inside a card

Use huge decorative headings

Use unnecessary animations

Use excessive glassmorphism

Use random colorful icons

Use oversized empty spaces

Use generic stock illustrations

Use fake statistics

Use meaningless dashboard widgets

Use repetitive cards everywhere

Use purple/blue AI-style gradients simply because they look modern

Instead use:

Strong visual hierarchy

Clean typography

Consistent spacing

Professional tables

Clear form layouts

Subtle borders

Restrained shadows

Consistent iconography

Practical information density

Clear status indicators

Proper alignment

Realistic business data

Useful empty states

Subtle transitions

Professional desktop dashboard design

The application should look like a real ERP/business management system.

6. RESPONSIVE DESIGN

The system must work properly on:

Desktop

Laptop

Tablet

Mobile

Desktop should prioritize productivity.

Mobile should not simply shrink the desktop interface.

On mobile:

Tables should become responsive

Important columns should remain visible

Secondary information can collapse

Forms should become single-column

Navigation should become a drawer

Actions should remain easy to access

Modals should fit the screen

Buttons should remain touch-friendly

Do not allow horizontal overflow unless genuinely necessary.

7. DASHBOARD

Create a professional operational dashboard.

Show real information pulled from the database.

Include:

Financial overview

Today's sales

This week's sales

This month's sales

Outstanding debtors

Expenses

Net position

Profit/loss

Operations

New jobs

Jobs awaiting approval

Jobs in production

Jobs awaiting payment

Jobs ready for collection

Completed jobs

Cancelled jobs

Inventory

Low-stock materials

Out-of-stock materials

Recent stock movements

Materials consumed today

Customer activity

New customers

Returning customers

Outstanding customer balances

Machine/asset alerts

Maintenance due

Machines unavailable

Machines requiring attention

Dashboard activity

Show a chronological recent-activity feed such as:

"Payment received"

"New job created"

"Inventory adjusted"

"Job moved to production"

"Customer registered"

"Quotation approved"

Every dashboard metric must link to the relevant module.

8. REGISTRATIONS

The registration system must support:

Walk-in Customer

Artist

Organization/NGO

The original specification explicitly requires all new customers, Artists and Organizations/NGOs to be registered.

Each registration type can have different pricing rules and business rules.

Customer fields

Include appropriate fields such as:

Customer ID

Customer type

Full name / organization name

Phone

Alternative phone

Email

Address

Location

Registration date

Preferred communication method

Notes

Assigned staff

Customer status

For organizations:

Organization name

Contact person

Position

Phone

Email

Address

Registration details

Notes

For Artists:

Artist name

Stage/business name where applicable

Phone

Email

Service category

Pricing classification

Notes

Customer search

Existing customers must be searchable by:

Name

Phone number

Customer ID

The original specification specifically requires old customers to be searchable by name/phone number.

When an existing customer is selected, automatically load their existing account information.

9. CUSTOMER PRICING TYPES

Create configurable customer pricing groups.

At minimum:

Walk-in Customer

Artist

Organization/NGO

Pricing must be configurable by administrators.

Do not hard-code prices.

Allow administrators to define:

Standard price

Customer-type price

Discount

Promotional price

Minimum price

Special pricing

Record who changed pricing and when.

10. SERVICE CATEGORIES

Create configurable service categories.

Initial categories from the business specification include:

Secretarial

Graphic Designs

Large Format Printing

DTF Printing

Packages

Souvenirs

Corporate Branding

Site Services

3D Signages

Books/Paper work

Finishing

These must be configurable from CONFIGS.

Do not hard-code the categories into the frontend.

Administrators must be able to:

Add category

Edit category

Disable category

Reorder category

Add service

Edit service

Disable service

11. SERVICE MANAGEMENT

Each service should support configurable information such as:

Service name

Category

Description

Base price

Unit

Minimum quantity

Required materials

Required machine

Estimated production time

Labour cost

Default profit margin

Active/inactive status

Examples:

Banner printing

Flyer printing

Business cards

T-shirt printing

DTF printing

Signage

Graphic design

Lamination

Binding

Typing

Photocopying

Souvenir production

Do not assume these are the only services.

Administrators must be able to create their own.

12. JOB MANAGEMENT

The JOBS module is the operational center of the system.

The original requirement states that registered jobs should be displayed with customer name/telephone number and selected categories/services.

Display jobs in a professional table.

Columns can include:

Job number

Customer

Phone

Category

Service

Quantity

Assigned staff

Status

Payment status

Due date

Amount

Balance

Created date

Priority

Include:

Search

Filter

Sort

Pagination

Date range

Status filter

Category filter

Staff filter

Payment filter

13. JOB CREATION

When creating a job:

Step 1

Select existing customer or create a new customer.

Step 2

Select service category.

Step 3

Select service.

Step 4

Enter job requirements.

Possible fields:

Type

Size

Quantity

Material

Color

Finishing

Machine

Design requirements

Customer instructions

Deadline

Assigned artist/operator

Priority

Upload artwork/reference files

The original requirement specifically calls for details such as type, machine, size, cost and quantity to be entered when understanding the customer's request.

14. JOB STATUS WORKFLOW

Implement a controlled workflow:

DRAFT
→ QUOTED
→ AWAITING APPROVAL
→ APPROVED
→ AWAITING PAYMENT
→ READY FOR PRODUCTION
→ IN PRODUCTION
→ QUALITY CHECK
→ READY FOR COLLECTION/DELIVERY
→ COMPLETED

Also support:

CANCELLED

ON HOLD

Only authorized roles may move jobs between certain statuses.

Every status change must be recorded in the audit log.

15. QUOTATION SYSTEM

Create a quotation system.

A quotation must include:

Quotation number

Customer

Date

Expiry date

Services

Quantity

Unit price

Discount

Tax where configured

Total

Terms

Notes

Actions:

Save

Edit

Print

Download

Send

Approve

Reject

Convert to job

Once accepted, allow conversion into an active job without re-entering information.

16. COSTING SYSTEM

The system must calculate actual job costs.

Support:

Material cost

Based on actual material consumption.

Labour cost

Based on configurable labour cost.

Machine cost

Based on machine usage where configured.

Outsourcing cost

Other job expenses

Calculate:

TOTAL COST

SELLING PRICE

GROSS PROFIT

PROFIT MARGIN

Do not calculate profit merely as selling price minus estimated material cost.

Where actual costs become available, use actual costs.

17. INVENTORY / STORES

The business requires stores to be created inside inventory.

Support multiple stores such as:

Main Store

Printing Materials

DTF Materials

Finishing Materials

Souvenir Materials

Administrators can create additional stores.

18. INVENTORY ITEMS

Each item should have:

Item ID

Item name

Category

Unit

Store

Quantity

Minimum quantity

Reorder level

Cost per unit

Supplier

Purchase date

Batch/reference

Expiry date where applicable

Active status

Support:

Stock in

Stock out

Transfer

Adjustment

Consumption

Returns

Damaged stock

19. AUTOMATIC MATERIAL CONSUMPTION

This is a critical business rule.

When a job requires materials:

System checks available usable stock.

System calculates required quantity.

If sufficient stock exists, reserve/deduct according to workflow.

If stock is insufficient, prevent the job from proceeding into production.

Show exactly which material is unavailable.

Allow authorized administrators/storekeepers to transfer stock from another store or make it available.

Record the entire transaction.

The original specification explicitly requires jobs requiring unavailable consumables to be blocked until authorized stock is moved into usable availability.

Never silently allow negative inventory.

20. MATERIAL USAGE / JOB PROFITABILITY

For every job, record material consumption.

For example:

Job #KG-000124

Material:
Vinyl — 5 meters

Ink — 40ml

Lamination — 5 meters

Calculate the actual material cost and associate it with the job.

This must feed into job profitability reports.

21. PAYMENT SYSTEM

The PAYMENT module must show:

Customer

Phone

Job

Invoice

Total amount

Amount paid

Outstanding balance

Payment status

Payment method

The original specification requires Cash, MoMo and Bank/Cheque payment modes.

Payment methods:

CASH

Record:

Amount

Date

Cashier

Reference

MOBILE MONEY

Record:

Amount

Transaction/reference number

Sender's phone number

MoMo account

Date

Confirmed by

Confirmation time

The business specification specifically requires the number that sent the MoMo payment to be entered to confirm payment.

BANK / CHEQUE

Require:

Bank/account

Amount

Transaction/reference number

Cheque number where applicable

Proof of payment upload

Date

Confirmation

Do not mark the payment as confirmed until authorized verification is completed.

The original requirements also specify proof of payment for Bank/Cheque and selection of the relevant account for MoMo/Bank payments.

22. PARTIAL PAYMENTS

Allow customers to make multiple payments.

Example:

Invoice = GHS 5,000

Payment 1 = GHS 2,000

Payment 2 = GHS 1,500

Balance = GHS 1,500

The system must automatically maintain:

Total invoice

Total paid

Balance

Payment history

Do not overwrite previous payments.

23. RECEIPTS

Once a payment is confirmed:

Generate a professional receipt.

Include:

KIMO GRAPHYX branding

Receipt number

Customer

Job

Invoice

Payment amount

Payment method

Reference

Date

Previous balance

Remaining balance

Cashier/authorized user

Allow:

Print

Download PDF

Send/share

The original requirement explicitly calls for a payment receipt once payment is confirmed.

24. DEBTOR MANAGEMENT

Create a dedicated debtor system.

Show:

Customer

Invoice

Total amount

Amount paid

Balance

Due date

Days overdue

Last payment

Payment history

Add aging:

Current

1–30 days

31–60 days

61–90 days

90+ days

Allow authorized users to:

Record payment

View statement

Send reminder

Set credit limit

Put account on credit hold

Do not allow unauthorized users to change debtor balances manually.

25. CUSTOMER ACCOUNT

Each customer should have a detailed account page containing:

Personal/company information

Registration information

Jobs

Quotations

Invoices

Payments

Outstanding debt

Account statement

Files

Notes

Communication history

Restrict sensitive financial information to authorized users.

The original specification specifically describes the customer area as containing detailed customer accounts with restricted access.

26. ASSETS

The ASSETS module must manage:

Inventory

Machines

Equipment

Purchased assets

Asset documents

The source specification requires inventory/stocks, machines, purchased receipts and proof uploads to be managed here.

For machines record:

Machine name

Manufacturer

Model

Serial number

Purchase date

Purchase price

Supplier

Warranty

Current status

Location

Counter reading

Last maintenance

Next maintenance

Purchase receipt

Other documents

27. MACHINE COUNTERS

Allow machine counters to be recorded:

Counter at purchase

Current counter

Counter history

Date

Updated by

The system should allow machine usage to contribute to job costing where configured.

28. MACHINE MAINTENANCE

Support:

Maintenance schedule

Maintenance history

Maintenance cost

Service provider

Parts replaced

Next maintenance date

Maintenance documents

Create alerts when maintenance is due.

29. STAFF MANAGEMENT

Create staff profiles.

Include:

Staff ID

Full name

Phone

Email

Position

Department

Employment status

Start date

Profile photo

Emergency contact

Assigned permissions

Documents

Notes

Allow upload of engagement/employment documents.

The original requirement explicitly calls for staff profiles and engagement documents.

30. ROLE-BASED ACCESS CONTROL

Implement proper RBAC.

Suggested roles:

SUPER ADMIN

Full access.

ADMIN

Business administration.

SECRETARY / FRONT DESK

Customer registration, job creation and customer-facing workflows.

CASHIER

Payments, receipts and relevant financial transactions.

ACCOUNTANT

Ledger, expenses, financial reports and reconciliation.

GRAPHIC ARTIST

Assigned design jobs and relevant customer/job files.

PRODUCTION OPERATOR

Production jobs and material usage.

STOREKEEPER

Inventory and stock movements.

MANAGER

Business oversight and reports.

Permissions must be granular.

Examples:

View customers

Create customers

Edit customers

Delete customers

View jobs

Create jobs

Edit jobs

Approve jobs

View payments

Confirm payments

Issue refunds

View inventory

Adjust inventory

View ledger

Edit ledger

View reports

Export reports

Manage users

Manage pricing

Never rely solely on hiding buttons.

Permissions must also be enforced on the backend/server.

31. CONFIGURATION MODULE

CONFIGS must allow authorized administrators to configure:

Categories

Services

Customer types

Pricing

Discounts

Promotions

Users

Roles

Stores

Payment accounts

Tax settings

Numbering formats

Notification settings

Company information

Receipt settings

Invoice settings

The original specification specifically identifies categories, services, users/staff, customer messaging and discounts/promotions as configuration functions.

32. EXPENSE MANAGEMENT

Create an expenditure system.

Record:

Expense number

Date

Purpose

Category

Amount

Payment method

Account

Staff member

Receipt

Notes

The original requirements call for expenditure records including purpose, cost and receipt.

33. LEDGER

The LEDGER module must handle:

Financial statements

Capital

Expenses

Adjustments

Cash books

Income

Payments

Debtors

Creditors

Profit/loss

The source specification specifically identifies financial statements, capital, expenses, adjustments, financial controls and cash books.

All ledger calculations must be based on actual recorded transactions.

Do not create fake accounting figures.

34. PROFIT AND LOSS

Create automatic profit/loss calculations.

At minimum:

Revenue
− Cost of goods/materials
− Labour
− Machine/production costs
− Other direct costs
− Operating expenses

Profit/Loss

Allow filtering by:

Date

Category

Service

Job

Customer

Show both summary and detailed transactions.

The original specification requires the ledger to calculate profit and losses.

35. REPORTS

Create a dedicated professional REPORTS section.

Reports should include:

Sales

Daily sales

Weekly sales

Monthly sales

Annual sales

Sales by service

Sales by category

Sales by customer type

Jobs

Jobs created

Jobs completed

Jobs cancelled

Jobs pending

Jobs by category

Jobs by staff

Production turnaround

Payments

Cash

MoMo

Bank

Cheque

Outstanding payments

Debtors

Total debt

Aging

Customer statements

Inventory

Current stock

Low stock

Stock movement

Material consumption

Inventory valuation

Profitability

Revenue

Cost

Profit

Margin

Profit by service

Profit by job

Staff

Jobs handled

Production activity

Activity logs

Assets

Machine usage

Maintenance

Asset purchases

Allow:

Date filtering

Export CSV

Export Excel

Print

PDF where appropriate

36. AUDIT LOG

Create an immutable activity/audit log.

Track:

Login

Logout

Customer creation

Customer changes

Job creation

Job changes

Payment creation

Payment confirmation

Payment cancellation

Inventory changes

Price changes

Ledger adjustments

Permission changes

User changes

Record:

User

Action

Record

Timestamp

Before value

After value

Reason where appropriate

High-risk actions should require confirmation.

37. SECURITY

Implement professional security practices.

Include:

Secure authentication

Password hashing

Session management

Role-based authorization

Backend permission enforcement

Input validation

Server-side validation

File upload restrictions

Protection against unauthorized access

Rate limiting where appropriate

Secure database access

Audit logging

Secure environment variables

No secret keys in frontend code

Never expose database credentials or API keys in client-side code.

38. FILE UPLOADS

Support documents and attachments.

Allowed examples:

JPG

PNG

PDF

DOC/DOCX where required

XLS/XLSX where required

Validate:

File type

File size

Upload permissions

Files should be linked to the appropriate record.

Examples:

Customer → ID/document

Job → artwork

Payment → proof

Machine → receipt

Staff → engagement document

Expense → receipt

39. SEARCH

Provide global and module-specific search.

Search customers by:

Name

Phone

ID

Search jobs by:

Job number

Customer

Phone

Service

Status

Search inventory by:

Item name

Item code

Category

Search payments by:

Receipt number

Customer

Reference number

Search should be fast and useful.

40. NOTIFICATIONS

Create an internal notification system.

Examples:

Low stock

Job deadline approaching

Payment received

Payment awaiting confirmation

Overdue debtor

Maintenance due

New assigned job

Job completed

Quotation approved

Notifications should link directly to the relevant record.

41. CUSTOMER MESSAGING

Provide a messaging area for customer communication.

Allow authorized users to prepare messages for:

Job ready

Payment confirmation

Outstanding balance

Quotation

Promotions

General announcements

Where external SMS/WhatsApp services are not configured, create a clean integration layer rather than pretending messages were actually sent.

42. KIMO GRAPHYX WEBSITE INTEGRATION

The business wants the system potentially linked with:

kimographyxgh.com

Design the application so that it can integrate with the public website.

Possible future integration:

Website customer request/form
→ API
→ KIMO GRAPHYX admin system
→ New enquiry/job lead
→ Staff notification

Do not assume the public website currently has an API.

First create a clean integration architecture.

If the website is not directly accessible through an API, provide a secure endpoint/webhook structure for future integration.

Do not break the existing public website.

43. DATABASE ARCHITECTURE

Create a properly normalized relational database.

Suggested entities:

users

roles

permissions

user_roles

customers

customer_types

categories

services

pricing_rules

jobs

job_items

job_status_history

quotations

quotation_items

invoices

invoice_items

payments

payment_accounts

payment_proofs

stores

inventory_items

inventory_transactions

inventory_reservations

machines

machine_readings

maintenance_records

assets

staff

staff_documents

expenses

ledger_entries

notifications

attachments

audit_logs

settings

Use proper foreign keys and relationships.

Do not duplicate information unnecessarily.

44. DATA INTEGRITY

Implement safeguards.

Examples:

A confirmed payment cannot silently be deleted.

An inventory transaction cannot be altered without an audit trail.

A completed job cannot be edited by unauthorized staff.

A user cannot modify their own permissions unless explicitly authorized.

A confirmed financial transaction should be reversed through an appropriate reversal/adjustment mechanism rather than simply deleted.

45. ERROR HANDLING

Every action needs proper feedback.

Examples:

SUCCESS:
"Payment confirmed successfully."

ERROR:
"Payment could not be confirmed. Please verify the transaction reference."

WARNING:
"Insufficient vinyl stock. Required: 5m. Available: 2m."

CONFIRMATION:
"Are you sure you want to cancel this job?"

Never leave the user wondering whether an action worked.

46. LOADING STATES

Every asynchronous operation must have a proper loading state.

Examples:

Loading customers...

Saving job...

Processing payment...

Uploading document...

Generating report...

Avoid freezing the interface.

47. EMPTY STATES

Do not show blank screens.

Example:

"No jobs found."

Then provide:

"Create New Job"

or

"Clear Filters"

Empty states should explain what the user can do next.

48. FORMS

Forms must have:

Clear labels

Helpful placeholders

Required-field indicators

Inline validation

Error messages

Proper input types

Dropdowns where appropriate

Date pickers

Number formatting

Currency formatting

Do not use placeholders as substitutes for labels.

49. CONFIRMATION FOR DANGEROUS ACTIONS

Actions such as:

Delete

Cancel

Refund

Stock adjustment

Ledger adjustment

Payment reversal

User deactivation

must require confirmation.

Where necessary require a reason.

50. CURRENCY

The application should support Ghanaian Cedi (GHS) as the primary currency.

Format monetary values consistently.

Example:

GHS 1,250.00

Do not mix currency formatting styles.

Keep currency configuration flexible for future expansion.

51. DATE AND TIME

Use consistent date formatting throughout the system.

Store timestamps correctly in the backend.

Display dates in a format appropriate for the business.

Always show enough information to distinguish dates and times clearly.

52. PRINTABLE DOCUMENTS

Create professional printable documents for:

Quotations

Invoices

Receipts

Customer statements

Job sheets

Reports

Purchase/expense documentation where applicable

Use KIMO GRAPHYX branding consistently.

Do not create ugly browser-default printouts.

53. JOB SHEET

Generate a production/job sheet.

It should include:

Job number

Customer

Phone

Services

Quantity

Specifications

Materials

Machine

Assigned staff

Deadline

Special instructions

Production status

Production staff should be able to use this without seeing unnecessary financial information.

54. USER EXPERIENCE PRINCIPLE

Different users should see information relevant to their jobs.

For example:

A graphic artist should not need to navigate through accounting information to find assigned artwork.

A storekeeper should quickly see:

Stock

Required materials

Low-stock alerts

Stock movements

A cashier should quickly see:

Payments

Outstanding balances

Payment confirmations

Receipts

An accountant should quickly see:

Ledger

Expenses

Cash books

Debtors

Reports

An administrator should see the complete system.

55. ROLE-SPECIFIC DASHBOARDS

Where useful, customize the dashboard by role.

Do not simply hide everything.

Present relevant information first.

56. PERFORMANCE

The system must remain responsive with a large number of:

Customers

Jobs

Transactions

Inventory records

Payments

Files

Use:

Pagination

Efficient queries

Indexed search fields

Lazy loading where appropriate

Optimized assets

Server-side filtering

Efficient API calls

Do not load thousands of records unnecessarily.

57. MOBILE EXPERIENCE

Mobile users should be able to:

Search customers

View jobs

Update job status where authorized

Check inventory

Confirm appropriate tasks

View payments

Receive notifications

But sensitive administrative operations may remain restricted depending on permissions.

58. PROFESSIONAL VISUAL SYSTEM

Establish a consistent design system.

Define:

Primary color

Secondary color

Background

Text colors

Border colors

Success

Warning

Error

Info

Typography scale

Spacing scale

Border radius

Shadows

Buttons

Inputs

Tables

Modals

Badges

Tabs

Dropdowns

Use one coherent visual language throughout the application.

Do not randomly style individual pages.

59. ICONS

Use one professional icon library consistently.

Icons must have clear meaning.

Do not use icons simply to decorate every piece of text.

Buttons should normally include understandable text where the action is not obvious.

60. ANIMATIONS

Animations must be subtle.

Use animation for:

Page transitions

Dropdowns

Modals

Toast notifications

Loading states

Hover interactions

Avoid excessive animation.

The application should feel smooth, not flashy.

61. ACCESSIBILITY

Implement:

Keyboard navigation

Focus states

Semantic HTML

Proper labels

Accessible form errors

Sufficient contrast

Accessible dialogs

Screen-reader-friendly controls

Appropriate ARIA only where necessary

62. RESPONSIVE TABLE DESIGN

Tables must remain usable.

Desktop:

Full table.

Tablet:

Hide less important columns.

Mobile:

Use a compact record layout or horizontal scrolling where necessary.

Never allow critical information to become unreadable.

63. NO FAKE FUNCTIONALITY

This is extremely important.

Do NOT create buttons that only look functional.

Do NOT use:

alert("Coming soon")

for core functionality.

Do NOT create fake database responses.

Do NOT hard-code dashboard statistics.

Do NOT simulate successful payments.

Do NOT pretend an email/SMS was sent if there is no configured provider.

If an external service is required but not connected, clearly design the integration point.

64. TEST DATA

Create realistic development/demo data so the interface can be tested.

Include:

Several customers

Different customer types

Different jobs

Multiple categories

Multiple services

Inventory items

Low-stock item

Payments

Partial payment

Outstanding debtor

Expenses

Staff members

Machines

Sample reports

Clearly identify demo data if necessary.

65. TESTING

Before considering the application complete, test every major workflow.

Customer workflow

Register customer
→ Search customer
→ Edit customer
→ View customer account

Job workflow

Create customer
→ Create job
→ Add service
→ Calculate cost
→ Check materials
→ Approve job
→ Production
→ Completion

Payment workflow

Create invoice
→ Partial payment
→ Confirm payment
→ Generate receipt
→ Update debtor balance

Inventory workflow

Receive stock
→ View stock
→ Consume material
→ Stock decreases
→ Job cost updates

Reporting workflow

Create transactions
→ Open reports
→ Filter
→ Verify calculations
→ Export

Permission workflow

Login as each role
→ Verify allowed actions
→ Verify restricted actions

Do not mark the system complete until these workflows work.

66. SECURITY TESTING

Test:

Unauthorized URL access

Unauthorized API requests

Role escalation

Invalid input

File upload restrictions

Authentication

Session handling

Permission enforcement

Security must be enforced server-side.

67. DATABASE BACKUP

Design the system so the database can be backed up and restored.

Include an administrative backup strategy.

Do not rely solely on frontend/local storage for business records.

68. FUTURE EXPANSION

Architect the system so additional modules can be added later without rebuilding the entire application.

Potential future modules:

Supplier management

Purchase orders

Delivery management

Payroll

Staff attendance

Customer loyalty

Online customer portal

Online quotation acceptance

Online payments

WhatsApp integration

SMS integration

Website lead integration

Multi-branch support

Do not build unnecessary future modules now unless required.

Build the architecture so they can be added later.

69. CODE QUALITY

Write clean, maintainable code.

Use:

Reusable components

Reusable form components

Reusable tables

Reusable modals

Centralized validation

Centralized API handling

Consistent error handling

Clear naming

Modular architecture

Avoid:

Giant components

Duplicated code

Inline hacks

Hard-coded business logic in UI

Hard-coded prices

Hard-coded permissions

Hard-coded users

Hard-coded dashboard figures

70. IMPORTANT UI RULE

The interface must prioritize real business workflow over visual decoration.

A staff member should be able to perform common tasks quickly.

For example:

Secretary:

LOGIN
→ REGISTRATION
→ SEARCH CUSTOMER
→ CREATE JOB
→ SELECT SERVICE
→ ENTER DETAILS
→ SAVE
→ PRINT/SEND QUOTATION

Cashier:

LOGIN
→ PAYMENTS
→ SELECT JOB
→ ENTER PAYMENT
→ VERIFY
→ CONFIRM
→ RECEIPT

Storekeeper:

LOGIN
→ INVENTORY
→ CHECK MATERIAL
→ STOCK IN/OUT
→ VIEW LOW STOCK

Accountant:

LOGIN
→ LEDGER
→ PAYMENTS
→ EXPENSES
→ REPORTS

Admin:

LOGIN
→ DASHBOARD
→ COMPLETE BUSINESS OVERVIEW

71. DATABASE-FIRST THINKING

Before creating complicated frontend pages, establish the correct database relationships and business logic.

Do not design screens first and invent database structures afterward.

The application should be based around the actual business processes.

72. BACKEND-FIRST VALIDATION

All important business rules must be enforced on the backend.

Examples:

Insufficient stock

Unauthorized discount

Unauthorized payment confirmation

Unauthorized ledger adjustment

Invalid job status transition

Invalid financial transaction

Unauthorized user access

Frontend validation is useful but is NOT sufficient.

73. API DESIGN

Use clean API/service architecture.

Endpoints should be organized logically around resources.

Example:

/customers
/jobs
/services
/payments
/inventory
/assets
/staff
/expenses
/ledger
/reports

Use proper HTTP methods and status codes.

Return structured error messages.

74. SEARCH AND FILTER PERFORMANCE

Search should not require downloading the entire database to the browser.

Use backend/server-side search where appropriate.

Support:

Search

Filter

Sort

Pagination

75. DATA EXPORT

Authorized users should be able to export appropriate data.

Formats:

CSV

Excel

PDF where appropriate

Respect permissions during export.

Do not allow a restricted employee to export sensitive financial/customer data simply because the frontend has a button.

76. ADMIN CONTROLS

Create a secure administration area.

Include:

Users

Roles

Permissions

Categories

Services

Pricing

Stores

Payment accounts

Company information

Notification settings

Audit logs

System settings

77. COMPANY PROFILE

Allow admin to configure:

KIMO GRAPHYX name

Logo

Address

Phone

Email

Website

Social/contact details

Tax information where applicable

Receipt footer

Invoice footer

These settings should automatically appear on generated documents.

78. DATA VALIDATION

Examples:

Phone numbers must follow acceptable formats.

Amounts cannot be negative unless the transaction type explicitly allows it.

Quantity cannot be negative.

Payment cannot exceed invoice balance unless authorized credit/overpayment handling exists.

Stock cannot become negative.

Required fields cannot be empty.

Invalid files must be rejected.

79. FINANCIAL CONTROLS

Financial actions should be traceable.

For important transactions require:

Authorized user

Timestamp

Reference

Reason where necessary

Audit trail

Never allow financial records to silently disappear.

80. FINAL QUALITY STANDARD

Before declaring the application complete, ask:

"Could KIMO GRAPHYX actually run its daily business using this system?"

If the answer is no, continue improving the system.

Do not stop merely because all pages have been created.

81. FINAL IMPLEMENTATION REQUIREMENT

Build the system in logical stages.

Recommended implementation order:

PHASE 1

Project foundation
Database
Authentication
Roles
Permissions
Design system

PHASE 2

Customers
Registrations
Categories
Services

PHASE 3

Jobs
Quotations
Costing
Production workflow

PHASE 4

Inventory
Stores
Material consumption
Assets
Machines

PHASE 5

Payments
Invoices
Receipts
Debtors

PHASE 6

Expenses
Ledger
Profit/loss
Financial controls

PHASE 7

Reports
Dashboard
Notifications

PHASE 8

Staff
Documents
Audit logs
Configuration

PHASE 9

Integration
Website/API
Messaging

PHASE 10

Testing
Security
Performance
Responsive optimization
Production deployment

82. CRITICAL INSTRUCTION TO THE AI DEVELOPER

Do not rush into generating all the frontend screens.

First understand the entire business workflow.

Then establish:

Database schema

Authentication

Authorization

Core business logic

API/services

Frontend components

Pages

Reports

Testing

When implementing a feature, make sure the complete flow works from frontend → backend → database → frontend.

If something cannot yet be implemented because an external service, API key, domain configuration, payment provider, SMS provider or other dependency is missing, create the proper integration architecture and clearly identify the required configuration instead of faking the functionality.

83. "HUMAN-DESIGNED" QUALITY REQUIREMENT

The finished product must NOT look like an AI assembled a generic dashboard template.

It should have:

Deliberate spacing

Consistent typography

Realistic information density

Practical tables

Meaningful buttons

Clear workflows

Professional forms

Restrained use of cards

Useful dashboards

Logical navigation

Appropriate business terminology

Consistent visual hierarchy

Every design decision should answer:

"Does this make KIMO GRAPHYX staff faster, clearer, and safer when doing their actual work?"

If not, remove it.

84. COMPLETION CRITERIA

The system is considered complete only when:

Authentication works

Roles work

Permissions work

Customers work

Registrations work

Services work

Categories work

Jobs work

Quotations work

Costing works

Inventory works

Material consumption works

Stores work

Assets work

Machines work

Payments work

MoMo workflow works

Bank/Cheque proof workflow works

Receipts work

Debtors work

Expenses work

Ledger works

Profit/loss works

Reports work

Staff profiles work

Documents work

Notifications work

Audit logs work

Search works

Filters work

Exports work

Responsive design works

Error handling works

Loading states work

Empty states work

Security rules work

Database relationships work

No core buttons are fake

No core functionality depends on hard-coded demo data

85. FINAL DESIGN PRINCIPLE

Build KIMO GRAPHYX as a real business operating system, not merely as a website.

Every customer interaction, job, payment, material, machine, employee action and financial transaction should be connected.

The system should reduce manual work, prevent avoidable mistakes, provide management visibility, control access to sensitive information, and give KIMO GRAPHYX a reliable central source of business information.

The final product should be:

Professional.

Fast.

Clear.

Secure.

Responsive.

Maintainable.

Data-driven.

Actually functional.

And most importantly:

It must feel like a system built specifically for KIMO GRAPHYX—not a generic AI-generated admin template.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kimoflow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d1d7e1a9-a2f5-4eae-9699-6053dc8d9503).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
