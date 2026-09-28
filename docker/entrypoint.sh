#!/bin/sh
set -e

# SQLite database and a generated app key both live on the /data volume, so they survive restarts.
mkdir -p "$(dirname "$DB_DATABASE")"
fresh=false
if [ ! -f "$DB_DATABASE" ]; then
    touch "$DB_DATABASE"
    fresh=true
fi

if [ -z "$APP_KEY" ]; then
    [ -f /data/app_key ] || php artisan key:generate --show --no-ansi > /data/app_key
    APP_KEY="$(cat /data/app_key)"
    export APP_KEY
fi

php artisan migrate --force

if [ "$fresh" = true ] && [ "$SEED_DEMO" = true ]; then
    php artisan db:seed --force
fi

php artisan optimize

exec "$@"
