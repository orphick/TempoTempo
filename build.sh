#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
# Seeding an internet-facing admin is opt-in and requires DEMO_ADMIN_PASSWORD.
if [ "${SEED_DEMO:-false}" = "true" ]; then
  python manage.py seed_demo
fi
