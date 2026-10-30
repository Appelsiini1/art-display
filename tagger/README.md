# Tagger

This service is the foundation for a production tagger that runs locally against a shared Postgres database. The proof-of-concept under `tagger/POC` remains a reference implementation for model experimentation, while the service under `tagger/src` contains the reusable database layer, orchestration flow, model interfaces, and transformation rules that the production stack is built around.

## Service architecture

The foundation intentionally separates responsibilities into a few small, explicit layers:

- `src/config.py` stores runtime settings and defaults.
- `src/db.py` owns the tagger database contract and creates the service-owned schema.
- `src/models.py` defines the model interface and the EVA-02/JoyTag runner stubs.
- `src/transform.py` contains the canonical tag normalization and aggregation logic.
- `src/orchestration.py` coordinates processing for each image and records raw model evidence plus approved results.
- `tagger.py` is the entrypoint for running the tagger service from the command line or Docker.

## Database ownership boundary

The tagger owns its own database tables. The schema lives in the service code and defines only the tables needed for:

- image identity and mutable file metadata
- model-run provenance and execution-mode metadata
- raw model score evidence
- canonical tag catalog metadata and aliases
- approved final tag decisions

This keeps the server focused on API-facing tables while the tagger remains responsible for the data it creates.

## Runtime execution policy

The foundation defaults to serial execution. The `TAGGER_EXECUTION_MODE` setting accepts `serial` and `parallel`, but the foundation intentionally raises an explicit error if parallel mode is selected until a later implementation adds concurrency controls and power safeguards.

## Running the service

Example:

```bash
docker compose up tagger -d --build
```

The repository default compose setup is intentionally CPU-safe and does not attach AMD ROCm GPU devices. This keeps the tagger working on hosts without `/dev/kfd`, including NVIDIA-only systems.

Use the default stack for normal local development:

```bash
docker compose up --build
```

If the host is AMD/ROCm-capable and you want the tagger to access the GPU devices directly, add the ROCm override file:

```bash
docker compose -f docker-compose.yml -f docker-compose.rocm.yml up --build
```

The ROCm override is the only place where `/dev/kfd` and `/dev/dri` are added. Without that override, the tagger stays compatible with non-ROCm hardware.

Environment variables used by the service:

- `DATABASE_URL`
- `TAGGER_IMAGE_ROOT`
- `TAGGER_EXECUTION_MODE`
- `TAGGER_MODELS`
- `TAGGER_MIN_CONFIDENCE`

## Model provenance

Raw model score rows are retained separately from the approved final tag rows so the final decisions can be explained, reweighted, or revisited without re-running the model. This keeps model evidence available for later tuning and debugging.

## Future work

The foundation establishes the structure and schema contract. The next layer of work will replace the starter model stubs with actual EVA-02 and JoyTag inference code, add a richer canonical tag catalog, and refine the tag-grouping rules once the runtime model and quality checks are validated.