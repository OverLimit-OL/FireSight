# FireSight single-workspace PoC

One FastAPI service serves the built React app and `/api/v1`. SQLite on Railway's `/data` volume stores experiments, immutable configuration revisions, illustrative runs, conversations and extracted uploads. There is no scientific solver. Existing bundled study overviews are the research catalog; no full NASA corpus is ingested.

## Run locally

From the repository root:

```sh
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
cd frontend
npm ci
VITE_DATA_MODE=http VITE_API_BASE_URL=/ npm run build
cd ..
.venv/bin/uvicorn backend.app:app --port 8000
```

Local development is unauthenticated unless `FIRESIGHT_PASSWORD_HASH` is configured. Production uses HTTP Basic over Railway HTTPS with the username `firesight`. The password is verified with scrypt. This is one shared research workspace, not multi-user tenancy.

## Gemini

Open `/setup`, follow the Google AI Studio link, create a key and save it. The password input never returns the saved key. Keys use authenticated Fernet encryption; the encryption key is a mode-0600 file on the persistent volume. Hashing a Gemini key would make it unusable for provider requests. This protects database-only disclosure; someone with server/volume access can decrypt it.

The default provider model is `gemini-3.5-flash-lite`, configurable with `GEMINI_MODEL`. Selected study metadata, conversation history, research context and uploaded text are sent to Google for each request. No key means an explicit unavailable error, never a mock answer. Provider errors also remain visible. Validate a real response after adding your key.

PDF/TXT/CSV/JSON uploads are limited to 10 MiB and PDFs to 200 pages. Extracted text is stored, not original files; up to 20,000 characters per attachment enter the prompt. This is bounded context, not a vector-search/RAG pipeline. Evidence links indicate overview provenance, not independent scientific validation.

## Railway operations

The Dockerfile builds the frontend and starts Uvicorn on `$PORT`. Keep one replica with `/data` mounted. `/health` checks database availability. Redeploy with `railway up --service firesight --detach --yes` from the linked repository. Railway deployment history can restore the prior image; do not delete the volume when rolling back.

Back up the SQLite database with SQLite's online backup API and copy `encryption.key` separately into protected storage. Both are required for recovery. Automated backup scheduling is not configured by this PoC. Shared credentials, retention/deletion controls, rate limits and multi-user access should be upgraded before opening this workspace to a wider audience.

Run backend checks with `.venv/bin/python -m unittest discover -s backend -p 'test_*.py'`.
