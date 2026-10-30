#!/usr/bin/env python3

from __future__ import annotations

import argparse
import logging

from src.config import load_settings
from src.orchestration import bootstrap_tagger

LOGGER = logging.getLogger("tagger")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the tagger foundation service against a directory of images.")
    parser.add_argument("--root", default=None, help="Directory to scan for image files.")
    parser.add_argument("--database-url", default=None, help="Postgres connection string. Defaults to DATABASE_URL.")
    parser.add_argument(
        "--execution-mode",
        choices=("serial", "parallel"),
        default=None,
        help="Runtime policy; serial is the default and the only supported mode in the foundation release.",
    )
    parser.add_argument("--min-confidence", type=float, default=None, help="Minimum confidence value for approved tag decisions.")
    parser.add_argument("--limit", type=int, default=None, help="Maximum number of images to process in a single run. Defaults to no limit.")
    return parser


def main() -> int:
    args = build_parser().parse_args()

    settings = load_settings(
        image_root=args.root,
        database_url=args.database_url,
        execution_mode=args.execution_mode,
    )
    logging.basicConfig(level=getattr(logging, settings.log_level), format="%(asctime)s %(levelname)s %(message)s")
    if args.min_confidence is not None:
        settings = settings.__class__(
            database_url=settings.database_url,
            image_root=settings.image_root,
            execution_mode=settings.execution_mode,
            model_names=settings.model_names,
            min_confidence=args.min_confidence,
            log_level=settings.log_level,
        )

    if args.limit is not None and args.limit < 0:
        raise ValueError("--limit must be zero or a positive integer.")

    LOGGER.info("Starting tagger foundation in %s mode against %s", settings.execution_mode, settings.image_root)
    orchestrator = bootstrap_tagger(settings)
    processed_images = orchestrator.process_directory(settings.image_root, limit=args.limit)
    LOGGER.info("Processed %s images", len(processed_images))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
