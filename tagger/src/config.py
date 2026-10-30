import os
from dataclasses import dataclass
from typing import Literal

ExecutionMode = Literal["serial", "parallel"]


@dataclass(frozen=True)
class TaggerSettings:
    database_url: str
    image_root: str
    execution_mode: ExecutionMode = "serial"
    model_names: tuple[str, ...] = ("eva-02", "joytag")
    min_confidence: float = 0.5
    log_level: str = "INFO"

    @classmethod
    def from_env(cls, *, image_root: str | None = None, database_url: str | None = None, execution_mode: str | None = None) -> "TaggerSettings":
        return cls(
            database_url=database_url or os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/artdisplay"),
            image_root=image_root or os.getenv("TAGGER_IMAGE_ROOT", "/images"),
            execution_mode=(execution_mode or os.getenv("TAGGER_EXECUTION_MODE", "serial") or "serial"), # type: ignore
            model_names=tuple((os.getenv("TAGGER_MODELS", "eva-02,joytag") or "eva-02,joytag").split(",")),
            min_confidence=float(os.getenv("TAGGER_MIN_CONFIDENCE", "0.5") or 0.5),
            log_level=os.getenv("LOG_LEVEL", "INFO") or "INFO",
        )


def load_settings(*, image_root: str | None = None, database_url: str | None = None, execution_mode: str | None = None) -> TaggerSettings:
    return TaggerSettings.from_env(image_root=image_root, database_url=database_url, execution_mode=execution_mode)
