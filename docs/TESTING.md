# Testing

Three suites, each aimed at a different class of bug: **PHPUnit feature tests** assert the API
contract and the security model, **Vitest + React Testing Library** cover the SPA's logic and
components in isolation, and **Cypress E2E** drives the real UI against the real API.

## Running the suites

```bash
# Backend — feature tests (in-memory SQLite, no setup needed)
cd backend
php artisan test
php artisan test --filter=AdminTest      # one file
php artisan test --testsuite=Feature     # one suite

# Code style
vendor/bin/pint --test                   # check
vendor/bin/pint                          # fix

# Frontend — unit/component tests and static analysis
cd frontend
npm test                                 # Vitest, jsdom
npm run lint
npm run typecheck
npm run build                            # type-check + production build

# End-to-end — both servers must already be running
npm run e2e                              # headless
npm run cypress:open                     # interactive
```

All of the above run on every push and pull request — see [the CI workflow](../.github/workflows/ci.yml).

## What is tested where

```
                  ┌─────────────────────────────┐
   Cypress E2E    │  Real browser → SPA → API   │   critical user journeys
                  ├─────────────────────────────┤
   PHPUnit        │  HTTP → routes → DB         │   API contract + security
                  ├─────────────────────────────┤
   Vitest + RTL   │  Pure logic and components  │   chart maths, render states
                  ├─────────────────────────────┤
   tsc + eslint   │  Types and code shape       │   client/server contract drift
                  └─────────────────────────────┘
```

The backend suite is deliberately weighted toward **feature** tests over unit tests. A unit test on a
policy proves the policy returns `false`; a feature test proves the request actually gets a `403` —
and that is the property that matters, since it holds even if a controller forgets to call
`authorize()`.

## Backend suite

Feature tests use an in-memory SQLite database with `RefreshDatabase`, so they need no setup and
leave nothing behind.

### `AuthTest` — registration, login, tokens, profile

| Test | Asserts |
| --- | --- |
| `registration_returns_a_token_and_user_with_default_role` | Registration issues a token; the account is `user` |
| `registration_cannot_self_assign_admin_role` | A `role: admin` field in the payload is **ignored** |
| `registration_validates_input` | Missing and malformed fields produce `422` with field errors |
| `login_returns_a_token` | Valid credentials mint a token |
| `login_fails_with_wrong_password` | Bad credentials do not |
| `protected_route_requires_authentication` | No token means `401` |
| `authenticated_user_can_fetch_profile` | `GET /user` returns the caller |
| `logout_revokes_the_current_token` | The token stops working afterwards |
| `user_can_update_their_profile` | Name and email changes persist |

### `MetricTest` — ownership on the primary resource

| Test | Asserts |
| --- | --- |
| `user_can_create_and_list_their_metrics` | The happy path |
| `metric_index_is_scoped_to_the_owner` | Another user's metrics are **absent from the list**, not merely hidden |
| `scale_metric_requires_max_greater_than_min` | Cross-field validation |
| `user_cannot_view_another_users_metric` | `403` |
| `user_cannot_update_another_users_metric` | `403` |
| `user_cannot_delete_another_users_metric` | `403` |
| `owner_can_delete_their_metric` | `204` and the row is gone |
| `admin_can_view_but_not_modify_another_users_metric` | The read/write asymmetry for admins |

That last one is the test that pins down the authorization model: an admin reading someone's metric
succeeds, and the same admin writing to it fails.

### `EntryTest` — the one-per-day rule and bulk writes

| Test | Asserts |
| --- | --- |
| `user_can_log_an_entry_for_their_metric` | `201` and the resolved `value` |
| `logging_twice_on_the_same_day_updates_instead_of_duplicating` | The unique constraint drives an upsert, second write returns `200` |
| `scale_value_out_of_range_is_rejected` | `422` — range comes from the parent metric |
| `user_cannot_log_against_another_users_metric` | `403` |
| `bulk_upsert_saves_multiple_entries` | Batch write works |
| `bulk_upsert_is_idempotent_per_day` | Running the same batch twice does not duplicate |
| `entry_index_is_scoped_to_the_owner` | Query-level scoping |
| `metric_summary_computes_streak_and_average_over_full_history` | Summary maths, beyond one page of results |
| `user_cannot_view_summary_of_another_users_metric` | `403` |
| `user_cannot_delete_another_users_entry` | `403` |

### `DashboardWidgetTest` — nested ownership and composition rules

| Test | Asserts |
| --- | --- |
| `user_can_create_a_dashboard` | Happy path |
| `dashboards_are_scoped_to_the_owner` | Query scoping |
| `user_cannot_view_another_users_dashboard` | `403` |
| `user_can_add_a_widget_to_their_dashboard` | Happy path |
| `boolean_metric_rejects_incompatible_chart_type` | Type-driven chart rules are enforced **server-side** |
| `user_cannot_add_a_widget_using_another_users_metric` | Ownership checked on the *referenced* metric, not just the dashboard |
| `user_cannot_add_a_widget_to_another_users_dashboard` | `403` |
| `owner_can_update_a_widget_chart_type_and_config` | Happy path |
| `updating_a_boolean_widget_to_an_incompatible_chart_type_is_rejected` | The rule holds on update too |
| `user_cannot_update_another_users_widget` | `403` |
| `reorder_persists_widget_positions` | Array order becomes `position` |
| `reorder_rejects_widgets_from_another_dashboard` | A crafted id list cannot move foreign widgets |
| `deleting_a_dashboard_cascades_its_widgets` | The FK cascade actually fires |

