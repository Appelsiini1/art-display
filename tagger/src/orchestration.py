from __future__ import annotations

import logging
from pathlib import Path

from .config import TaggerSettings
from .db import ensure_image_record, initialize_database, record_approved_tags, record_model_run, record_model_scores
from .models import get_model_runners
from .transform import prepare_approved_tags

LOGGER = logging.getLogger(__name__)
SUPPORTED_IMAGE_EXTENSIONS = {".bmp", ".gif", ".jpeg", ".jpg", ".png", ".tif", ".tiff", ".webp"}


class TaggerOrchestrator:
    def __init__(self, settings: TaggerSettings) -> None:
        self.settings = settings
        self.model_runners = get_model_runners()

    def process_directory(self, root: str | Path | None = None, limit: int | None = None) -> list[str]:
        target_root = Path(root or self.settings.image_root)
        logging.debug("Processing directory: %s", target_root)

        if not target_root.exists():
            raise FileNotFoundError(f"Tagger image root does not exist: {target_root}")

        if self.settings.execution_mode != "serial":
            raise NotImplementedError(
                "Parallel execution is intentionally disabled in the foundation release. "
                "The default serial mode is selected to keep CPU and GPU load within the system budget."
            )

        if limit is not None and limit < 0:
            raise ValueError("Limit must be zero or a positive integer.")

        initialized = []
        image_files = self._iter_image_files(target_root)
        if limit is not None:
            image_files = iter(list(image_files)[:limit])

        for image_path in image_files:
            initialized.append(self.process_image(image_path))
        return initialized

    def process_image(self, image_path: str) -> str:
        logging.debug("Processing image: %s", image_path)
        image_id = ensure_image_record(image_path, database_url=self.settings.database_url)
        combined_outputs = []
        for runner in self.model_runners:
            prediction = runner.run(image_path)
            run_id = record_model_run(
                image_id=image_id,
                model_name=prediction.model_name,
                model_version=prediction.model_version,
                execution_mode=self.settings.execution_mode,
                database_url=self.settings.database_url,
            )
            record_model_scores(run_id, prediction.scores, database_url=self.settings.database_url)
            combined_outputs.append(prediction)

        decisions = prepare_approved_tags(combined_outputs)
        filtered_decisions = [
            (tag_name, score)
            for tag_name, score in decisions
            if float(score) >= float(self.settings.min_confidence)
        ]

        if filtered_decisions:
            record_approved_tags(image_id, filtered_decisions, database_url=self.settings.database_url)
        LOGGER.info("Processed '%s' -> %s", image_path, filtered_decisions)
        return image_id

    @staticmethod
    def _iter_image_files(root: Path):
        for file_path in sorted(root.rglob("*")):
            if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS:
                logging.debug("Found image file: %s", file_path)
                yield str(file_path)


def bootstrap_tagger(settings: TaggerSettings) -> TaggerOrchestrator:
    initialize_database(settings.database_url)
    return TaggerOrchestrator(settings)
