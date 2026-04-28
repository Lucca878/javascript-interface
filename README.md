# Deception Paraphrasing Interface

Frontend interface for a human paraphrasing task in a study on attacks against automated deception classifiers.

## Quick Start (Most Used Commands)

Local app run:

```bash
# terminal 1 (repo root)
php -S localhost:8000

# terminal 2 (backend/)
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

Frontend deploy to Hetzner:

```bash
ssh root@157.90.127.76
cd /var/www/study
git pull
composer install --no-dev
systemctl reload nginx
```

Backend container checks on Hetzner:

```bash
ssh root@157.90.127.76
docker ps --filter name=model-backend
docker logs --tail=120 model-backend
curl -sS https://api.lpstudies.net/health
```

Switch backend target (frontend config in `index.html`):

- Cutover to Hetzner: `activeModelBackend: "hetzner"`
- Rollback to Cloud Run: `activeModelBackend: "gcloud"`

## Overview

Participants go through these screens:

1. Welcome
2. Consent
3. Instructions
4. Attention Check (2 multiple-choice questions)
5. Main Task Reminder
6. Task (up to 10 rewrite attempts)
7. Feedback 
8. End

The app records session timing and interaction data and submits it through `api/participantData.php`.

## Current Production Architecture

- Frontend + PHP API: Hetzner VPS (`lpstudies.net`)
- Model backend (active): Hetzner API (`api.lpstudies.net`)
- Model backend (standby/rollback): Google Cloud Run

The frontend supports both model backends using runtime config in `index.html`:

- `window.APP_CONFIG.modelApiBackends.gcloud`
- `window.APP_CONFIG.modelApiBackends.hetzner`
- `window.APP_CONFIG.activeModelBackend`

## Repository Structure

- `index.html`: app shell + runtime config
- `style.css`: UI styles
- `src/`: frontend logic
  - `src/app.js`: main flow and handlers
  - `src/services/modelService.js`: backend endpoint selection + prediction calls
  - `src/sessionTracking.js`: session payload + submit
- `api/`: PHP endpoints
  - `api/statements.php`: serves corpus statements
  - `api/participantData.php`: writes participant session records
- `data/`: corpus + generated output
  - `data/statements.csv`
  - `data/sessions/` (gitignored)
  - `data/exports/` (gitignored)
- `backend/`: FastAPI model service
- `spec/`, `specRunner.html`: Jasmine tests

## Local Development

## 1) Start PHP server (required)

From repo root:

```bash
php -S localhost:8000
```

Open:

```text
http://localhost:8000?PROLIFIC_PID=test123
```

## 2) Start Python model API (optional)

From `backend/`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

Expected local endpoints:

- `http://127.0.0.1:8080/health`
- `http://127.0.0.1:8080/predict`

## 3) Run tests

**Automated test runner (headless):**

```bash
# One-time setup
npm install

# Single run
npm test

# Watch mode (re-runs on file changes)
npm run test:watch
```

**Browser-based test runner (legacy):**

Open in browser:

```text
http://localhost:8000/specRunner.html
```

## Frontend Runtime Behavior

This is a static SPA served by Nginx, with PHP endpoints for data.

- Entry point: `index.html`
- Router style: app state driven in `src/app.js` (no framework router)
- API calls from frontend:
  - `api/statements.php` (corpus rows)
  - `api/participantData.php` (session writes)
  - model backend endpoint from `window.APP_CONFIG`

On local `localhost`/`127.0.0.1`, config defaults to local PHP/API endpoints.
On production host, config uses relative PHP endpoints and configured model backend.

### State Persistence and Navigation Guardrails

- Attention-check answers (`q1`, `q2`) are persisted on change, so revisits/re-renders in the same browser session restore selected options.
- Task-page rewrite drafts are persisted on input, so unsent text is restored after re-render/reload in the same browser session.
- Browser back navigation is handled via `popstate` and re-renders the current app screen.
- A one-time warning is shown on the first trapped back-navigation attempt per screen:
  - `Back navigation is disabled in this study. Repeated attempts may cause you to leave the study. Please use the on-screen buttons.`
- If browser storage is cleared, preselected answers/drafts are no longer restored.

## Frontend Deployment (Hetzner)

## 1) First-time server setup (one-time)

SSH to server:

```bash
ssh root@157.90.127.76
```

Install required packages:

```bash
apt update && apt upgrade -y
apt install -y nginx php8.3-fpm php8.3-curl php8.3-mbstring php8.3-xml php8.3-zip php8.3-pgsql unzip git curl certbot python3-certbot-nginx composer postgresql postgresql-contrib
```