The widget tests cover the subtlest hole in the model: a widget references *two* parents, so
authorizing the dashboard alone would let a user render someone else's metric on their own page.
Both parents are checked.

### `GraphQLDashboardTest` — the dashboard query

| Test | Asserts |
| --- | --- |
| `owner_gets_widgets_with_metric_entries_and_summary_in_one_request` | Position order, JSON config, metric, 90-day entry window, summary maths |
| `user_cannot_query_another_users_dashboard` | `data.dashboard` is null and an unauthorized error is returned |
| `guest_is_rejected` | No token means `401` before GraphQL runs |
| `admin_can_query_another_users_dashboard` | The admin read path holds over GraphQL too |
| `repeating_a_query_works_on_a_serializing_cache_store` | A second identical query succeeds on a file cache — guards the Laravel 13 unserialize restriction |
| `metrics_are_eager_loaded_so_queries_grow_only_with_per_widget_data` | Query count stays within 3 + 2 per widget — an N+1 on metrics fails it |

### `AdminTest` — the role boundary

| Test | Asserts |
| --- | --- |
| `non_admin_cannot_access_admin_routes` | Middleware blocks before any controller runs |
| `admin_can_list_users` | Happy path |
| `admin_can_change_another_users_role` | Happy path |
| `admin_cannot_change_their_own_role` | `403` — the last admin cannot demote themselves |
| `admin_can_delete_a_user_and_cascade_their_data` | Full ownership cascade |
| `admin_cannot_delete_themselves` | `403` |

### `ProfileTest` — account changes

Covers name and email updates, email uniqueness, and that a password change requires the correct
current password — both the rejection and the success path.

## Frontend unit and component tests

Vitest runs in a jsdom environment configured in `vite.config.ts`, with React Testing Library for
components. Test files sit next to the code they cover (`*.test.ts` / `*.test.tsx`).

- **Pure logic first.** Chart data shaping (`lib/widgetData.ts`) is plain functions, tested without
  rendering anything. Time-dependent code uses `vi.setSystemTime` so results don't drift by date.
- **Components through the DOM.** Components are queried by role and text, as a user would find
  them. Data hooks are mocked at the module boundary (`vi.mock("../entries")`) so a test controls
  loading, empty and populated states directly.

**`lib/widgetData.test.ts`** — series sorting, labels and day-window filtering, default widget
config.

**`features/dashboardGraph.test.ts`** — mapping the GraphQL response (string ids to numbers, 1/0
back to booleans for boolean metrics, null or PHP `[]` config), the request variables, and GraphQL `errors`
surfacing as a thrown error.

**`features/widgets/WidgetCard.test.tsx`** — stat and streak cards from the embedded summary, empty
state for a chart with no points, and the edit button opening the builder for that widget.

**`features/widgets/widgetBuilderSlice.test.ts`** — every builder transition as a pure reducer:
open for new vs. edit, metric selection, chart choice resetting config, back never below step one,
close resetting everything.

**`features/widgets/WidgetConfigurator.test.tsx`** — the configurator against a real store: a
boolean metric only offers Stat Card and Streak, and Back returns to the metric list.

## Frontend E2E

Cypress specs drive a real browser against both running servers. They are kept few and broad: each
one walks a complete journey rather than asserting an isolated component.

**`auth.cy.ts`**
- registers a new user and lands on the dashboard
- logs out and back in
- blocks protected routes when unauthenticated
- shows a validation error on bad login

**`metrics-and-logging.cy.ts`**
- creates a numeric metric and logs a value for it, verifying it back on the metrics list
- creates a boolean metric and toggles it on the log page

**`dashboard-widgets.cy.ts`**
- creates a dashboard, then adds a widget through the full three-step configurator
- loads a two-widget dashboard with exactly one GraphQL request and no per-widget entry requests

Each spec registers its own account, so specs are independent and do not depend on the seeder or on
each other's leftovers.

## Conventions

**Naming.** Backend tests read as sentences about behaviour —
`user_cannot_log_against_another_users_metric`, not `test_entry_store_403`. The name should say what
broke when it goes red.

**One behaviour per test.** A test asserting both a status code and a side effect is fine when they
describe the same behaviour; a test covering two rules is two tests.

**Test the boundary, not the internals.** Assertions go through HTTP, so a refactor that preserves
behaviour does not break the suite.

**Negative tests carry the weight.** For a multi-tenant API, "user B cannot see user A's data" is
worth more than "user A can see their own". The suite is weighted accordingly.

## Adding a test

A new ownership-sensitive endpoint should get, at minimum:

1. the owner succeeding,
2. a non-owner receiving `403`,
3. an unauthenticated request receiving `401`,
4. for list endpoints, a foreign record being **absent from the response body**.

```php
public function test_user_cannot_view_another_users_widget(): void
{
    $owner = User::factory()->create();
    $other = User::factory()->create();

    $dashboard = Dashboard::factory()->for($owner)->create();
    $widget = Widget::factory()->for($dashboard)->create();

    $this->actingAs($other)
        ->getJson("/api/widgets/{$widget->id}")
        ->assertStatus(403);
}
```

Factories exist for every model (`UserFactory`, `MetricFactory`, `EntryFactory`, `DashboardFactory`,
`WidgetFactory`), so setup stays short.

## Current coverage

| Suite | Count | Scope |
| --- | --- | --- |
| PHPUnit feature | 56 tests, 145 assertions | REST and GraphQL contract, auth, ownership, cascades, validation |
| Vitest + RTL | 23 tests | Chart data shaping, GraphQL mapping, builder reducer, widget and configurator rendering |
| Cypress E2E | 3 specs, 8 journeys | Registration, login, metric CRUD, logging, widget creation |
