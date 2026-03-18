# Deception Paraphrasing Interface

Frontend interface for a human paraphrasing task in a study on attacks against automated deception classifiers.

## What This Project Does

Participants go through a multi-step interface:

1. Welcome
2. Consent
3. Instructions
4. Task (rewrite text up to 10 attempts)
5. Feedback
6. End

The app records timing and interaction data across the full session and sends it to a PHP endpoint.

## Architecture

This project uses two backend components:

- PHP backend (same host as frontend):
	- Serves static files (`index.html`, `src/*`, `style.css`)
	- `api/statements.php` serves source statements from CSV
	- `api/participantData.php` stores participant session data
- Optional Python model backend (`backend/main.py`):
	- `POST /predict` for model predictions
	- Used by the UI when `window.APP_CONFIG.modelApiEndpoint` is set
	- Can run locally on `127.0.0.1:8080` or on Cloud Run
	- If no model endpoint is set, frontend falls back to deterministic local prediction logic

## Repository Structure

- `index.html` - single-page app shell and runtime config (`window.APP_CONFIG`)
- `style.css` - UI styling
- `src/` - frontend application code
	- `src/app.js` - main flow and handlers
	- `src/sessionTracking.js` - session instrumentation + POST
	- `src/state.js` - runtime state/session schema
	- `src/storage.js` - local/session storage helpers
	- `src/services/` - corpus and model services
	- `src/pages/` - page renderers
- `api/`
	- `api/statements.php` - returns statement corpus rows
	- `api/participantData.php` - stores JSON and appends `sessions.csv`
- `data/`
	- `data/statements.csv` and corpus files (input data)
	- `data/sessions/` (generated participant JSON; gitignored)
	- `data/exports/sessions.csv` (generated aggregate CSV; gitignored)
- `backend/` - Python model service
- `spec/`, `specRunner.html` - Jasmine tests

## Local Run

### 1) Start PHP server (required)

Run from repo root:

```bash
/opt/homebrew/bin/php -S localhost:8000
```

Open:

```text
http://localhost:8000?PROLIFIC_PID=test123
```

### 2) Start Python model API (optional)

If you want real model inference (instead of frontend fallback predictions):

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

By default, local frontend config points model requests to `http://127.0.0.1:8080/predict`.

### 3) Optional: use Live Server for frontend work

If you prefer Live Server on `localhost:5500`, keep the PHP server running on `localhost:8000`.

The app is configured so that while running on Live Server:

- statement corpus requests go to `http://127.0.0.1:8000/api/statements.php`
- participant session exports go to `http://127.0.0.1:8000/api/participantData.php`
- model predictions still default to local FastAPI at `http://127.0.0.1:8080/predict`

## Production Model API

The current Cloud Run model endpoint is:

```text
https://model-backend-302671925464.europe-west4.run.app/predict
```

The frontend automatically uses this URL when not running on `localhost`/`127.0.0.1`.

For local testing against Cloud Run, override the model endpoint in the browser console:

```js
window.APP_CONFIG.modelApiEndpoint = "https://model-backend-302671925464.europe-west4.run.app/predict";
console.log("Model endpoint:", window.APP_CONFIG.modelApiEndpoint);
```

## Data Collected Per Session

- `sessionId`, `prolificId`, start/end timestamps, total duration
- Page enter/exit timestamps and durations
- Consent decision
- Task statement metadata:
	- original text, original label, original confidence
	- up to 10 rewrite attempts with label/confidence/duration
- Feedback form responses

## Data Persistence

- Frontend writes in-progress session data to `localStorage`
- On end page, frontend posts to `api/participantData.php`
- PHP stores:
	- raw JSON file: `data/sessions/{prolificId}_{sessionId}.json`
	- aggregate CSV row: `data/exports/sessions.csv`
- CSV append is deduplicated by `session_id`
- On successful post, frontend clears `sessionData` from local storage
- After a successful post, the frontend also creates a fresh in-memory session so the next run gets a new `sessionId`

## Clean Test Run

For a clean end-to-end run with new timing data and a new CSV row:

1. Open the app.
2. In browser console, run:

```js
localStorage.clear();
sessionStorage.clear();
location.reload();
```

3. If you want predictions from Cloud Run instead of local FastAPI, run:

```js
window.APP_CONFIG.modelApiEndpoint = "https://model-backend-302671925464.europe-west4.run.app/predict";
console.log("Model endpoint:", window.APP_CONFIG.modelApiEndpoint);
```

4. Complete the study flow.
5. Verify the final `POST` to `api/participantData.php` returns:

```json
{
	"success": true,
	"csvUpdated": true,
	"duplicateSession": false
}
```

## End-to-End Check

1. Start PHP server.
2. Open app with `?PROLIFIC_PID=test123`.
3. Complete full flow through end page.
4. Verify:
	 - new JSON in `data/sessions/`
	 - new row in `data/exports/sessions.csv`
	 - `consent_decision` and `prolific_id` are populated

## Hosting Notes

If hosting the full interface on a live server:

- Deploy the frontend files and `api/*.php` together on a PHP-capable host.
- Ensure web server write permissions for:
	- `data/sessions/`
	- `data/exports/`
- Keep these output folders out of git (already configured in `.gitignore`).
- If using Python model API in production, set `window.APP_CONFIG.modelApiEndpoint` to your hosted `/predict` URL and configure CORS as needed.
- The current backend CORS config allows localhost development origins and the deployed Cloud Run origin.

## Troubleshooting

- `Address already in use` when starting PHP:
	- Another process is already using port `8000`.
	- Stop the existing process or run PHP on another port.
- `consent_decision` is empty in CSV:
	- Use the latest code where consent is written to `state.sessionData.pages.consent.decision`.
	- Re-run a fresh end-to-end session.
- `prolific_id` shows `unknown`:
	- Ensure launch URL contains `?PROLIFIC_PID=...`.
	- Confirm code reads `PROLIFIC_PID` (not `PROLIFIC_ID`).
- Model prediction request fails:
	- If running local model API, confirm `uvicorn` is running on `http://127.0.0.1:8080`.
	- If testing Cloud Run locally, confirm the request URL in browser Network tab ends with `run.app/predict`.
	- If not using model API, leave `modelApiEndpoint` empty to use frontend fallback predictions.
- No session JSON/CSV output:
	- Confirm `api/participantData.php` is reachable from the app host.
	- Confirm server can write to `data/sessions/` and `data/exports/`.
	- If `duplicateSession` is true, the backend received the request but skipped CSV append because that `sessionId` already exists.

## License

This project is licensed under the MIT License. See `LICENSE`.

## Git Commands

```bash
git add .
git commit -m "Describe change"
git push
```