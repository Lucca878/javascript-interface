# Adversarial Attacks on Fine-Tuned ModernBERT Deception Classifier - Web-Based Interface

This repository contains the web-based experimental interface for the human adversarial paraphrasing attacks reported in:

> Pfründer, L., Loconte, R., Verschuere, B. & Kleinberg, B. Adversarial Attacks Reveal Divergent Deception Competence in Humans and Generative Language Models. Preprint at <https://doi.org/10.48550/ARXIV.2610.13363> (2026).


## Overview

Participants perform adversarial paraphrasing attacks on an automated deception classifier.

The flow of the web-based interface is:

1. Welcome
2. Informed consent
3. Instructions
4. Attention check (2 multiple-choice questions)
5. Task reminder
6. Task (rewrite statements with live classifier feedback)
7. Feedback (motivation, attention check, difficulty, strategies, open comments)
8. End / submission

The app is a static single-page application (vanilla JavaScript, no framework) with two PHP endpoints for statement corpus and data storage, and a Python (FastAPI) backend that serves the fine-tuned deception classifier. Session timing and interaction data are recorded and stored server-side (PostgreSQL, with optional Google Cloud Storage fallback).

## Repository structure

- [index.html](index.html) — app shell and runtime configuration
- [style.css](style.css) — UI styles
- [src/](src/) — frontend logic
  - [src/app.js](src/app.js) — main flow and screen routing
  - [src/pages/](src/pages/) — one module per interface page 
  - [src/services/modelService.js](src/services/modelService.js) — classifier endpoint selection and prediction calls
  - [src/sessionTracking.js](src/sessionTracking.js) — session payload and submission
- [api/](api/) — PHP endpoints
  - [api/statements.php](api/statements.php) — serves corpus statements
  - [api/participantData.php](api/participantData.php) — stores participant session records
  - [api/sql/postgres_schema.sql](api/sql/postgres_schema.sql) — database schema
  - [api/sql/results_csv_view.sql](api/sql/results_csv_view.sql) — flat export view
- [backend/](backend/) — FastAPI model inference (see [backend/README.md](backend/README.md))
- [data/statements.csv](data/statements.csv) — the statement corpus served to participants
- [data/hippocorpus_test_truncated_80_100.csv](data/hippocorpus_test_truncated_80_100.csv) — Hippocorpus reduced statement pool with reference model predictions
- [spec/](spec/) — Jasmine test suite, with two runners:
  - [karma.conf.js](karma.conf.js) — headless test runner (Karma + Jasmine, used by `npm test`)
  - [specRunner.html](specRunner.html) — browser-based test runner (open at `/specRunner.html` when the PHP server is running; requires `npm install` for `jasmine-core` assets)
- [package.json](package.json) / [package-lock.json](package-lock.json) — Node dev dependencies and test scripts
- [composer.json](composer.json) — PHP dependency manifest (`google/cloud-storage`, needed only for the optional GCS storage fallback; install with `composer install --no-dev`)

## Running locally

Requires PHP (>= 8) and, optionally, Python 3 for the model backend.

### 1. Frontend + PHP API

From the repository root:

```bash
php -S localhost:8000
```

Open in a browser:

```text
http://localhost:8000?PROLIFIC_PID=test123
```

The `PROLIFIC_PID` query parameter sets the participant ID (the study ran on Prolific); any value works for testing.

### 2. Model backend (optional)

The backend is only needed if you want live classifier feedback during the task. From `backend/`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

See [backend/README.md](backend/README.md) for endpoints and model configuration. Model weights are not included in this repository; they are published separately on Zenodo ([https://doi.org/10.5281/zenodo.23196791]) — download and install them yourself as described in [backend/README.md](backend/README.md). Without weights the backend can still run in placeholder-inference mode.

### 3. Tests

```bash
npm install
npm test          # headless, single run (Karma + Jasmine)
npm run test:watch
```

## Configuration

Runtime configuration lives in `window.APP_CONFIG` in [index.html](index.html):

- `corpusPhpEndpoint` — endpoint serving corpus statements
- `participantDataEndpoint` — endpoint storing session records
- `modelApiBackends` / `activeModelBackend` — one or more classifier backends; the active one is selected by name

On `localhost` the config defaults to the local PHP endpoints, so the app works out of the box with the commands above. For your own deployment, point these values at your own server.

## Hosting your own instance

The app is intentionally simple to host — no build step, no framework. In broad strokes:

1. **Frontend + PHP API** — serve the repository root with any web server that supports PHP >= 8 (e.g. Nginx or Apache with PHP-FPM). Set the document root to the repository root with [index.html](index.html) as the index, and route `api/*.php` requests to PHP. The `vendor/` directory from `composer install --no-dev` is only needed if you use the Google Cloud Storage fallback for data storage.
2. **Data storage** — [api/participantData.php](api/participantData.php) writes session records to PostgreSQL by default (apply [api/sql/postgres_schema.sql](api/sql/postgres_schema.sql) once). Configure via environment variables (`STORAGE_BACKEND`, `POSTGRES_*`); a GCS fallback can be enabled with `STORAGE_FALLBACK_BACKEND=gcs`. The schema and export view include a `study_run_id` column so separate collection runs can be tagged and filtered.
3. **Model backend** — deploy [backend/](backend/) separately (e.g. with the provided Dockerfile) and point `modelApiBackends` / `activeModelBackend` in [index.html](index.html) at your deployment. The frontend only needs a reachable `/predict` endpoint.

All endpoint URLs are runtime config in `window.APP_CONFIG`, so the same codebase works across environments without rebuilding.

## Data and privacy

No participant data are included in this repository. Session records and exports (`data/sessions/`, `data/exports/`) are excluded from version control.

The statement corpus ([data/statements.csv]) is completely made up and ([data/hippocorpus_test_truncated_80_100.csv]) is derived from the **Hippocorpus** dataset. If you reuse it, please credit the original authors:

> Sap, M., Horvitz, E., Choi, Y., Smith, N. A. & Pennebaker, J. Recollection versus Imagination: Exploring Human Memory and Cognition via Neural Language Models. in Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics 1970–1978 (Association for Computational Linguistics, Online, 2020). doi:10.18653/v1/2020.acl-main.178.

```bibtex
@inproceedings{sap-etal-2020-recollection,
  title     = {Recollection versus Imagination: Exploring Human Memory and Cognition via Neural Language Models},
  author    = {Sap, Maarten and Horvitz, Eric and Choi, Yejin and Smith, Noah A. and Pennebaker, James},
  booktitle = {Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics},
  pages     = {1970--1978},
  publisher = {Association for Computational Linguistics},
  year      = {2020},
  doi       = {10.18653/v1/2020.acl-main.178}
}
```

## Citation

If you use this interface or build on it, please cite:

```bibtex
@article{pfrunder2026adversarial,
  title   = {Adversarial Attacks Reveal Divergent Deception Competence in Humans and Generative Language Models},
  author  = {Pfr{\"u}nder, L. and Loconte, R. and Verschuere, B. and Kleinberg, B.},
  journal = {arXiv preprint arXiv:2610.13363},
  year    = {2026},
  doi     = {10.48550/ARXIV.2610.13363}
}
```

## License

This work is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) — see [LICENSE](LICENSE). You are free to share and adapt the material for any purpose, provided you give appropriate credit (see citation above).
