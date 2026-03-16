# Backend API

## Run locally

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

## Endpoints

- `GET /health`
- `POST /predict`

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
## Activate venv
cd /Users/luccapfrunder/Desktop/javascript-interface/backend
source .venv/bin/activate

### Deactivate 

deactivate