Clone repository:

```bash
mkdir -p /var/www
cd /var/www
git clone <YOUR_REPO_URL> study
cd /var/www/study
composer install --no-dev
```

Create Nginx site `/etc/nginx/sites-available/study`:

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name lpstudies.net www.lpstudies.net;

  root /var/www/study;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~ ^/api/.*\.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php8.3-fpm.sock;
  }
}
```

Enable site and reload Nginx:

```bash
ln -sfn /etc/nginx/sites-available/study /etc/nginx/sites-enabled/study
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Set permissions for writable paths:

```bash
chown -R www-data:www-data /var/www/study
find /var/www/study -type d -exec chmod 755 {} \;
find /var/www/study -type f -exec chmod 644 {} \;
mkdir -p /var/www/study/data/sessions /var/www/study/data/exports
chown -R www-data:www-data /var/www/study/data/sessions /var/www/study/data/exports
chmod -R 775 /var/www/study/data/sessions /var/www/study/data/exports
```

Issue SSL for frontend domain:

```bash
certbot --nginx -d lpstudies.net -d www.lpstudies.net --redirect
```

## 2) Frontend redeploy (day-to-day)

From local machine (in repo root):

```bash
git status
git add .
git commit -m "Describe frontend changes"
git push origin main
```

Then on Hetzner server pull and reload:

```bash
ssh root@157.90.127.76
cd /var/www/study
git status
git branch
git pull
composer install --no-dev
nginx -t && systemctl reload nginx
```

If server has local uncommitted changes and `git pull` is blocked:

```bash
git stash
git pull
git stash pop
```

## 3) Frontend verification after deploy

On server:

```bash
curl -I https://lpstudies.net
curl -sS https://lpstudies.net/api/statements.php | head
```

In browser:

- Open `https://lpstudies.net?PROLIFIC_PID=test123`
- Complete one test flow
- Confirm end page submit succeeds (Network tab `api/participantData.php`)

## 4) Frontend rollback

If latest deploy breaks frontend:

```bash
ssh root@157.90.127.76
cd /var/www/study
git log --oneline -n 5
git checkout <LAST_KNOWN_GOOD_COMMIT>
composer install --no-dev
nginx -t && systemctl reload nginx
```

Then fix forward on main branch and redeploy normally.

## Runtime Config (Frontend)

Runtime config is defined in `index.html`:

```js
window.APP_CONFIG = {
  corpusPhpEndpoint: "...",
  modelApiEndpoint: "...", // legacy fallback
  modelApiBackends: {
    gcloud: "https://model-backend-302671925464.europe-west4.run.app/predict",
    hetzner: "https://api.lpstudies.net/predict"
  },
  activeModelBackend: "hetzner",
  participantDataEndpoint: "..."
};
```

Notes:

- `modelApiEndpoint` is kept for backward compatibility.
- `modelService.getApiEndpoint()` uses `activeModelBackend` first.
- Rollback is a one-line change of `activeModelBackend`.

Temporary browser override for debugging (non-persistent):

```js
window.APP_CONFIG.activeModelBackend = "gcloud";
console.log(window.APP_CONFIG);
```

## Data Flow and Storage

Session data is sent from frontend to `api/participantData.php`.

Current persistence behavior:

- Primary write target: PostgreSQL (`results` table)
- Fallback write target: GCloud object storage (`sessions/*.json` and `csv-rows/*.csv`)

Storage backend is controlled by environment variables for `api/participantData.php`:

```bash
export STORAGE_BACKEND=postgres
export STORAGE_FALLBACK_BACKEND=gcloud

export POSTGRES_HOST=127.0.0.1
export POSTGRES_PORT=5432
export POSTGRES_DB=study
export POSTGRES_USER=study_app
export POSTGRES_PASSWORD='<STRONG_PASSWORD>'
export POSTGRES_SSLMODE=prefer

export GCS_BUCKET=paraphrasing-attacks-data-euw4
export GCS_CREDENTIALS_PATH=/var/www/study/gcs-credentials.json
```

Create schema once:

```bash
sudo -u postgres psql -d study -f /var/www/study/api/sql/postgres_schema.sql
```

GCloud object naming remains unchanged for compatibility:

- `sessions/<prolific_id>_<session_id>.json`
- `csv-rows/<prolific_id>_<session_id>.csv`

Deduplication is enforced by SQL unique key on `session_id`.

