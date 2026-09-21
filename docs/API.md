# API reference

Complete reference for the Tracky REST API — every endpoint, its parameters, payloads and status
codes.

**Base URL:** `http://127.0.0.1:8000/api` in development.
**Content type:** `application/json` for requests and responses.
**Authentication:** `Authorization: Bearer <token>` on every route except register and login.

## Contents

- [Conventions](#conventions)
- [Authentication](#authentication)
- [Profile](#profile)
- [Metrics](#metrics)
- [Entries](#entries)
- [Dashboards](#dashboards)
- [Widgets](#widgets)
- [Admin](#admin)
- [Errors](#errors)
- [Rate limits](#rate-limits)

## Conventions

### Response envelopes

Resource endpoints wrap their payload in a `data` key, following Laravel's JSON Resource convention:

```jsonc
// Single resource
{ "data": { "id": 1, "name": "Sleep Hours", ... } }

// Collection
{ "data": [ { ... }, { ... } ] }

// Paginated collection
{
  "data": [ ... ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": { "current_page": 1, "last_page": 3, "per_page": 100, "total": 250, "from": 1, "to": 100 }
}
```

Auth and profile endpoints return the user object unwrapped, since there is no collection form.

### Ownership

Every resource below is owner-scoped. Requesting another user's record returns `403`, and list
endpoints only ever contain the caller's own rows. Admins may **read** any record but may not
create, update or delete user-owned data — see
[the authorization model](ARCHITECTURE.md#authorization-three-independent-layers).

### The `value` field

Entries are written and read with a single `value` field. The API routes it into the correct typed
column based on the parent metric's `type`, and collapses it back on read:

| Metric type | Accepted `value` | Stored in |
| --- | --- | --- |
| `numeric` | number (e.g. `7.5`) | `value_numeric` |
| `scale` | integer within `scale_min`–`scale_max` | `value_scale` |
| `boolean` | `true` / `false` | `value_boolean` |

Read responses include both the typed columns and the resolved `value`, so a client can use whichever
is convenient.

---

## Authentication

### `POST /api/register`

Create an account and receive a token. Public. Rate limited to 20 requests/minute per IP.

**Body**

| Field | Rules |
| --- | --- |
| `name` | required, string, max 255 |
| `email` | required, email, lowercase, max 255, unique |
| `password` | required, confirmed, Laravel default password rules |
| `password_confirmation` | required, must match `password` |

```bash
curl -X POST http://127.0.0.1:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","password":"secret-password","password_confirmation":"secret-password"}'
```

**`201 Created`**

```json
{
  "user": { "id": 3, "name": "Ada", "email": "ada@example.com", "role": "user" },
  "token": "3|xK9mP2nQ7rT4vW8yZ1aB5cD6eF0gH..."
}
```

A `role` field in the request body is ignored — new accounts are always created as `user`.

### `POST /api/login`

Exchange credentials for a token. Public. Rate limited to 10 requests/minute per IP.

**Body:** `email` (required), `password` (required).

```bash
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@tracky.test","password":"password"}'
```

**`200 OK`** — same shape as register. **`422`** on bad credentials.

### `POST /api/logout`

Revoke the token used to make the request. Other devices' tokens are unaffected.

**`200 OK`** — `{ "message": "Logged out." }`

---

## Profile

### `GET /api/user`

The authenticated user.

```json
{ "id": 2, "name": "Amir", "email": "demo@tracky.test", "role": "user", "created_at": "..." }
```

### `PATCH /api/user`

Update name, email and/or password. All fields optional, but changing the password requires the
current one.

| Field | Rules |
| --- | --- |
| `name` | string, max 255 |
| `email` | email, unique (ignoring self) |
| `current_password` | required when `password` is present; must match the stored password |
| `password` | confirmed, default password rules |
| `password_confirmation` | required with `password` |

Changing the email clears `email_verified_at`. **`200 OK`** returns the updated user.

---

## Metrics

A metric is a thing you measure. Owner-scoped, full CRUD.

### `GET /api/metrics`

List the caller's metrics, ordered by name, each with `entries_count` and its `latest_entry`.

**Query:** `active_only` (boolean) — restrict to metrics where `is_active` is true.

```json
{
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "name": "Sleep Hours",
      "description": null,
      "type": "numeric",
      "unit": "hours",
      "scale_min": 1,
      "scale_max": 10,
      "is_active": true,
      "entries_count": 21,
      "latest_entry": { "id": 21, "logged_date": "2026-09-21", "value": 6.5, "...": "..." },
      "created_at": "2026-09-01T10:00:00.000000Z",
      "updated_at": "2026-09-21T08:12:00.000000Z"
    }
  ]
}
```

### `POST /api/metrics`

| Field | Rules |
| --- | --- |
| `name` | required, string, max 100 |
| `description` | nullable, string, max 1000 |
| `type` | required, one of `numeric`, `scale`, `boolean` |
| `unit` | nullable, string, max 30 |
| `scale_min` | nullable, integer, 0–1000 |
| `scale_max` | nullable, integer, 0–1000 |
| `is_active` | boolean |

```bash
curl -X POST http://127.0.0.1:8000/api/metrics \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Mood","type":"scale","scale_min":1,"scale_max":10}'
```

**`201 Created`** with the metric. The owner is taken from the token, never from the body.

### `GET /api/metrics/{id}`

Single metric with `entries_count` and `latest_entry`. Owner or admin. **`403`** otherwise.

### `PATCH /api/metrics/{id}`

Owner only. Same fields as create except `type`, which is immutable — changing it would orphan
existing values in the wrong column. Delete and recreate instead.

### `DELETE /api/metrics/{id}`

Owner only. **`204 No Content`**. Cascades to the metric's entries and to any widgets bound to it.

### `GET /api/metrics/{id}/entries`

Paginated entries for one metric, newest first. This is the chart data source. Owner or admin.

| Query | Description |
| --- | --- |
| `from` | ISO date — only entries on or after |
| `to` | ISO date — only entries on or before |
| `per_page` | page size, default `100` |
| `page` | page number |

```bash
curl "http://127.0.0.1:8000/api/metrics/1/entries?from=2026-09-01&to=2026-09-21" \
  -H "Authorization: Bearer $TOKEN"
```

Returns a paginated envelope.

### `GET /api/metrics/{id}/summary`

Stat and streak figures computed over the metric's **full** history, not a paginated page. Owner or
admin.

**Query:** `threshold` (number, default `1`) — the value at or above which a day counts toward a
streak.

```json
{
  "current": 6.5,
  "current_date": "2026-09-21",
  "average": 7.62,
  "yesterday": 7.5,
  "last_week": 8.5,
  "streak": 12
}
```

All value fields are `null` when the metric has no entries; `streak` is then `0`.

---

## Entries

One logged value for one metric on one day. Owner-scoped, full CRUD.

`UNIQUE(metric_id, logged_date)` means a second entry for the same metric and date updates the
existing row rather than creating a duplicate.

### `GET /api/entries`

Paginated entries across all of the caller's metrics, newest first.

| Query | Description |
| --- | --- |
| `metric_id` | restrict to one metric |
| `from` / `to` | ISO date range |
| `per_page` | page size, default `25` |
| `page` | page number |

### `POST /api/entries`

| Field | Rules |
| --- | --- |
| `metric_id` | required, integer, must exist **and be owned by the caller** |
| `logged_date` | required, date |
| `value` | required — see [the `value` field](#the-value-field) |
| `notes` | nullable, string, max 1000 |

```bash
curl -X POST http://127.0.0.1:8000/api/entries \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"metric_id":1,"logged_date":"2026-09-21","value":7.5,"notes":"Slept well"}'
```

**`201 Created`** when the entry is new, **`200 OK`** when an entry already existed for that metric
and date and was updated in place. Posting to a metric you do not own returns **`403`**.

### `POST /api/entries/bulk`

Upsert up to 100 entries in one request — this is what the Quick Log screen uses.

| Field | Rules |
| --- | --- |
| `entries` | required, array, 1–100 items |
| `entries.*.metric_id` | required, integer, must exist and be owned by the caller |
| `entries.*.logged_date` | required, date |
| `entries.*.value` | required |
| `entries.*.notes` | nullable, string, max 1000 |

```bash
curl -X POST http://127.0.0.1:8000/api/entries/bulk \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"entries":[
        {"metric_id":1,"logged_date":"2026-09-21","value":7.5},
        {"metric_id":2,"logged_date":"2026-09-21","value":8},
        {"metric_id":3,"logged_date":"2026-09-21","value":true}
      ]}'
```

The batch is atomic: if any item fails validation or ownership, nothing is written.

### `GET /api/entries/{id}` · `PATCH /api/entries/{id}` · `DELETE /api/entries/{id}`

Read is owner or admin; write and delete are owner only. `PATCH` accepts `logged_date`, `value` and
`notes` — `metric_id` is immutable. `DELETE` returns **`204`**.

---

## Dashboards

A named collection of widgets. Owner-scoped, full CRUD.

### `GET /api/dashboards`

The caller's dashboards, each with `widgets_count`.

### `POST /api/dashboards`

| Field | Rules |
| --- | --- |
| `name` | required, string, max 100 |
| `description` | nullable, string, max 1000 |

**`201 Created`**.

### `GET /api/dashboards/{id}`

A dashboard with its `widgets` eager-loaded in `position` order, each widget carrying its `metric`.
Owner or admin.

### `PATCH /api/dashboards/{id}` · `DELETE /api/dashboards/{id}`

Owner only. Deleting cascades to the dashboard's widgets (not to metrics or entries).

---

## Widgets

A chart bound to one metric on one dashboard. Listing and creation are nested under a dashboard;
single-widget operations are top level.

### `GET /api/dashboards/{id}/widgets`

Widgets for a dashboard in `position` order, each with its `metric`. Owner or admin.

### `POST /api/dashboards/{id}/widgets`

| Field | Rules |
| --- | --- |
| `metric_id` | required, integer, must exist and be owned by the caller |
| `chart_type` | required, one of `line`, `bar`, `stat`, `streak` |
| `config` | nullable, object — see [config keys](#config-keys) |
| `position` | nullable, integer ≥ 0; appended to the end when omitted |

```bash
curl -X POST http://127.0.0.1:8000/api/dashboards/1/widgets \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"metric_id":1,"chart_type":"line","config":{"range_days":14,"color":"#6366f1","show_points":true}}'
```

**`201 Created`**.

#### Config keys

`config` is free-form JSON; these are the keys the frontend reads. Keys not relevant to a chart type
are ignored.

| Key | Type | Applies to | Meaning |
| --- | --- | --- | --- |
| `range_days` | `7 \| 14 \| 30 \| 90` | line, bar | Days of history to plot |
| `show_points` | boolean | line | Render point markers |
| `color` | hex string | line, bar | Series color |
| `grouping` | `daily \| weekly \| monthly` | bar | Bucket size |
| `comparison` | `average \| yesterday \| last_week` | stat | What the delta compares against |
| `threshold_type` | `boolean \| numeric` | streak | How a day qualifies |
| `threshold_value` | number | streak | The qualifying value for `numeric` thresholds |

### `PATCH /api/dashboards/{id}/widgets/reorder`

Persist a new widget order in one request. Owner only.

| Field | Rules |
| --- | --- |
| `widget_ids` | required, array of distinct integers, min 1 |

```bash
curl -X PATCH http://127.0.0.1:8000/api/dashboards/1/widgets/reorder \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"widget_ids":[4,1,3,2]}'
```

Array index becomes `position`. Every id must belong to the named dashboard; otherwise the whole
request is rejected and no positions change.

### `GET /api/widgets/{id}` · `PATCH /api/widgets/{id}` · `DELETE /api/widgets/{id}`

Read is owner or admin; write and delete are owner only. `PATCH` accepts `chart_type` and `config`
— a widget cannot be moved to a different dashboard or rebound to a different metric. `DELETE`
returns **`204`**.

---

## Admin

Role-gated under `/api/admin/*` by the `admin` middleware. A non-admin token receives **`403`**
before reaching a controller.

### `GET /api/admin/users`

Paginated list of all users with `metrics_count`, `entries_count` and `dashboards_count`, ordered by
name. **Query:** `per_page` (default `25`), `page`.

### `GET /api/admin/users/{id}`

One user with their counts.

### `PATCH /api/admin/users/{id}`

Change a user's role. This is the only route that may write `role`.

| Field | Rules |
| --- | --- |
| `role` | required, one of `user`, `admin` |

An admin cannot change **their own** role — **`403`** — so the last administrator cannot accidentally
lock themselves out.

### `DELETE /api/admin/users/{id}`

Delete a user and cascade all of their data. **`204 No Content`**. An admin cannot delete their own
account through this route (**`403`**).

> Admins have **no** write access to user-owned data — there is no admin route that edits someone's
> metrics, entries, dashboards or widgets. This is enforced by the policies, not by the absence of a
> route.

---

## Errors

All errors are JSON with a `message`.

| Status | Meaning | Typical cause |
| --- | --- | --- |
| `401` | Unauthenticated | Missing, malformed or revoked token |
| `403` | Forbidden | The record belongs to another user, or an admin attempted a write |
| `404` | Not found | No record with that id |
| `422` | Validation failed | Bad or missing fields |
| `429` | Too many requests | Rate limit exceeded |
| `500` | Server error | Unhandled exception |

**Validation errors** carry a per-field breakdown:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["The name field is required."],
    "type": ["The selected type is invalid."]
  }
}
```

**Authorization errors** are plain:

```json
{ "message": "This action is unauthorized." }
```

Note that accessing another user's record returns `403`, not `404`. The record's existence is not
treated as a secret; its contents are.

## Rate limits

| Route | Limit |
| --- | --- |
| `POST /api/register` | 20/minute per IP |
| `POST /api/login` | 10/minute per IP, plus Laravel's per-credential lockout |
| All other routes | Unlimited by default; add a `throttle` middleware before exposing publicly |

Exceeding a limit returns `429` with a `Retry-After` header.
