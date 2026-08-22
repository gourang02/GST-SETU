Build a production-quality web dashboard for an AI-powered invoice auditing and GST compliance system.

I have provided a reference image for the visual design. Use it as the primary visual reference and recreate its overall layout, enterprise dashboard aesthetic, panels, cards, tables, status indicators, agent workflow visualization, exception handling, audit information, and right-side action panel.

Color Scheme:
- Main Background: #E3EDE1 (Pale Sage)
- Header, Buttons, Primary Accents: #366B4E (Forest Green)
- Panels, Borders, Secondary Surfaces: #B7C9B7 (Sage Green)
- Secondary Text/UI Elements: #9BA69C (Gray-Green)
- Dark Text and Narrative Log: #344838 (Deep Green)
- Cards and Light Surfaces: #F1F4EC (Cream)
- Secondary Accents: #71A09A (Muted Teal)
- "MED" Status: #53778F (Muted Blue)
- "HIGH" Status: #D5A15F (Amber)
- "CRIT"/Danger Status: #A86A67 (Muted Red)

The application should be built as a responsive React frontend.

Main dashboard

Create a dashboard containing:

- Left sidebar navigation
- Top header with system health/status
- Dashboard statistics
- AI audit workflow showing:
  Extractor → Reconciler → Filer
- Invoice/audit exceptions
- Vendor information
- Confidence scores
- Original vs adjusted liability comparison
- Audit/narrative activity log
- Right-side action panel
- Invoice/document preview
- Actions such as Explain, Re-audit, Override, Export, and Delete where appropriate

API integration

The backend provides the following REST and WebSocket APIs. Create a frontend API service layer and use these endpoints instead of hardcoded data wherever possible.

Authentication

POST /auth/login
GET /auth/me

Create a login screen and maintain the authenticated user state.

Dashboard

GET /dashboard/stats

Use this to populate dashboard statistics such as invoice counts, audit status, exceptions, liabilities, and other available statistics.

Invoices

GET /invoices
GET /invoices/search
GET /invoices/{invoice_id}
GET /invoices/{invoice_id}/file
GET /invoices/{invoice_id}/audit-trail
GET /invoices/{invoice_id}/export
DELETE /invoices/{invoice_id}

POST /audit-invoice
POST /invoices/{invoice_id}/re-audit
PATCH /invoices/{invoice_id}/override

Create:

- Invoice list/table
- Invoice search
- Invoice details page/panel
- Invoice file/document viewer
- Audit trail
- Audit/re-audit actions
- Override workflow
- Export action
- Delete confirmation

Vendors

GET /vendors
POST /vendors
GET /vendors/{vendor_gstin}
PATCH /vendors/{vendor_gstin}
GET /vendors/{vendor_gstin}/invoices

Create a vendor management section with vendor list, vendor details, editing, creation, and associated invoices.

Knowledge base

GET /knowledge-base/rules
POST /knowledge-base/rules
DELETE /knowledge-base/rules/{rule_id}

Create a rules/knowledge-base management page where users can view, add, and delete audit rules.

Ledgers

GET /ledgers
POST /ledgers

Create a ledger section for viewing and adding ledger information.

Bank transactions

GET /bank-transactions
POST /bank-transactions

Create a bank transaction section for viewing and adding transactions.

Reports

GET /reports/export

Provide a reports export action from the dashboard.

AI configuration

GET /settings/ai-config
PATCH /settings/ai-config

Create an AI configuration/settings page where authorized users can view and update AI configuration.

System

GET /health

Use this endpoint to display backend/system health in the header or system-status area.

Real-time audit logs

WS /ws/audit-logs

Use the WebSocket to display real-time audit activity in the activity/narrative log. Show connection status and gracefully handle disconnection/reconnection.

Important implementation requirements

- Use React components and reusable UI components.
- Keep API calls in a dedicated API/service layer rather than scattering fetch calls throughout components.
- Do not hardcode invoice, vendor, audit, or dashboard data when an API endpoint exists.
- Add loading states for API requests.
- Add empty states when there is no data.
- Add error states and useful error messages.
- Add confirmation dialogs for destructive actions such as DELETE.
- Add success/error notifications for mutations.
- Handle authentication and unauthorized API responses.
- Use realistic mock data only when an endpoint cannot be called during development.
- Make the UI responsive.
- Preserve the visual style and structure of the provided reference image.

Suggested frontend structure

Organize the application into reusable components and pages such as:

Dashboard
Invoices
InvoiceDetails
Vendors
VendorDetails
KnowledgeBase
Ledgers
BankTransactions
Reports
Settings
Login

Reusable components should include:

Sidebar
Header
StatsCard
AgentWorkflow
InvoiceTable
ExceptionTable
AuditTrail
ActivityLog
DocumentViewer
ActionPanel
ConfidenceIndicator
ConfirmationDialog
LoadingState
ErrorState

First build the complete frontend structure and visual UI. Then connect each screen and action to the appropriate API endpoint above.