# Security policy

## Reporting a vulnerability

Please do **not** open a public issue for a security vulnerability.

Report it privately through
[GitHub's private vulnerability reporting](https://github.com/zakaria17amir/Tracky/security/advisories/new),
which opens a draft advisory visible only to the maintainer.

A useful report includes:

- what the vulnerability is and what an attacker could do with it,
- the steps to reproduce it,
- the affected file, endpoint or version,
- any suggested fix, if you have one in mind.

I will acknowledge the report within a few days and let you know the outcome. If you would like
credit in the advisory, say so and I will name you.

## Scope

Tracky is a personal portfolio project with no public deployment. Reports are welcome for anything
in this repository — the API, the SPA, the CI configuration or the dependency set.

Out of scope:

- vulnerabilities in third-party dependencies that already have a published advisory (Dependabot
  tracks those),
- findings that require an already-compromised machine or a physically present attacker,
- the demo credentials in the seeder — they are development fixtures, documented as such, and the
  deployment guide explicitly says not to seed production.

## What the application already does

Context for anyone assessing the codebase:

**Authorization is enforced three times, independently.** Middleware (`auth:sanctum`, `admin`),
per-model policies, and query-level owner scoping. No single mistake is sufficient to expose another
user's data. Frontend route guards are UX only and are never load-bearing. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#authorization-three-independent-layers).

**Privilege escalation via mass assignment is blocked.** `role` is excluded from `User::$fillable`,
so it cannot be set through registration or profile update. It is written only by the seeder, the
admin role endpoint, and a console command. A feature test asserts a crafted `role` field in a
registration payload is ignored.

**Admins cannot write user data.** Policies allow admins to read, not to create, update or delete
someone's metrics, entries, dashboards or widgets — so an admin account compromise cannot rewrite
another user's history.

**Passwords** are hashed with bcrypt (12 rounds) through Laravel's `hashed` cast, and a password
change requires the current password.

**Tokens** are Sanctum personal access tokens, revoked server-side on logout. A `401` clears the
client token and redirects to login.

**Rate limiting** is applied to authentication: 20/minute on registration and 10/minute on login, per
IP, plus Laravel's per-credential lockout.

**Injection.** All database access goes through Eloquent's parameter binding; there is no raw SQL in
the codebase. Output is escaped by React's default rendering, and `dangerouslySetInnerHTML` is not
used anywhere.

## Known limitations

Stated plainly, since an honest list is more useful than an implied claim of completeness:

- **Tokens live in `localStorage`**, which is reachable by script. This is a deliberate trade for an
  origin-agnostic API — see
  [the rationale](docs/ARCHITECTURE.md#bearer-tokens-over-cookie-sessions). It means XSS discipline is
  doing real security work.
- **No token expiry or refresh rotation.** Tokens are valid until logout revokes them.
- **No email verification flow.** `email_verified_at` is cleared on an email change, but nothing
  sends a verification mail — no mailer is configured.
- **No audit log.** Admin actions such as role changes and account deletions are not recorded.
- **No 2FA.**

These are gaps in a portfolio project, not in a product with real users. Anyone deploying this for
real should read the [production checklist](docs/DEPLOYMENT.md#production-checklist) first.

## Supported versions

| Version | Supported |
| --- | --- |
| `main` | ✅ |
| Older tags | ❌ |

Fixes land on `main`. There are no backported release branches.
