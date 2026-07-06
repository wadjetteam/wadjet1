# WADJET GRC

**Eyes on Risk. Control in Action.**

Enterprise Governance, Risk & Compliance (GRC) platform for banking — built to meet CBE, ISO 27001, and PCI DSS requirements.

## Architecture

pnpm monorepo with two workspaces:

```
wadjet/
├── backend/     # Express API server (@workspace/api-server)
├── frontend/    # React SPA (@workspace/wadjet-grc)
└── packages/
    └── db/      # Database models, schemas, stores (@workspace/db)
```

## Tech Stack

| Layer       | Tech                                                  |
|-------------|-------------------------------------------------------|
| Backend     | Express 5, TypeScript, Zod, Pino                      |
| Frontend    | React 19, Vite, Tailwind CSS 4, Recharts, Lucide      |
| Database    | SQLite (dev) / PostgreSQL (prod), JSONB collections   |
| Seed Data   | Excel (xlsx), static TS modules                       |
| Caching     | SQLite WAL mode, lazy-loaded in-memory collections    |

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+

### Install

```bash
pnpm install
```

### Run (dev)

```bash
pnpm dev
```

Starts:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:5173`

Frontend proxies `/api/*` to the backend.

### Seed Data

On startup the server runs three seeders automatically:
- **Risk seeder** — reads `attached_assets/Risk_Assessment_v3 (1).xlsx`, upserts 48 risks
- **Compliance seeder** — inserts ISO 27001 / CBE / PCI DSS controls, mappings, frameworks
- **Banking seeder** — capital ratios, RWA trends, loss events, vendors, submissions

## Project Structure

```
backend/src/
├── app.ts                          # Express app setup
├── index.ts                        # Entry point — seed, listen
├── seed.ts                         # Risk + banking seeders
├── config/
│   ├── env.ts                      # Environment config
│   └── logger.ts                   # Pino logger
├── lib/
│   └── integration-config.ts       # External integration loaders
├── middleware/
│   └── error-handler.ts
├── routes/
│   ├── index.ts                    # Route aggregator
│   ├── health.ts
│   ├── risks.ts
│   ├── compliance.ts
│   ├── evidence.ts
│   ├── risk-control-maps.ts
│   ├── banking/
│   ├── user-management-router.ts
│   ├── evidence-connector-router.ts
│   ├── impact-router.ts
│   ├── reporting-router.ts
│   └── audit-trail-router.ts
└── services/
    ├── scheduler.ts
    ├── audit-trail/
    ├── evidence-connector/
    ├── impact-engine/
    ├── reporting-engine/
    └── user-management/

backend/packages/db/src/
├── index.ts                        # Public API
├── memory-store.ts                 # SQLite store
├── postgres-store.ts               # PostgreSQL store
├── models/                         # Risk, compliance, banking
├── schemas/                        # Zod schemas
└── seed/                           # Compliance seed data

frontend/src/
├── App.tsx                         # View router
├── components/
│   ├── layout/                     # Sidebar, TopBar
│   ├── unified-dashboards/         # Executive / Board / CRO dashboards
│   ├── compliance/                 # Compliance Hub, Gap Assessment
│   ├── risk-remediation/           # Risk Hub, controls
│   ├── admin/                      # Policy, GRC Management, Users
│   ├── evidence/                   # Evidence Connector
│   ├── impact/                     # Impact Analysis
│   ├── reporting/                  # Reporting Engine
│   ├── operational-risk/           # Loss Events, TPRM
│   ├── regulatory/                 # CBE Deadlines, Calendar
│   └── audit-trail/
└── context/                        # Auth, Theme, GRC
```

## API Overview

| Prefix                     | Description               |
|----------------------------|---------------------------|
| `GET /api/health`          | Health check              |
| `GET /api/risks`           | Risk register             |
| `GET /api/compliance`      | Compliance controls       |
| `GET /api/evidence`        | Evidence items            |
| `GET /api/risk-control-maps` | Risk-control mappings   |
| `/api/banking/*`           | Capital, losses, TPRM     |
| `/api/reporting/*`         | Reporting engine          |
| `/api/users-management/*`  | User CRUD                 |
| `/api/evidence-connector/*`| Evidence automation       |
| `/api/impact/*`            | Impact analysis           |
| `/api/audit-trail/*`       | Tamper-proof audit log    |

## Environment Variables

| Variable            | Default                       | Description                |
|---------------------|-------------------------------|----------------------------|
| `PORT`              | _(required)_                  | Backend port               |
| `NODE_ENV`          | `development`                 | Environment                |
| `LOG_LEVEL`         | `info`                        | Pino log level             |
| `DATABASE_URL`      | _(empty = SQLite)_            | PostgreSQL connection      |
| `JWT_SECRET`        | `default-dev-...`             | JWT signing secret         |
| `CBE_REPORTING_URL` | _(empty = disabled)_          | CBE integration endpoint   |
| `GRC_EXCHANGE_URL`  | _(empty = disabled)_          | External GRC exchange      |
| `AUDIT_ARCHIVE_URL` | _(empty = disabled)_          | Audit archive endpoint     |

## Database

Dev uses SQLite (`backend/data/wadjet.db`) with WAL mode. Set `DATABASE_URL` to a PostgreSQL connection string for production use. Collections store documents as JSONB — no migrations needed for schema changes.
