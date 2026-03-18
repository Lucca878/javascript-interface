# Backend API

FastAPI service for deception-classifier inference.

## Run locally

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8080 # starting server
```

Local API URL:

```text
http://127.0.0.1:8080
```

## Endpoints

- `GET /health`
- `POST /predict`

Quick check:

```bash
curl http://127.0.0.1:8080/health
curl -X POST http://127.0.0.1:8080/predict \
  -H 'Content-Type: application/json' \
  -d '{"text":"The Eiffel Tower is in Paris."}'
```

## Cloud Run deployment

Current deployed service:

```text
https://model-backend-302671925464.europe-west4.run.app
```

Health endpoint:

```text
https://model-backend-302671925464.europe-west4.run.app/health
```

Predict endpoint:

```text
https://model-backend-302671925464.europe-west4.run.app/predict
```

Typical deploy command used for this project:

```bash
gcloud run deploy model-backend \
  --source ./backend \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 1 \
  --cpu 1 \
  --memory 1Gi \
  --concurrency 1 \
  --timeout 120
```

Current defaults were configured for low-cost testing:

- region: `europe-west4`
- scales to zero when idle
- single-instance cap

## Real model loading

At startup, the API tries to load DistilBERT from `DISTILBERT_MODEL_DIR`.

- Default: `models/distilBERT_finetuned`
- If model files are missing, API uses placeholder inference for development.
- Set `ENFORCE_REAL_MODEL=1` to fail startup when model loading fails.

Example:

```bash
DISTILBERT_MODEL_DIR=/absolute/path/to/models/distilBERT_finetuned \
INFERENCE_DEVICE=cpu \
ENFORCE_REAL_MODEL=1 \
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

`GET /health` reports whether real inference is active.

For the deployed Cloud Run service, a healthy response should show:

- `status: ok`
- `real_inference_enabled: true`
- `model_load_error: null`

## Label normalization rule

The API always returns study labels:

- `0 = deceptive`
- `1 = truthful`

If the raw model uses a different orientation, map it in `normalize_raw_label()`.
For your current DistilBERT checkpoint, `RAW_LABEL_FOR_TRUTHFUL=0` means raw label `0`
is mapped to study label `1` (truthful).

## Request example

```json
{
  "text": "I took the train to Rotterdam.",
  "participant_id": "abc123",
  "statement_index": "4054",
  "request_id": "req-1"
}
```

## Response example

```json
{
  "label": 1,
  "labelStr": "truthful",
  "confidence": 81.25,
  "model_version": "distilbert-v1",
  "request_id": "req-1"
}
```

## Environment notes

- CORS currently allows localhost development origins on ports `8000` and `5500`
- CORS also allows the deployed Cloud Run origin
- The service runs on CPU (`INFERENCE_DEVICE=cpu`) in production

## Activate venv

```bash
cd /Users/luccapfrunder/Desktop/javascript-interface/backend
source .venv/bin/activate
```

Deactivate with:

```bash
deactivate
```