## Data Retrieval (PostgreSQL on Hetzner)

All participant data is stored in the `results` table in the `study` PostgreSQL database on the Hetzner VPS.

Each row has:
- `session_id` — unique ID for the session (guaranteed no duplicates)
- `prolific_id` — the participant's Prolific ID
- `received_at` — when the server received the submission
- `payload_json` — the full raw session object as JSON
- `csv_row_json` — the flat CSV-compatible row as JSON (includes attention-check fields)
- `created_at` — when the row was inserted into the database

All commands below run on the server after `ssh root@157.90.127.76`.

## 1) Count and inspect rows

```bash
# Total number of submissions
sudo -u postgres psql -d study -c "SELECT COUNT(*) FROM results;"

# Most recent 20 submissions
sudo -u postgres psql -d study -c "SELECT session_id, prolific_id, received_at FROM results ORDER BY received_at DESC LIMIT 20;"

# All submissions for one participant
sudo -u postgres psql -d study -c "SELECT session_id, received_at FROM results WHERE prolific_id = '<prolific_id>' ORDER BY received_at;"

# Look up one specific session by session_id
sudo -u postgres psql -d study -c "SELECT session_id, prolific_id, received_at FROM results WHERE session_id = '<session_id>';"
```

## 2) Read JSON data

```bash
# Full raw payload for one session (pretty-printed)
sudo -u postgres psql -d study -c "SELECT payload_json FROM results WHERE session_id = '<session_id>';"

# One specific field from the payload (e.g. consent decision)
sudo -u postgres psql -d study -c "SELECT payload_json->'pages'->'consent'->>'decision' FROM results WHERE session_id = '<session_id>';"

# Flat CSV row data for one session
sudo -u postgres psql -d study -c "SELECT csv_row_json FROM results WHERE session_id = '<session_id>';"

# One specific CSV field (e.g. total duration)
sudo -u postgres psql -d study -c "SELECT csv_row_json->>'total_duration_ms' FROM results WHERE session_id = '<session_id>';"

# Attention-check summary field (current schema)
sudo -u postgres psql -d study -c "SELECT csv_row_json->>'attention_check_num_correct' FROM results WHERE session_id = '<session_id>';"

# Page-level timing fields from csv_row_json
sudo -u postgres psql -d study -c "SELECT csv_row_json->>'total_duration_ms', csv_row_json->>'welcome_duration_ms', csv_row_json->>'consent_duration_ms', csv_row_json->>'instructions_duration_ms', csv_row_json->>'attention_check_duration_ms', csv_row_json->>'task_reminder_duration_ms', csv_row_json->>'feedback_duration_ms' FROM results WHERE session_id = '<session_id>';"

# Rewrite-attempt timing fields (per attempt)
sudo -u postgres psql -d study -c "SELECT csv_row_json->>'rewrite1_duration_ms', csv_row_json->>'rewrite2_duration_ms', csv_row_json->>'rewrite3_duration_ms', csv_row_json->>'rewrite4_duration_ms', csv_row_json->>'rewrite5_duration_ms', csv_row_json->>'rewrite6_duration_ms', csv_row_json->>'rewrite7_duration_ms', csv_row_json->>'rewrite8_duration_ms', csv_row_json->>'rewrite9_duration_ms', csv_row_json->>'rewrite10_duration_ms' FROM results WHERE session_id = '<session_id>';"

# Timing fields are stored as text in JSON; cast to bigint for numeric analysis.
sudo -u postgres psql -d study -c "SELECT session_id, (csv_row_json->>'total_duration_ms')::bigint AS total_duration_ms FROM results WHERE csv_row_json->>'total_duration_ms' <> '' ORDER BY total_duration_ms DESC LIMIT 20;"
```

## 3) Export data to local machine

Run these from your **local terminal** (not on the server):

