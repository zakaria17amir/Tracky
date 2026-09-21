# Contributing

Tracky is a personal project, but issues and pull requests are welcome — bug reports especially.
This document covers local setup, the standards the code is held to, and what CI expects.

## Getting set up

**Prerequisites:** PHP 8.3+ with `pdo_sqlite`, Composer 2, Node.js 20+.

```bash
git clone https://github.com/zakaria17amir/Tracky.git
cd Tracky

# API
cd backend
composer install
cp .env.example .env          # Windows: copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve             # http://127.0.0.1:8000

# SPA — in a second terminal
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Sign in as `demo@tracky.test` / `password`.

Handy resets:

```bash
php artisan migrate:fresh --seed                 # rebuild the database and demo data
php artisan tracky:make-admin you@example.com    # promote an account to admin
```

## Before you open a pull request

Everything CI checks, you can run locally:

```bash
# Backend
cd backend
vendor/bin/pint --test        # code style — run `vendor/bin/pint` to fix
php artisan test              # feature tests

# Frontend
cd frontend
npm run lint
npm run typecheck
npm run build

# End-to-end (both servers running)
npm run e2e
```

A pull request with a red pipeline will not be merged, so it saves a round trip to run these first.

## Standards

### PHP

**Pint** (Laravel's PHP-CS-Fixer preset) is the formatter — there is no style debate, just run it.

Beyond formatting:

- **Controllers stay thin.** Validate in a FormRequest, authorize with a policy, delegate anything
  non-trivial to a service, return a Resource. If an action grows past a screen, something belongs
  elsewhere.
- **Validation lives in FormRequests**, one per action, not inline in the controller.
- **Authorization lives in policies**, and every single-record route calls `authorize()`.
- **List endpoints scope at the query level** — `->ownedBy($request->user()->id)` — never by filtering
  after the fetch.
- **Type hints everywhere**: parameters, return types, and array shapes in docblocks where they help.
- **Comments explain why, not what.** `// Denormalized owner reference for fast scoping without a
  join.` earns its place; `// Get the user` does not.

### TypeScript and React

- **No `any`.** Strict mode is on and the build fails on type errors. If a type is genuinely unknown,
  use `unknown` and narrow it.
- **Server state belongs to TanStack Query**, never copied into `useState`. Client state (modals,
  drafts, toasts) belongs in React state or context.
- **Feature modules own their query keys**, fetchers and mutations. Pages compose hooks; pages do not
  call axios.
- **`src/types.ts` mirrors the API resources.** Change a Laravel Resource, change the type in the same
  pull request.
- **Tailwind utilities in the markup.** Reach for a component in `components/ui/` when a pattern shows
  up a third time.
- **Mobile is not an afterthought.** Check both breakpoints before opening the pull request.

### Tests

New behaviour needs a test. For anything ownership-sensitive, that means at minimum:

1. the owner succeeding,
2. a non-owner receiving `403`,
3. an unauthenticated request receiving `401`,
4. for list endpoints, a foreign record being absent from the response body.

Test names read as sentences about behaviour — `user_cannot_log_against_another_users_metric`, not
`test_entry_store_403`. See [docs/TESTING.md](docs/TESTING.md) for the full conventions.

## Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(metrics): add duration metric type
fix(widgets): restore order when reorder request fails
docs(api): document the bulk entry endpoint
test(entries): cover scale range validation
refactor(services): extract streak calculation from controller
chore(deps): bump vite to 8.0.12
```

Types in use: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`.

Write the subject in the imperative — "add", not "added" — keep it under ~72 characters, and use the
body to explain *why* when the reason is not obvious from the diff.

## Pull requests

1. Branch from `main`: `git checkout -b feat/short-description`
2. Make the change, with tests
3. Run the full local check list above
4. Push and open a pull request against `main`
5. Fill in the template — what changed, why, and how you verified it

Keep pull requests focused. A change that fixes a bug *and* refactors two unrelated modules is
harder to review than two pull requests, and harder to revert if it turns out to be wrong.

## Reporting bugs

Open an issue using the bug report template. The two things that make a report actionable are
**exact reproduction steps** and **what you expected instead**. Environment details (OS, PHP version,
Node version, browser) help when the behaviour is not reproducible everywhere.

For security vulnerabilities, do **not** open a public issue — see [SECURITY.md](SECURITY.md).

## Project layout

Where things live, when you are looking for the right file:

| Path | Contents |
| --- | --- |
| `backend/app/Http/Controllers/` | Request orchestration |
| `backend/app/Http/Requests/` | Validation rules |
| `backend/app/Http/Resources/` | The JSON contract |
| `backend/app/Policies/` | Authorization rules |
| `backend/app/Services/` | Non-trivial domain logic |
| `backend/database/migrations/` | Schema |
| `backend/tests/Feature/` | API tests |
| `frontend/src/features/` | Per-domain API hooks and components |
| `frontend/src/pages/` | Route-level screens |
| `frontend/src/components/ui/` | Reusable primitives |
| `frontend/src/lib/` | axios client, query client, formatters |
| `frontend/cypress/e2e/` | End-to-end specs |
| `docs/` | Architecture, API, data model, testing, deployment |

Deeper context lives in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — worth reading before a change
that touches authorization or the data layer.
