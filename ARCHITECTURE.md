# PaisaFlow Architecture

This document explains how PaisaFlow is organized, how data flows across layers, and the conventions used to keep the codebase maintainable as new features are added.

## 1. Folder Structure

```text
/
├── server.ts                       # Thin Express + Vite dev/prod bootstrapper
├── server/                         # Backend application (Express API)
│   ├── config/
│   │   └── env.ts                  # Typed, frozen server environment configuration
│   ├── middleware/
│   │   └── errorHandler.ts         # AppError, asyncHandler, 404 & global JSON error handler
│   ├── routes/
│   │   ├── index.ts                # Versioned router (/api/v1/* + /api/* aliases)
│   │   ├── healthRoutes.ts         # GET /health
│   │   └── aiRoutes.ts             # POST /ai/chat (validated request handler)
│   └── services/
│       └── geminiService.ts        # Server-side @google/genai client & grounded prompt logic
└── src/                            # Frontend application (React + TypeScript + Tailwind)
    ├── api/
    │   ├── httpClient.ts           # Typed fetch wrapper with timeout & ApiError normalization
    │   └── aiApi.ts                # Typed API functions (askFinancialAssistant, fetchApiHealth)
    ├── components/
    │   ├── ui/                     # Reusable, domain-agnostic UI primitives
    │   │   ├── EmptyState.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   ├── Modal.tsx           # Accessible dialog with Escape & backdrop close
    │   │   ├── SegmentedControl.tsx
    │   │   ├── Switch.tsx
    │   │   └── index.ts            # Barrel export
    │   ├── AppShell.tsx            # Desktop sidebar + top bar + mobile bottom nav
    │   ├── AuthPortal.tsx          # Sign in / sign up / password reset / demo portal
    │   ├── CategoryIcon.tsx        # Dynamic Lucide icon registry for categories & goals
    │   ├── ConfirmDialog.tsx       # Destructive action confirmation dialog
    │   ├── ToastBanner.tsx         # Accessible notification stack
    │   └── TransactionModal.tsx    # Add/Edit transaction & transfer form modal
    ├── config/
    │   └── env.ts                  # Typed public client env config + chart theme tokens
    ├── context/
    │   └── FinanceContext.tsx      # Thin React state provider delegating to domain reducer
    ├── data/
    │   └── defaults.ts             # Default INR categories & isolated demo workspace seed
    ├── domain/
    │   ├── financeReducer.ts       # Pure, validated state-transition engine (framework-free)
    │   ├── financeReducer.test.ts  # Unit tests for domain mutations & selectors
    │   └── financeSelectors.ts     # Pure selectors (e.g. buildAiFinancialContext)
    ├── hooks/
    │   └── useFinanceMetrics.ts    # Memoized KPI, cashflow, breakdown & date-range hook
    ├── pages/                      # Route-level views (11 workspace sections)
    ├── services/
    │   ├── pdfReportService.ts     # Client-side jsPDF financial report builder
    │   └── storageService.ts       # Isolated local persistence + optional Supabase SQL schema
    ├── types/
    │   └── finance.ts              # Shared TypeScript interfaces and union types
    └── utils/
        ├── fileExport.ts           # Browser download helpers (CSV, JSON)
        ├── financeMath.ts          # Pure financial math, date range & CSV serialization
        ├── financeMath.test.ts     # Unit tests for financial calculations
        └── formatters.ts           # INR / en-IN currency and DD MMM YYYY formatters
```

## 2. Separation of Concerns

- **Pure Domain Layer (`src/domain/`, `src/utils/`)**: Zero React imports. All validation, balance recalculations, recurring occurrence deduplication, and state transitions happen in `applyFinanceDomainAction()` (`src/domain/financeReducer.ts`) and pure helpers in `src/utils/financeMath.ts`. Both are directly unit-tested with Node's native test runner (`node:test`).
- **State Management (`src/context/FinanceContext.tsx`, `src/hooks/`)**: `FinanceContext` coordinates authentication, persistence (`storageService`), theme, and toast feedback while delegating every domain mutation to `applyFinanceDomainAction`. Derived dashboard/report metrics live in the memoized `useFinanceMetrics` hook.
- **API Layer (`src/api/`, `server/`)**: Frontend components never call raw `fetch()`. They call typed functions in `src/api/*`, which route through `apiRequest()` with timeout enforcement (`AbortController`) and structured `ApiError` objects.
- **UI Primitives (`src/components/ui/`)**: Shared dialogs (`Modal`), toggles (`Switch`), filter bars (`SegmentedControl`), empty states (`EmptyState`), and crash recovery (`ErrorBoundary`) are centralized to eliminate duplication and maintain uniform accessibility.

## 3. Scalable Versioned API Structure

The Express backend mounts all API routes under `/api/v1/*` via `server/routes/index.ts`, with backwards-compatible `/api/*` aliases:

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/v1/health` | `GET` | Liveness, API version, and AI configuration readiness |
| `/api/v1/ai/chat` | `POST` | Grounded Gemini AI financial assistant chat |

All unmatched `/api/*` paths return a structured JSON `404` response (`{ error, code: "ROUTE_NOT_FOUND" }`). Unexpected errors flow through `globalErrorHandler` (`server/middleware/errorHandler.ts`) using `AppError` instances so internal stack traces never leak to clients.

## 4. Environment Configuration

Configuration is strictly separated from application code:

- **Server-only** (`server/config/env.ts`): `GEMINI_API_KEY`, `APP_URL`, `PORT`, `NODE_ENV`. Never exposed to the browser bundle.
- **Client-public** (`src/config/env.ts`): `VITE_API_BASE_URL` (defaults to `/api/v1`), optional `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Reference template: `.env.example`.

## 5. Error Handling Strategy

1. **Domain Validation**: Pure reducer returns explicit, user-friendly validation errors (e.g., negative amount, same-account transfer, deleting an account with transactions, duplicate recurring entry) without mutating state.
2. **Network / API Errors**: `apiRequest()` catches HTTP errors, invalid JSON, network drops, and request timeouts, normalizing them into `ApiError(message, status, code)`.
3. **Server Middleware**: `asyncHandler` forwards async route rejections to `globalErrorHandler`.
4. **React Render Recovery**: Root `<ErrorBoundary>` catches unexpected UI render exceptions and offers a clean recovery action.

## 6. Testing & Verification

```bash
# Run pure domain & financial math unit tests
npx tsx --test src/utils/financeMath.test.ts src/domain/financeReducer.test.ts

# Type-check entire codebase
npm run lint

# Build frontend bundle & Node server
npm run build
```
