# Backend: Model Inference API

FastAPI service that serves the deception classifier used for live feedback during the adversarial paraphrasing attack.

## Endpoints

- `GET /health`
- `POST /predict`

`POST /predict` request example:

```json
{
  "text": "I took the train to Rotterdam.",
  "participant_id": "abc123",
  "statement_index": "4054",
  "request_id": "req-1"
}
```

Successful response example:

```json
{
  "label": 1,
  "labelStr": "truthful",
  "confidence": 81.25,
  "model_version": "modernbert-v1",
  "request_id": "req-1"
}
```

`GET /health` response example:

```json
{
  "status": "ok",
  "model_version": "modernbert-v1",
  "raw_label_for_truthful": 0,
  "real_inference_enabled": true,
  "model_dir": "models/modernbert_trained",
  "device": "cpu",
  "model_load_error": null
}
```

## Local run

From `backend/`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

Verify:

```bash
curl -sS http://127.0.0.1:8080/health
curl -sS -X POST http://127.0.0.1:8080/predict \
  -H 'Content-Type: application/json' \
  -d '{"text":"The Eiffel Tower is in Paris."}'
```

## Model loading

The fine-tuned deception classifiers used in the study are published on Zenodo:

> **https://doi.org/10.5281/zenodo.23196791**

Model weights are not included in this repository — download them yourself:

1. Download the model files from the Zenodo record.
2. Extract/place the checkpoint directory under `backend/models/` (e.g. `backend/models/modernbert_trained/`), so that it contains `config.json`, tokenizer files, and model weights.
3. Point the service at it via `MODEL_DIR` (and optionally `MODEL_VERSION`) when starting:

```bash
MODEL_DIR=models/modernbert_trained MODEL_VERSION=modernbert-v1 uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

At startup the service loads a local Hugging Face checkpoint from `MODEL_DIR`.

Configuration (environment variables):

- `MODEL_DIR` — path to the model directory (default: `models/distilBERT_finetuned`)
- `MODEL_VERSION` — version string returned in responses
- `INFERENCE_DEVICE` — e.g. `cpu` (default) or `cuda`
- `ENFORCE_REAL_MODEL` — if `1`, startup fails when the model cannot be loaded; if `0` (default), the service falls back to placeholder inference
- `RAW_LABEL_FOR_TRUTHFUL` — raw model label that maps to "truthful" (default: `0`)

Place a compatible checkpoint (e.g. a fine-tuned DistilBERT/ModernBERT classifier) under `backend/models/<subdir>/` and set `MODEL_DIR` accordingly, or run in placeholder-inference mode (the default) without any weights.

## Docker

A [Dockerfile](Dockerfile) is provided:

```bash
cd backend
docker build -t model-backend .
docker run -d --name model-backend \
  -e PORT=8000 \
  -e MODEL_DIR=models/<your_model_subdir> \
  -p 127.0.0.1:8000:8000 \
  model-backend
```

Note that model artifacts (`backend/models/`) are excluded here and must be added separately.