```bash
# One-time setup on server (creates the results_csv view for short exports)
ssh root@157.90.127.76 "sudo -u postgres psql -d study -f /var/www/study/api/sql/results_csv_view.sql"

# Preferred short CSV export (uses results_csv view with header row)
ssh root@157.90.127.76 "sudo -u postgres psql -d study -c \"\\copy (SELECT * FROM results_csv ORDER BY received_at) TO STDOUT WITH CSV HEADER\"" > ~/Desktop/all_sessions.csv

# Timing-focused CSV export (durations only)
ssh root@157.90.127.76 "sudo -u postgres psql -d study -c \"\\copy (SELECT session_id, prolific_id, total_duration_ms, welcome_duration_ms, consent_duration_ms, instructions_duration_ms, attention_check_duration_ms, task_reminder_duration_ms, feedback_duration_ms, rewrite1_duration_ms, rewrite2_duration_ms, rewrite3_duration_ms, rewrite4_duration_ms, rewrite5_duration_ms, rewrite6_duration_ms, rewrite7_duration_ms, rewrite8_duration_ms, rewrite9_duration_ms, rewrite10_duration_ms, received_at FROM results_csv ORDER BY received_at) TO STDOUT WITH CSV HEADER\"" > ~/Desktop/all_sessions_timing.csv

# Full JSON export (one payload per line)
ssh root@157.90.127.76 "sudo -u postgres psql -d study -At -c \"SELECT payload_json::text FROM results ORDER BY received_at;\"" > ~/Desktop/all_sessions.ndjson

# Legacy explicit-column CSV export (kept for compatibility)
# For full-column export, prefer the `results_csv` view above.
# This explicit example keeps only common analysis columns and follows current field naming/order.
ssh root@157.90.127.76 "sudo -u postgres psql -d study -At -F',' -c \"SELECT csv_row_json->>'session_id', csv_row_json->>'prolific_id', csv_row_json->>'session_start', csv_row_json->>'session_end', csv_row_json->>'total_duration_ms', csv_row_json->>'consent_decision', csv_row_json->>'statement_id', csv_row_json->>'attempts_used', csv_row_json->>'max_attempts', csv_row_json->>'motivation', csv_row_json->>'difficulty', csv_row_json->>'strategies', csv_row_json->>'feedback_text', csv_row_json->>'attention_check_num_correct', csv_row_json->>'attention_check_all_correct', csv_row_json->>'received_at' FROM results ORDER BY received_at;\"" > ~/Desktop/all_sessions.csv

# Export one participant's sessions as CSV
ssh root@157.90.127.76 "sudo -u postgres psql -d study -At -F',' -c \"SELECT csv_row_json->>'session_id', csv_row_json->>'prolific_id', csv_row_json->>'received_at' FROM results WHERE prolific_id = '<prolific_id>' ORDER BY received_at;\"" > ~/Desktop/participant_sessions.csv
```

## 4) Edit rows

```bash
# Delete one specific session by session_id (e.g. test submissions)
sudo -u postgres psql -d study -c "DELETE FROM results WHERE session_id = '<session_id>';"

# Delete all sessions for one participant
sudo -u postgres psql -d study -c "DELETE FROM results WHERE prolific_id = '<prolific_id>';"

# Delete all test/dummy rows (e.g. prolific_id starts with 'test')
sudo -u postgres psql -d study -c "DELETE FROM results WHERE prolific_id LIKE 'test%';"

# Update a field in csv_row_json for one session (e.g. fix a prolific_id typo)
sudo -u postgres psql -d study -c "UPDATE results SET csv_row_json = jsonb_set(csv_row_json, '{prolific_id}', '\"correct-id\"') WHERE session_id = '<session_id>';"
```

## 5) Interactive psql session

For more complex queries, open an interactive session:

```bash
sudo -u postgres psql -d study
```

Useful psql commands inside the session:

```sql
-- list tables
\dt

-- describe results table columns
\d results

-- run any query
SELECT * FROM results LIMIT 5;

-- exit
\q
```

## 6) Create timestamped database backup

```bash
# Dump full database to file on server
sudo -u postgres pg_dump study > /var/backups/study-$(date +%F-%H%M).sql

# Download latest dump to local machine (run from local terminal)
scp root@157.90.127.76:"$(ssh root@157.90.127.76 'ls -1t /var/backups/study-*.sql | head -n1')" ~/Desktop/study-backup.sql
```

## 7) Restore from backup

```bash
sudo -u postgres psql -d study -f /var/backups/study-<date>.sql
```

## Data Retrieval (GCloud / Cloud Storage)

Use this section if you need historical data that was written to Cloud Storage before migrating to Hetzner.

Set your bucket name (example used previously: `paraphrasing-attacks-data-euw4`):

```bash
export BUCKET_NAME="paraphrasing-attacks-data-euw4"
```

## 1) Authenticate and set project

```bash
gcloud auth login
gcloud config set project <PROJECT_ID>
```

## 2) List stored objects

```bash
gcloud storage ls "gs://${BUCKET_NAME}/" --recursive
```

Typical paths:

- `gs://<bucket>/sessions/<prolific_id>_<session_id>.json`
- `gs://<bucket>/csv-rows/<prolific_id>_<session_id>.csv`

