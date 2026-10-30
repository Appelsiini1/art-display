#!/usr/bin/env python3

from __future__ import annotations

import argparse
import os

try:
    import psycopg
except ImportError as exc:  # pragma: no cover - dependency is installed in the service runtime.
    raise SystemExit("psycopg is required. Install the tagger requirements before running this script.") from exc

TABLES = [
    "tagger_approved_tags",
    "tagger_model_scores",
    "tagger_model_runs",
    "tagger_images",
    "tagger_tag_catalog",
]


def build_database_url(database_url: str | None = None) -> str:
    return database_url or os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/artdisplay")


def count_rows(conn, table_name: str) -> int:
    row = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()
    return int(row[0]) if row else 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Clear the tagger-owned database tables without purging the rest of the shared Postgres database.")
    parser.add_argument("--database-url", default=None, help="Postgres connection string. Defaults to DATABASE_URL.")
    parser.add_argument("--yes", action="store_true", help="Skip the confirmation prompt and execute immediately.")
    args = parser.parse_args()

    database_url = build_database_url(args.database_url)
    print(f"Target database: {database_url}")
    print("Tables to clear:")
    for table_name in TABLES:
        print(f"  - {table_name}")

    if not args.yes:
        answer = input("Proceed with clearing these tagger tables? [y/N]: ").strip().lower()
        if answer not in {"y", "yes"}:
            print("Cancelled.")
            return 0

    with psycopg.connect(database_url) as conn:
        counts_before = {table_name: count_rows(conn, table_name) for table_name in TABLES}
        print("Rows before truncate:")
        for table_name, row_count in counts_before.items():
            print(f"  - {table_name}: {row_count}")

        conn.execute(f"TRUNCATE TABLE {', '.join(TABLES)} RESTART IDENTITY CASCADE;")
        conn.commit()

        counts_after = {table_name: count_rows(conn, table_name) for table_name in TABLES}
        print("Rows after truncate:")
        for table_name, row_count in counts_after.items():
            print(f"  - {table_name}: {row_count}")

    print("Tagger tables cleared.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
