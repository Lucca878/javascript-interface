# Backend API

FastAPI service for deception-classifier inference.

## Endpoints

- `GET /health`
- `POST /predict`

## Request and Response Shape

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
  "model_version": "distilbert-v1",
  "request_id": "req-1"
}
```

`GET /health` response example:

```json
{
  "status": "ok",
  "model_version": "my-model-v1",
  "raw_label_for_truthful": 0,
  "real_inference_enabled": true,
  "model_dir": "models/my_model_subdir",
  "device": "cpu",
  "model_load_error": null
}
```

Error response shape example:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Prediction failed: ..."
  },
  "request_id": "req-1"
}
```

## Local Run

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

## Model Loading

Startup tries to load a local checkpoint from `MODEL_DIR`.

Defaults:

- `MODEL_DIR=models/distilBERT_finetuned`
- `INFERENCE_DEVICE=cpu`
- `ENFORCE_REAL_MODEL=0`
- `RAW_LABEL_FOR_TRUTHFUL=0`

Behavior:

- If model files exist and load succeeds: real inference is enabled.
- If model files are missing and `ENFORCE_REAL_MODEL=0`: placeholder inference is used.
- If `ENFORCE_REAL_MODEL=1` and model fails to load: startup fails.

## Cloud Run Deployment

This path remains available as standby/rollback.

## 1) First-time setup (one-time per machine/project)

```bash
gcloud auth login
gcloud config set project <PROJECT_ID>
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Optional, set default region:

```bash
gcloud config set run/region europe-west4
```

## 2) First deploy with explicit settings

From repo root:

```bash
cd backend
gcloud run deploy model-backend \
  --source . \
  --region europe-west4 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 1 \
  --cpu 1 \
  --memory 1Gi \
  --concurrency 1 \
  --timeout 120 \
  --set-env-vars RAW_LABEL_FOR_TRUTHFUL=0,INFERENCE_DEVICE=cpu
```

Current service URL:

- `https://model-backend-302671925464.europe-west4.run.app`

## 3) Redeploy after backend code changes

```bash
cd backend
gcloud run deploy model-backend \
  --source . \
  --region europe-west4 \
  --allow-unauthenticated
```

## 4) Verify Cloud Run output

```bash
curl -sS https://model-backend-302671925464.europe-west4.run.app/health
curl -sS -X POST https://model-backend-302671925464.europe-west4.run.app/predict \
  -H 'Content-Type: application/json' \
  -d '{"text":"The Eiffel Tower is in Paris."}'
```

## 5) Useful Cloud Run ops

```bash
# list revisions
gcloud run revisions list --service model-backend --region europe-west4

# view logs
gcloud run services logs read model-backend --region europe-west4 --limit 200
```

## Hetzner Deployment (Docker)

Before running the container, ensure model artifacts exist on the server.
If missing (normal, because `backend/models/` is gitignored), copy from local machine:

```bash
MODEL_SUBDIR=modernbert_trained   # example; change as needed

rsync -avh --progress \
  <LOCAL_REPO_PATH>/backend/models/${MODEL_SUBDIR}/ \
  root@157.90.127.76:/var/www/study/backend/models/${MODEL_SUBDIR}/
```

## 1) First deploy (or after fresh server setup)

```bash
ssh root@157.90.127.76
cd /var/www/study/backend
MODEL_SUBDIR=modernbert_trained   # example; change as needed
MODEL_VERSION_TAG=modernbert-v1   # example; change as needed
docker build -t model-backend:hetzner .
docker rm -f model-backend 2>/dev/null || true
docker run -d \
  --name model-backend \
  --restart unless-stopped \
  -e PORT=8000 \
  -e MODEL_DIR=models/${MODEL_SUBDIR} \
  -e MODEL_VERSION=${MODEL_VERSION_TAG} \
  -e RAW_LABEL_FOR_TRUTHFUL=0 \
  -p 127.0.0.1:8000:8000 \
  model-backend:hetzner
```

## 2) Verify container output

```bash
docker ps --filter name=model-backend
docker logs --tail=120 model-backend
curl -sS http://127.0.0.1:8000/health
curl -sS -X POST http://127.0.0.1:8000/predict \
  -H 'Content-Type: application/json' \
  -d '{"text":"The Eiffel Tower is in Paris."}'
```

Expected health keys:

- `"status": "ok"`
- `"real_inference_enabled": true`
- `"model_load_error": null`

## 3) Public API on Hetzner

Nginx proxies `https://api.lpstudies.net` to `127.0.0.1:8000`.

Useful checks:

```bash
curl -sS https://api.lpstudies.net/health
curl -sS -X POST https://api.lpstudies.net/predict \
  -H 'Content-Type: application/json' \
  -d '{"text":"The Eiffel Tower is in Paris."}'
```

## 4) Redeploy on Hetzner after backend changes

```bash
ssh root@157.90.127.76
cd /var/www/study/backend
MODEL_SUBDIR=modernbert_trained   # example; change as needed
MODEL_VERSION_TAG=modernbert-v1   # example; change as needed
docker build -t model-backend:hetzner .
docker rm -f model-backend
docker run -d --name model-backend --restart unless-stopped -e PORT=8000 -e MODEL_DIR=models/${MODEL_SUBDIR} -e MODEL_VERSION=${MODEL_VERSION_TAG} -e RAW_LABEL_FOR_TRUTHFUL=0 -p 127.0.0.1:8000:8000 model-backend:hetzner
```

## Common Operations

```bash
# Restart backend container
docker restart model-backend

# Follow logs
docker logs -f model-backend

# Check status
docker ps --filter name=model-backend
```

## Notes

- Keep model artifacts out of git (`backend/models/` is ignored).
- If you transfer model files temporarily as archives, `backend/*.tar.gz` and `backend/*.tgz` are ignored by repo `.gitignore`.
