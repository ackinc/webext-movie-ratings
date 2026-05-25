#!/usr/bin/env bash

set -eu

set -a
source "${ENVFILE:-.env}"
set +a

# function definitions

assert_env() {
  local var_name="$1"
  if [[ -z "${!var_name:-}" ]]; then
    log "Error: env var $var_name is not set" >&2
    exit 1
  fi
}

log() {
    echo `date -Iseconds` "$1"
}

restore_table() {
    local from_db="$1"
    local to_db="$2"
    local table_name="$3"

    # convert to file containing sql statements
    sqlite3 "$from_db" ".dump $table_name" |
        # replace table name into which data will be inserted so it doesn't
        #   clash with data already in dest DB
        sed "s/CREATE TABLE IF NOT EXISTS \"$table_name\"/DROP TABLE IF EXISTS \"prod_$table_name\";\nCREATE TABLE IF NOT EXISTS \"prod_$table_name\"/g" |
        sed "s/INSERT INTO $table_name/INSERT INTO prod_$table_name/g" |
        sqlite3 "$to_db"
    
    log "Restored $table_name into prod_$table_name"
}

# start

assert_env DB_BACKUP_URI
assert_env DB_PATH

DB_BACKUP_PATH="$(dirname $DB_PATH)"/db-prod-bak.sqlite
DB_BACKUP_DATE=$( stat -c %y $DB_BACKUP_PATH | cut -d" " -f1 )
RUN_CHECKS=$([[ " $@ " == *" --skip-checks "* ]] && echo 0 || echo 1)
TABLES_TO_RESTORE=("titles" "messages")
TODAY=$( date --iso-8601 )

if [[ $DB_BACKUP_DATE < $TODAY ]]; then
    aws s3 cp "$DB_BACKUP_URI" "$DB_BACKUP_PATH"
elif [[ $RUN_CHECKS -eq 1 ]]; then
    log "This script already ran today. Exiting early ..."
    exit 0
fi;

for table_name in "${TABLES_TO_RESTORE[@]}"; do
    restore_table "$DB_BACKUP_PATH" "$DB_PATH" "$table_name"
done
