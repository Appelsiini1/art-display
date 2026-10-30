from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Any, Iterable

try:
    import psycopg
except ImportError:  # pragma: no cover - import is validated in runtime environment.
    psycopg = None


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS tagger_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL UNIQUE,
    fingerprint TEXT,
    width INTEGER,
    height INTEGER,
    file_hash TEXT,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tagger_tag_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_name TEXT NOT NULL UNIQUE,
    normalized_name TEXT NOT NULL UNIQUE,
    parent_group TEXT,
    alias_of TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tagger_model_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES tagger_images(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    model_version TEXT,
    execution_mode TEXT NOT NULL,
    run_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tagger_model_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES tagger_model_runs(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    canonical_tag TEXT NOT NULL,
    raw_score DOUBLE PRECISION NOT NULL,
    rank_position INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tagger_approved_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES tagger_images(id) ON DELETE CASCADE,
    canonical_tag TEXT NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    source_models TEXT[] NOT NULL DEFAULT '{}',
    approved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tagger_model_runs_image_id ON tagger_model_runs (image_id);
CREATE INDEX IF NOT EXISTS idx_tagger_model_scores_run_id ON tagger_model_scores (run_id);
CREATE INDEX IF NOT EXISTS idx_tagger_model_scores_canonical_tag ON tagger_model_scores (canonical_tag);
CREATE INDEX IF NOT EXISTS idx_tagger_approved_tags_image_id ON tagger_approved_tags (image_id);
"""


def build_database_url(database_url: str | None = None) -> str:
    return database_url or os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/artdisplay")


@contextmanager
def db_connection(database_url: str | None = None):
    if psycopg is None:
        raise RuntimeError("psycopg is required for the tagger database layer. Install the project dependencies before running the service.")
    conn = psycopg.connect(build_database_url(database_url))
    try:
        yield conn
    finally:
        conn.close()


def initialize_database(database_url: str | None = None) -> None:
    with db_connection(database_url) as conn:
        conn.execute(SCHEMA_SQL)
        conn.commit()


def ensure_image_record(image_path: str, *, database_url: str | None = None) -> str:
    with db_connection(database_url) as conn:
        row = conn.execute("SELECT id FROM tagger_images WHERE path = %s", (image_path,)).fetchone()
        if row is not None:
            return str(row[0])

        result = conn.execute(
            "INSERT INTO tagger_images (path) VALUES (%s) RETURNING id",
            (image_path,),
        ).fetchone()
        conn.commit()
        return str(result[0])


def record_model_run(image_id: str, model_name: str, model_version: str, execution_mode: str, *, database_url: str | None = None) -> str:
    with db_connection(database_url) as conn:
        result = conn.execute(
            "INSERT INTO tagger_model_runs (image_id, model_name, model_version, execution_mode) VALUES (%s, %s, %s, %s) RETURNING id",
            (image_id, model_name, model_version, execution_mode),
        ).fetchone()
        conn.commit()
        return str(result[0])


def record_model_scores(run_id: str, scores: Iterable[tuple[str, float]], *, database_url: str | None = None) -> None:
    payload = list(scores)
    with db_connection(database_url) as conn:
        for rank_position, (tag_name, raw_score) in enumerate(payload, start=1):
            conn.execute(
                "INSERT INTO tagger_model_scores (run_id, tag_name, canonical_tag, raw_score, rank_position) VALUES (%s, %s, %s, %s, %s)",
                (run_id, tag_name, tag_name, float(raw_score), rank_position),
            )
        conn.commit()


def record_approved_tags(image_id: str, approved_tags: Iterable[tuple[str, float]], *, database_url: str | None = None) -> None:
    with db_connection(database_url) as conn:
        for canonical_tag, confidence in approved_tags:
            conn.execute(
                "INSERT INTO tagger_approved_tags (image_id, canonical_tag, confidence, source_models) VALUES (%s, %s, %s, %s)",
                (image_id, canonical_tag, float(confidence), ["eva-02", "joytag"]),
            )
        conn.commit()
