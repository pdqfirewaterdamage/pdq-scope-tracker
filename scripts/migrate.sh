#!/bin/bash
# Run all pending migrations against the linked Supabase project
# Uses the Management API (no database password needed, just SUPABASE_ACCESS_TOKEN)

set -e

# Load env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

MIGRATIONS_DIR="supabase/migrations"
TRACKING_FILE="supabase/.applied_migrations"

# Create tracking file if it doesn't exist
touch "$TRACKING_FILE"

echo "Checking for pending migrations..."

applied=0
for migration in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
  basename=$(basename "$migration")

  # Skip if already applied
  if grep -qF "$basename" "$TRACKING_FILE" 2>/dev/null; then
    echo "  [skip] $basename (already applied)"
    continue
  fi

  echo "  [run]  $basename"
  sql=$(cat "$migration")

  npx supabase db query --linked -f "$migration" > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    echo "$basename" >> "$TRACKING_FILE"
    echo "         Applied successfully."
    applied=$((applied + 1))
  else
    echo "         FAILED! Stopping."
    exit 1
  fi
done

if [ $applied -eq 0 ]; then
  echo "No pending migrations."
else
  echo "Applied $applied migration(s)."
fi