## 3) Export complete combined CSV from all participants

```bash
gcloud storage cat "gs://${BUCKET_NAME}/csv-rows/*.csv" \
  | awk 'NR==1 || !/^session_id/' \
  > ~/Desktop/all_sessions.csv
```

```bash
gcloud storage cat "gs://paraphrasing-attacks-data-euw4/csv-rows/*.csv" \
  | awk 'NR==1 || !/^session_id/' \
  > ~/Desktop/all_sessions.csv
```

This keeps one header row and appends all participant rows.

## 4) Download all full session JSON files

```bash
mkdir -p ~/Desktop/gcloud_sessions_json
gcloud storage cp "gs://${BUCKET_NAME}/sessions/*.json" ~/Desktop/gcloud_sessions_json/
```

## 5) Inspect single participant/session quickly

```bash
# Show one CSV row file
gcloud storage cat "gs://${BUCKET_NAME}/csv-rows/<prolific_id>_<session_id>.csv"

# Show one full JSON file
gcloud storage cat "gs://${BUCKET_NAME}/sessions/<prolific_id>_<session_id>.json"
```

## 6) Optional: archive full bucket snapshot locally

```bash
mkdir -p ~/Desktop/gcloud_bucket_snapshot
gcloud storage cp --recursive "gs://${BUCKET_NAME}" ~/Desktop/gcloud_bucket_snapshot/
```

## End-to-End Test Playbook

## A) Local end-to-end test

1. Start local PHP server and optional local backend.
2. Open `http://localhost:8000?PROLIFIC_PID=test123`.
3. Complete full flow through End page.
4. Verify browser Network tab:
  - `POST api/participantData.php` returns success JSON.
5. Verify local files:
  - JSON created in `data/sessions/`
  - CSV row appended in `data/exports/sessions.csv`

Quick local cleanup between tests:

```js
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## B) Production end-to-end test (Hetzner active)

1. Verify API health:

```bash
curl -sS https://api.lpstudies.net/health
```

Expected: `real_inference_enabled: true`.

2. Open production app with test participant ID:

```text
https://lpstudies.net?PROLIFIC_PID=test-e2e-001
```

3. Complete full flow once.
4. Verify submission on server:

```bash
ssh root@157.90.127.76
tail -n 5 /var/www/study/data/exports/sessions.csv
ls -t /var/www/study/data/sessions | head -n 5
```

5. Confirm latest row contains expected values:
  - `prolific_id = test-e2e-001`
  - consent decision populated
  - attempt counts/timestamps present

## C) Backend switch verification (Hetzner vs GCloud)

1. Set `activeModelBackend` in `index.html`.
2. Deploy frontend.
3. Hard refresh browser (`Cmd+Shift+R`).
4. In DevTools Network tab, verify prediction request host:
  - Hetzner: `api.lpstudies.net/predict`
  - GCloud: `model-backend-...run.app/predict`

## D) Minimal smoke test after each deploy

```bash
# frontend
curl -I https://lpstudies.net

# php API
curl -sS https://lpstudies.net/api/statements.php | head

# model API
curl -sS https://api.lpstudies.net/health
```

## Deploy Model Backend to Cloud Run (kept available)

From local repo:

```bash
cd backend
gcloud run deploy model-backend \
  --source . \
  --region europe-west4 \
  --allow-unauthenticated
```

Cloud Run endpoints:

- `https://model-backend-302671925464.europe-west4.run.app/health`
- `https://model-backend-302671925464.europe-west4.run.app/predict`

## Deploy Model Backend to Hetzner (Docker)

This is the current self-hosted path.

## 1) Prerequisites on server

```bash
ssh root@157.90.127.76
docker --version
nginx -v
```

## 2) Ensure model files exist on server

Expected backend model path (current production):

```text
/var/www/study/backend/models/modernbert_trained
```

Alternative rollback path:

```text
/var/www/study/backend/models/distilBERT_finetuned
```

Expected files:

- `config.json`
- `model.safetensors`
- `tokenizer.json`
- `tokenizer_config.json`
- `special_tokens_map.json`
- `vocab.txt`

If model folder is missing, copy from local machine using a temporary tar archive.

## 3) Build and run container

