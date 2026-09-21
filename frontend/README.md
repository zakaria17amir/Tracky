# Tracky — SPA

The React 19 + TypeScript single-page client for [Tracky](../README.md), built with Vite.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

The dev server proxies `/api` to the Laravel API on `http://127.0.0.1:8000`, so
[the backend](../backend/README.md) must be running too.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc` only |
| `npm run lint` | ESLint |
| `npm run e2e` | Cypress headless (both servers must be running) |
| `npm run cypress:open` | Cypress interactive |

## Layout

| Path | Contents |
| --- | --- |
| `src/pages/` | Route-level screens |
| `src/features/` | Per-domain API hooks and feature components |
| `src/components/layout/` | `AppLayout`, `AuthLayout`, nav definitions |
| `src/components/guards/` | Route gating — UX only, never load-bearing for security |
| `src/components/ui/` | Reusable primitives — fields, dialogs, empty/error states |
| `src/context/` | Auth and toast providers |
| `src/lib/` | axios client, query client, formatters, error mapping |
| `src/types.ts` | Shared types mirroring the API resources |
| `cypress/e2e/` | End-to-end specs |

## Conventions

- **Strict TypeScript, no `any`.** The build fails on type errors.
- **Server state lives in TanStack Query**, never copied into `useState`. Client state (modals,
  drafts, toasts) lives in React state or context.
- **Pages compose hooks**; they never call axios directly.
- **`src/types.ts` mirrors the Laravel JSON Resources** — change a resource, change the type in the
  same commit, and `tsc` catches the drift.

More context in [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md#frontend).
