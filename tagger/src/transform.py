import re
from collections import defaultdict
from typing import Iterable

from .models import ModelPrediction

_ALIAS_MAP = {
    "selfie": "portrait",
    "person": "portrait",
    "portraiture": "portrait",
    "drawing": "illustration",
    "illustration": "illustration",
    "concept-art": "illustration",
    "anime": "illustration",
    "photo": "photo",
    "landscape": "landscape",
    "nature": "landscape",
}


def canonicalize_tag(tag_name: str) -> str:
    raw = (tag_name or "unknown").strip().lower()
    normalized = re.sub(r"[^a-z0-9]+", "-", raw).strip("-")
    if not normalized:
        return "unknown"
    return _ALIAS_MAP.get(normalized, normalized)


def merge_scores(model_outputs: Iterable[ModelPrediction]) -> list[tuple[str, float]]:
    grouped: dict[str, float] = defaultdict(float)
    for result in model_outputs:
        for tag_name, score in result.scores:
            canonical = canonicalize_tag(tag_name)
            grouped[canonical] += float(score)
    return sorted(grouped.items(), key=lambda item: item[1], reverse=True)


def prepare_approved_tags(model_outputs: Iterable[ModelPrediction]) -> list[tuple[str, float]]:
    merged = merge_scores(model_outputs)
    return [(tag_name, score) for tag_name, score in merged if score > 0.0]