```bash
ssh root@157.90.127.76
cd /var/www/study/backend

docker build -t model-backend:hetzner .
docker rm -f model-backend 2>/dev/null || true
docker run -d \
  --name model-backend \
  --restart unless-stopped \
  -e PORT=8000 \
  -e MODEL_DIR=models/modernbert_trained \
  -e MODEL_VERSION=modernbert-v1 \
  -e RAW_LABEL_FOR_TRUTHFUL=0 \
  -p 127.0.0.1:8000:8000 \
  model-backend:hetzner
```

## 4) Verify local container

```bash
docker ps --filter name=model-backend
docker logs --tail=120 model-backend
curl -sS http://127.0.0.1:8000/health
curl -sS -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text":"The Eiffel Tower is in Paris."}'
```

Health must show:

- `"real_inference_enabled": true`
- `"model_load_error": null`

## 5) Public API via Nginx + SSL

DNS records for `api.lpstudies.net`:

- `A -> 157.90.127.76`
- `AAAA -> 2a01:4f8:1c1a:2fa3::1`

Nginx site `/etc/nginx/sites-available/api.lpstudies.net`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.lpstudies.net;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180;
    }
}
```

Enable and reload:

```bash
ln -sfn /etc/nginx/sites-available/api.lpstudies.net /etc/nginx/sites-enabled/api.lpstudies.net
nginx -t && systemctl reload nginx
```

Issue SSL cert:

```bash
certbot --nginx -d api.lpstudies.net --redirect
```

Verify HTTPS:

```bash
curl -sS https://api.lpstudies.net/health
curl -sS -X POST https://api.lpstudies.net/predict \
  -H "Content-Type: application/json" \
  -d '{"text":"The Eiffel Tower is in Paris."}'
```

## Cutover and Rollback

Cutover (frontend uses Hetzner):

- In `index.html`, set `activeModelBackend: "hetzner"`.
- Deploy frontend (`git push`, then `git pull` on server).

Rollback to Cloud Run:

- Set `activeModelBackend: "gcloud"`.
- Deploy frontend again.

No backend redeploy is required for this toggle.

## Day-to-Day Server Operations

Useful commands on Hetzner:

```bash
# SSH in
ssh root@157.90.127.76

# App code
cd /var/www/study

# Pull latest frontend/PHP code
git pull
composer install --no-dev
systemctl reload nginx

# Backend container status
docker ps --filter name=model-backend
docker logs --tail=200 model-backend

# Restart backend container
docker restart model-backend

# Rebuild backend image after backend code change
cd /var/www/study/backend
docker build -t model-backend:hetzner .
docker rm -f model-backend
docker run -d --name model-backend --restart unless-stopped -e PORT=8000 -e MODEL_DIR=models/modernbert_trained -e MODEL_VERSION=modernbert-v1 -e RAW_LABEL_FOR_TRUTHFUL=0 -p 127.0.0.1:8000:8000 model-backend:hetzner

# Nginx checks
nginx -t
systemctl reload nginx
```

## Troubleshooting

- `curl https://api.lpstudies.net/health` gives SSL host error:
  - Cert for `api.lpstudies.net` missing. Run `certbot --nginx -d api.lpstudies.net --redirect`.
- Health says `real_inference_enabled: false`:
  - Model files missing or wrong path in container.
  - Verify the path configured by `MODEL_DIR` (for current production: `/var/www/study/backend/models/modernbert_trained`) and rebuild image.
- Frontend still calls Cloud Run unexpectedly:
  - Check `index.html` for `activeModelBackend` value.
  - Ensure latest code is deployed on server (`git pull`).
- `api/participantData.php` not writing:
  - Verify PostgreSQL credentials/environment variables are set for PHP-FPM.
  - Verify schema exists: `api/sql/postgres_schema.sql`.
  - Check fallback mode (`STORAGE_FALLBACK_BACKEND=gcloud`) and `gcs-credentials.json`.
- Port conflict on local dev (`Address already in use`):
  - Stop existing process or use another port.

## Security and Secrets

Do not commit secrets or generated artifacts.

Already ignored:

- `gcs-credentials.json`
- `backend/models/`
- `data/sessions/`
- `data/exports/`
- `backend/*.tar.gz`
- `backend/*.tgz`

## Git Workflow

```bash
git add .
git commit -m "Describe change"
git push
```

## Pre-Push Checklist

- `git status` shows only expected files.
- `index.html` has the intended `activeModelBackend` value.
- `https://api.lpstudies.net/health` returns `real_inference_enabled: true` when Hetzner is active.
- If backend code changed, container was rebuilt and re-verified.
- No secrets in diff (`gcs-credentials.json`, model files, exports).

## License

MIT, see `LICENSE`.
