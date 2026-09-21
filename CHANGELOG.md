# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Planned, in rough priority order:

- CSV / JSON export of entries
- Correlation view — plot two metrics against one another
- Reminders for metrics left unlogged
- Shareable read-only dashboard links
- Postgres as the default driver, with a Docker Compose setup
- Component-level tests for the React tree

## [1.0.0] — 2026-09-21

First public release.

### Added

**Metrics**
- User-defined metrics with three types: numeric, scale (with configurable min/max) and boolean
- Optional unit label and description
- Active/inactive state — retire a metric without losing its history
- Full owner-scoped CRUD

**Entries**
- One entry per metric per day, enforced by a unique database constraint
- Quick Log screen that renders the right input control per metric type
- Bulk upsert endpoint — log every active metric for a day in a single atomic request
- Per-metric history view with date-range filtering and inline edit/delete
- Optional notes on any entry

**Dashboards and widgets**
- Named dashboards holding any number of widgets
- Four chart types: line, bar, stat card and streak
- Three-step widget configurator — select metric, choose chart, configure — with chart types filtered
  by the metric's type
- Per-widget configuration: date range, color, data points, grouping, comparison basis, streak
  threshold
- Drag-and-drop reordering with optimistic updates and rollback on failure

**Authentication and authorization**
- Registration and login issuing Sanctum Bearer tokens; logout revokes server-side
- Three independent enforcement layers: middleware, per-model policies, query-level owner scoping
- `role` guarded against mass assignment — no privilege escalation through registration or profile
  update
- Admin role with **read-only** access to user data, plus account and role management
- Rate limiting on registration (20/min) and login (10/min)
- `tracky:make-admin` console command

**Frontend**
- React 19 + TypeScript SPA in strict mode, built with Vite
- TanStack Query for all server state, with optimistic mutations
- Responsive throughout — desktop sidebar collapses to a mobile tab bar, tables reflow to cards
- Toast notifications and an error boundary
- Centralized API error mapping, including per-field validation messages

**Testing**
- 51 PHPUnit feature tests (122 assertions) covering the API contract, ownership, cascades and
  validation
- Cypress E2E specs covering registration, login, metric CRUD, logging and widget creation

**Documentation and tooling**
- Architecture, API reference, data model, testing and deployment guides
- GitHub Actions CI: backend tests, Pint, frontend lint, type-check, build and E2E
- CodeQL analysis and Dependabot updates

[Unreleased]: https://github.com/zakaria17amir/Tracky/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/zakaria17amir/Tracky/releases/tag/v1.0.0
