# syntax=docker/dockerfile:1

# ---- SPA build -------------------------------------------------------------
FROM node:22-alpine AS spa
WORKDIR /spa
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Runtime: Laravel API + built SPA on FrankenPHP -------------------------
FROM dunglas/frankenphp:1-php8.4

WORKDIR /app
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN install-php-extensions zip

COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY backend/ ./
RUN composer dump-autoload --optimize --no-dev \
    && php artisan package:discover --ansi

# Same origin for SPA and API: static assets are served straight from public/,
# every other non-API path falls through to Laravel, which returns index.html.
COPY --from=spa /spa/dist/ ./public/

COPY docker/entrypoint.sh /usr/local/bin/tracky-entrypoint
RUN chmod +x /usr/local/bin/tracky-entrypoint

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    DB_CONNECTION=sqlite \
    DB_DATABASE=/data/database.sqlite \
    CACHE_STORE=file \
    SESSION_DRIVER=file \
    QUEUE_CONNECTION=sync \
    SERVER_NAME=:8080

VOLUME /data
EXPOSE 8080

ENTRYPOINT ["tracky-entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]
