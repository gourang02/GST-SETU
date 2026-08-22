# AuditAI — AI Invoice Auditing Dashboard

React + Vite + TypeScript frontend based on the supplied Figma Make dashboard.

## Stack
- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- Lucide React icons
- Recharts
- FastAPI-ready REST API integration
- WebSocket-ready audit activity stream

## Features
- Dashboard with invoice/audit KPIs
- AI audit workflow visualization
- Invoice management, search, filtering and detail drawer
- Audit flags, confidence scores and audit trail
- Vendor registry
- GST audit rules / knowledge base
- Ledgers and bank transactions
- Reports and exports
- AI configuration
- Authentication with demo fallback when FastAPI is unavailable
- REST + WebSocket integration points
- Responsive layout with Figma-matched sage/green visual language

## Run locally

Requirements: Node.js 20+.

```bash
npm install
copy .env.example .env
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Connect FastAPI

Run your backend on `http://localhost:8000` and set:

```env
VITE_API_BASE=http://localhost:8000
VITE_WS_BASE=ws://localhost:8000
```

The frontend expects endpoints in `src/api/endpoints.ts`, including authentication, dashboard stats, invoices, vendors, rules, ledgers, bank transactions, reports and AI configuration. Mock fallback data keeps the UI usable before the backend is connected.

## Demo login

When the backend login endpoint is unavailable, any email/password is accepted in demo mode.
