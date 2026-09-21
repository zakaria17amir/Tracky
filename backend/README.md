# Tracky — API

The Laravel 13 REST API behind [Tracky](../README.md). Stateless JSON, authenticated with Sanctum
Bearer tokens.

## Run it

```bash
composer install
cp .env.example .env          # Windows: copy .env.example .env
php artisan key:generate
php artisan migrate --seed    # creates the SQLite file, tables and demo data
php artisan serve             # http://127.0.0.1:8000
```

Seeded accounts: `demo@tracky.test` and `admin@tracky.test`, both with the password `password`.

## Commands

```bash
php artisan test                                 # feature tests
php artisan migrate:fresh --seed                 # rebuild the database and demo data
php artisan tracky:make-admin you@example.com    # promote an account to admin
vendor/bin/pint                                  # format (use --test to check only)
```

## Layout

| Path | Contents |
| --- | --- |
| `app/Http/Controllers/` | Request orchestration — thin by design |
| `app/Http/Requests/` | Per-action validation rules |
| `app/Http/Resources/` | The JSON contract clients see |
| `app/Http/Middleware/` | `EnsureUserIsAdmin` |
| `app/Models/` | `User`, `Metric`, `Entry`, `Dashboard`, `Widget` |
| `app/Policies/` | Per-model authorization |
| `app/Services/` | `MetricSummary`, `EntryWriter` |
| `database/migrations/` | Schema |
| `database/seeders/` | Demo data |
| `routes/api.php` | All API routes |
| `tests/Feature/` | API test suite |

## Documentation

- [API reference](../docs/API.md) — every endpoint, payload and status code
- [Architecture](../docs/ARCHITECTURE.md) — layering and the three-tier authorization model
- [Data model](../docs/DATA-MODEL.md) — tables, relationships, indexes
- [Testing](../docs/TESTING.md) — what is covered and how to extend it
- [Deployment](../docs/DEPLOYMENT.md) — production build and configuration
