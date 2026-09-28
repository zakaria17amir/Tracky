# Deployment

Taking Tracky from a development checkout to a production deployment: building both halves,
configuring the environment, and the choices that matter once it is no longer running on localhost.

## Contents

- [Docker image](#docker-image)
- [How the two halves fit together](#how-the-two-halves-fit-together)
- [Building](#building)
- [Backend environment](#backend-environment)
- [Switching to Postgres or MySQL](#switching-to-postgres-or-mysql)
- [Web server configuration](#web-server-configuration)
- [Production checklist](#production-checklist)
- [Hosting options](#hosting-options)

## Docker image

The quickest production-shaped deployment is the published image, which implements Option A below
(one origin) with no web-server configuration to write.

```bash
docker run -d -p 8080:8080 -v tracky-data:/data ghcr.io/zakaria17amir/tracky:latest
```

**What is inside.** A multi-stage `Dockerfile` at the repo root: a Node stage builds the SPA, then a
[FrankenPHP](https://frankenphp.dev) stage (PHP 8.4 + Caddy) installs the API's production
dependencies and copies the SPA build into `public/`. Caddy serves hashed assets straight from disk;
every other path reaches Laravel, where `/api/*` is the API, `/up` is the health check and anything
else returns the SPA's `index.html` so React Router can resolve it.

**On start** (`docker/entrypoint.sh`): create the SQLite file on the `/data` volume if needed,
generate an `APP_KEY` once and keep it in `/data/app_key` (unless you pass `APP_KEY`), run
migrations, seed the demo accounts on first start when `SEED_DEMO=true`, and cache config, routes
and views.

| Variable | Default | Notes |
| --- | --- | --- |
| `APP_KEY` | generated into `/data/app_key` | Set it explicitly to manage it yourself |
| `SEED_DEMO` | unset | `true` seeds demo data the first time the database is created |
| `DB_DATABASE` | `/data/database.sqlite` | Keep it on the volume |
| `APP_URL` | `http://localhost` | Set to the public URL |

Put a TLS-terminating proxy or load balancer in front, or set `SERVER_NAME` to your domain to let
Caddy obtain a certificate itself.

**How it is published.** The `publish` job in `.github/workflows/ci.yml` runs only on pushes to
`main`, after the backend, frontend and E2E jobs pass. It builds the image, starts it, and checks
`/up`, that `/` and a client route return the SPA, that `/api/user` answers `401`, and that the
seeded demo account can log in. Only then does it push `latest` and `sha-<commit>` tags to GHCR.

## How the two halves fit together

In development, Vite serves the SPA on `:5173` and proxies `/api` to Laravel on `:8000`. That proxy
is a **dev-server feature** — it does not exist in a production build.

The axios client calls a relative base URL:

```ts
const api = axios.create({ baseURL: "/api", ... });
```

Relative means "same origin as the page". So in production you have two options:

**Option A — same origin (recommended).** Serve the built SPA and the API from one origin, with the
web server routing `/api/*` to Laravel and everything else to `index.html`. Nothing in the client
needs to change, and there is no CORS configuration to get wrong.

**Option B — separate origins.** Host the SPA on a static host (Netlify, Vercel, Pages) and the API
elsewhere. This needs two changes:

1. Point the client at the API. `frontend/.env.example` reserves `VITE_API_BASE_URL` for this, but it
   is **not wired up yet** — `src/lib/api.ts` currently hardcodes `/api`. Read the variable there first:

   ```ts
   const api = axios.create({
     baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
     ...
   });
   ```

2. Configure CORS on the API to allow the SPA's origin, in `backend/config/cors.php`.

Option A is simpler and is what the rest of this document assumes.

## Building

### Frontend

```bash
cd frontend
npm ci                 # reproducible install from package-lock.json
npm run build          # type-checks, then builds to dist/
```

`dist/` contains hashed static assets and an `index.html`. It is fully static — serve it from any web
server or CDN. Preview the build locally with `npm run preview`.

### Backend

```bash
cd backend
composer install --no-dev --optimize-autoloader
php artisan key:generate --force        # only on first deploy
php artisan migrate --force             # --force skips the production confirmation
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

The three cache commands matter — they collapse config and route resolution into single files and
make a measurable difference under load.

> Re-run `config:cache` after **any** `.env` change. A cached config ignores the environment file
> entirely, which is a genuinely confusing failure mode the first time it bites.

Do **not** seed production. `db:seed` creates demo accounts with the password `password`.

## Backend environment

The variables that must change from their development defaults:

| Variable | Development | Production |
| --- | --- | --- |
| `APP_ENV` | `local` | `production` |
| `APP_DEBUG` | `true` | **`false`** — debug pages leak configuration and stack traces |
| `APP_KEY` | generated | generated, kept secret, never rotated casually |
| `APP_URL` | `http://localhost` | your real HTTPS URL |
| `FRONTEND_URL` | `http://localhost:5173` | your real SPA URL |
| `LOG_LEVEL` | `debug` | `warning` or `error` |
| `DB_CONNECTION` | `sqlite` | `pgsql` or `mysql` for real traffic |
| `SESSION_DRIVER` | `database` | `database` or `redis` |
| `CACHE_STORE` | `database` | `redis` if available |
| `QUEUE_CONNECTION` | `database` | `redis` if available |

`APP_DEBUG=false` is the single most important line in the file.

`.env` is gitignored and must never be committed. Rotating `APP_KEY` invalidates existing encrypted
values, so treat it as permanent once set.

## Switching to Postgres or MySQL

SQLite is the default because it makes the project clone-and-run. For anything with concurrent
writers, switch — SQLite serializes writes across the whole database.

Nothing in the schema is engine-specific: no raw SQL, no vendor functions, everything through
Eloquent and migrations.

**Postgres**

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=tracky
DB_USERNAME=tracky
DB_PASSWORD=<secret>
```

**MySQL / MariaDB**

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tracky
DB_USERNAME=tracky
DB_PASSWORD=<secret>
```

Then create the empty database and run `php artisan migrate --force`.

**One caveat.** The `enum` columns (`metrics.type`, `widgets.chart_type`, `users.role`) become native
enums on MySQL and check constraints on Postgres. On SQLite they are permissive, so adding a new
metric type or chart type needs a real migration on those engines — worth knowing before extending
the model in production.

## Web server configuration

Laravel's document root is `backend/public`, **not** `backend/`. Pointing it at the project root
exposes `.env`.

### Nginx — SPA and API on one origin

```nginx
server {
    listen 443 ssl http2;
    server_name tracky.example.com;

    # Built SPA
    root /var/www/tracky/frontend/dist;
    index index.html;

    # API → Laravel
    location /api {
        alias /var/www/tracky/backend/public;
        try_files $uri $uri/ @laravel;
    }

    location @laravel {
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME /var/www/tracky/backend/public/index.php;
        include fastcgi_params;
    }

    # SPA client-side routing — every unknown path serves index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Hashed assets are immutable
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

The `try_files ... /index.html` line is what makes a hard refresh on `/metrics/3/history` work
instead of returning 404 — React Router owns that path, not the web server.

### Apache

Laravel ships `backend/public/.htaccess`. For the SPA, add to the frontend's document root:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

### File permissions

```bash
chown -R www-data:www-data backend/storage backend/bootstrap/cache
chmod -R 775 backend/storage backend/bootstrap/cache
```

If using SQLite in production, the database file **and its containing directory** both need to be
writable — SQLite writes a journal file alongside the database.

## Production checklist

**Security**

- [ ] `APP_DEBUG=false` and `APP_ENV=production`
- [ ] `APP_KEY` generated and kept secret
- [ ] HTTPS enforced; HTTP redirects to HTTPS
- [ ] Document root is `backend/public`, and `.env` is not reachable over HTTP
- [ ] Database credentials are not defaults
- [ ] Seeder **not** run — no demo accounts with the password `password`
- [ ] Rate limits reviewed for your traffic shape
- [ ] If the SPA is on another origin, CORS allows only that origin

**Performance**

- [ ] `composer install --no-dev --optimize-autoloader`
- [ ] `config:cache`, `route:cache`, `view:cache` run after the final `.env`
- [ ] Frontend built with `npm run build`
- [ ] Gzip or Brotli enabled
- [ ] Long cache headers on hashed assets, none on `index.html`

**Operations**

- [ ] Database backups scheduled and a restore actually tested
- [ ] Log rotation configured
- [ ] Error monitoring wired up
- [ ] Health check endpoint monitored

## Hosting options

| Setup | Fit |
| --- | --- |
| **Single VPS** — Nginx + PHP-FPM + Postgres | Simplest same-origin deployment; full control; ~$5/month |
| **Laravel Forge / Ploi** + a static host | Managed provisioning and deploys, still your own server |
| **Static host + API host** — Vercel/Netlify for the SPA, Fly.io/Railway/Render for Laravel | Cleanest scaling story; needs Option B (env var + CORS) |
| **Docker Compose** | Not included yet — it is on the roadmap alongside making Postgres the default |

### Deploying updates

```bash
git pull
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
cd ../frontend
npm ci && npm run build
```

For zero-downtime, build into a fresh release directory and atomically swap a symlink — which is
what Forge and Deployer do for you.
