from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ModelPrediction:
    model_name: str
    model_version: str
    scores: tuple[tuple[str, float], ...]


class BaseModelRunner:
    def __init__(self, name: str, version: str = "reference") -> None:
        self.name = name
        self.version = version

    def run(self, image_path: str) -> ModelPrediction:
        raise NotImplementedError("Model runners must implement run().")


class Eva02Runner(BaseModelRunner):
    def __init__(self) -> None:
        super().__init__("eva-02", "reference")

    def run(self, image_path: str) -> ModelPrediction:
        return ModelPrediction(
            model_name=self.name,
            model_version=self.version,
            scores=(
                ("portrait", 0.82),
                ("illustration", 0.76),
                ("anime", 0.69),
                ("fantasy", 0.62),
            ),
        )


class JoyTagRunner(BaseModelRunner):
    def __init__(self) -> None:
        super().__init__("joytag", "reference")

    def run(self, image_path: str) -> ModelPrediction:
        return ModelPrediction(
            model_name=self.name,
            model_version=self.version,
            scores=(
                ("portrait", 0.76),
                ("photo", 0.74),
                ("nature", 0.67),
                ("landscape", 0.58),
            ),
        )


def get_model_runners() -> tuple[BaseModelRunner, ...]:
    return (Eva02Runner(), JoyTagRunner())
