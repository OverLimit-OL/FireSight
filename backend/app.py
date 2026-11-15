"""FireSight single-workspace PoC API and static frontend."""

import os
import json
import uuid
import hashlib
import secrets
import sqlite3
from pathlib import Path
from datetime import datetime, timezone
from contextlib import contextmanager

import asyncio
from weakref import WeakValueDictionary
from cryptography.fernet import Fernet
from fastapi import FastAPI, Request, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pypdf import PdfReader
from backend import auth, research

ROOT = Path(__file__).parent
DATA = Path(os.getenv("DATA_DIR", str(ROOT / "storage")))
DATA.mkdir(parents=True, exist_ok=True)
CAT = json.loads((ROOT / "data/catalog.json").read_text())
MODEL = CAT["model"]
app = FastAPI(title="FireSight API", docs_url=None, redoc_url=None)


@contextmanager
def db():
    user = auth.account_id.get()
    filename = f"account-{user}.db" if user and user != "legacy" else "firesight.db"
    connection = sqlite3.connect(DATA / filename, timeout=15)
    connection.execute(
        "CREATE TABLE IF NOT EXISTS records (kind TEXT,id TEXT,payload TEXT,PRIMARY KEY(kind,id))"
    )
    connection.execute(
        "CREATE TABLE IF NOT EXISTS settings (name TEXT PRIMARY KEY,value TEXT)"
    )
    connection.execute("PRAGMA journal_mode=WAL")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


with db() as connection:
    connection.execute(
        "CREATE TABLE IF NOT EXISTS records (kind TEXT,id TEXT,payload TEXT,PRIMARY KEY(kind,id))"
    )
    connection.execute(
        "CREATE TABLE IF NOT EXISTS settings (name TEXT PRIMARY KEY,value TEXT)"
    )


def now():
    return datetime.now(timezone.utc).isoformat()


def uid():
    return str(uuid.uuid4())


def get(kind, key):
    with db() as connection:
        row = connection.execute(
            "SELECT payload FROM records WHERE kind=? AND id=?", (kind, key)
        ).fetchone()
    if not row:
        raise HTTPException(404, "Record not found")
    return json.loads(row[0])


def put(kind, record):
    with db() as connection:
        connection.execute(
            "INSERT OR REPLACE INTO records VALUES (?,?,?)",
            (kind, record["id"], json.dumps(record)),
        )
    return record


def listing(kind):
    with db() as connection:
        return [
            json.loads(row[0])
            for row in connection.execute(
                "SELECT payload FROM records WHERE kind=? ORDER BY rowid DESC", (kind,)
            )
        ]


def setting(name, value=None):
    with db() as connection:
        if value is not None:
            connection.execute(
                "INSERT OR REPLACE INTO settings VALUES (?,?)", (name, value)
            )
        row = connection.execute(
            "SELECT value FROM settings WHERE name=?", (name,)
        ).fetchone()
        return row[0] if row else None


key_path = DATA / "encryption.key"
if not key_path.exists():
    key_path.write_bytes(Fernet.generate_key())
    key_path.chmod(0o600)
cipher = Fernet(key_path.read_bytes())
auth.configure(DATA, cipher)
app.include_router(auth.router)


@app.exception_handler(HTTPException)
async def errors(request, error):
    return JSONResponse(
        {"error": {"message": error.detail}}, status_code=error.status_code
    )


@app.middleware("http")
async def access(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)
    token = None
    if auth.enabled():
        user = auth.identity(request)
        public = request.url.path in (
            "/",
            "/welcome",
            "/login",
            "/register",
        ) or request.url.path.startswith(("/auth/", "/public/"))
        if not user and not public:
            if request.url.path.startswith("/api/"):
                return JSONResponse({"error": {"message": "Sign in to continue"}}, 401)
            return RedirectResponse("/login", 303)
        token = auth.account_id.set(user)
    else:
        password = os.getenv("FIRESIGHT_PASSWORD_HASH", "")
        if password:
            import base64

            header = request.headers.get("authorization", "")
            try:
                user, supplied = (
                    base64.b64decode(header.removeprefix("Basic "))
                    .decode()
                    .split(":", 1)
                )
            except Exception:
                user, supplied = "", ""
            if user != "firesight" or not secrets.compare_digest(
                hashlib.scrypt(
                    supplied.encode(), salt=b"firesight-login-v1", n=16384, r=8, p=1
                ).hex(),
                password,
            ):
                return JSONResponse(
                    {"error": {"message": "Sign in to FireSight"}},
                    401,
                    headers={"WWW-Authenticate": 'Basic realm="FireSight"'},
                )
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        origin = request.headers.get("origin")
        expected_origin = os.getenv("PUBLIC_ORIGIN") or (
            "https://" + os.environ["RAILWAY_PUBLIC_DOMAIN"]
            if os.getenv("RAILWAY_PUBLIC_DOMAIN")
            else str(request.base_url).rstrip("/")
        )
        if origin and origin.rstrip("/") != expected_origin.rstrip("/"):
            return JSONResponse(
                {"error": {"message": "Cross-origin writes are disabled"}}, 403
            )
    try:
        response = await call_next(request)
    finally:
        if token is not None:
            auth.account_id.reset(token)
    response.headers["X-Content-Type-Options"] = "nosniff"
    if request.url.path.startswith(
        ("/setup", "/api/", "/auth/", "/login", "/register")
    ):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/health")
def health():
    with db() as connection:
        connection.execute("SELECT 1")
    return {"status": "ok"}


@app.get("/setup", response_class=HTMLResponse)
def setup():
    configured = bool(setting("gemini_key"))
    return (
        """<!doctype html><html><meta name="viewport" content="width=device-width"><title>FireSight AI setup</title><style>body{background:#111820;color:#e5eaf0;font:17px system-ui;max-width:650px;margin:8vh auto;padding:24px;line-height:1.7}input,button{padding:14px;font:inherit;border-radius:6px}input{width:90%;margin:12px 0}button{background:#e4aa73;border:0}a{color:#9cc9ef}</style><h1>Connect Gemini</h1><p>"""
        + (
            "A key is saved. Enter a new key to replace it."
            if configured
            else "Add your Gemini API key to enable research chat."
        )
        + """</p><ol><li>Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio API keys</a> and sign in.</li><li>Create a key for a Google Cloud project. Review the provider’s usage terms and billing settings.</li><li>Paste it below. FireSight encrypts the key on its server. Research context and relevant document text are sent to Gemini when you ask a question.</li></ol><form method="post" action="/setup"><label for="key">Gemini API key</label><input id="key" name="key" type="password" required autocomplete="off"><button>Save encrypted key</button></form><p><a href="/">Open FireSight</a></p></html>"""
    )


@app.post("/setup")
async def save_key(request: Request):
    form = await request.form()
    key = str(form.get("key", "")).strip()
    if len(key) < 20 or len(key) > 300:
        raise HTTPException(422, "Enter a valid Gemini API key.")
    setting("gemini_key", cipher.encrypt(key.encode()).decode())
    if form.get("embedded"):
        return HTMLResponse(
            "<script>parent.postMessage('firesight-key-saved', location.origin)</script><p>Gemini is connected. You can return to your research.</p>"
        )
    return RedirectResponse("/setup", 303)


def page(items, request):
    try:
        start = max(0, int(request.query_params.get("cursor", "0")))
        limit = min(100, max(1, int(request.query_params.get("limit", "100"))))
    except ValueError:
        raise HTTPException(422, "Invalid pagination")
    return {
        "items": items[start : start + limit],
        "nextCursor": str(start + limit) if start + limit < len(items) else None,
    }


def revision(body):
    config = body.get("configuration", MODEL["defaults"])
    if config.get("sequenceId") not in ("reference", "offset"):
        raise HTTPException(422, "Unsupported demonstration sequence")
    return {
        "id": uid(),
        "number": 1,
        "createdAt": now(),
        "modelId": MODEL["id"],
        "modelVersion": MODEL["version"],
        "configuration": config,
        "configurationDigest": hashlib.sha256(
            json.dumps(config, separators=(",", ":")).encode()
        ).hexdigest(),
    }


@app.get("/api/v1/{path:path}")
def read(path: str, request: Request):
    parts = path.split("/")
    kind = parts[0]
    if kind == "resources":
        study = next(
            (s for s in CAT["studies"] if len(parts) > 1 and s["id"] == parts[1]), None
        )
        if len(parts) == 1:
            result = page(CAT["studies"], request)
        elif len(parts) == 3:
            result = {
                "status": "unavailable",
                "reason": "Open a BASS-inspired illustrative experiment from the Lab. Recorded frames are not connected.",
            }
        elif study:
            result = study
        else:
            raise HTTPException(404, "Study not found")
    elif kind == "datasets":
        if len(parts) < 2 or parts[1] != CAT["dataset"]["id"]:
            raise HTTPException(404, "Dataset not found")
        result = page(CAT["rows"], request) if len(parts) == 3 else CAT["dataset"]
    elif kind == "simulation-models":
        if len(parts) > 1 and parts[1] != MODEL["id"]:
            raise HTTPException(404, "Model not found")
        result = page([MODEL], request) if len(parts) == 1 else MODEL
    elif kind == "simulation-runs" and len(parts) == 3 and parts[2] == "frames":
        run = get(kind, parts[1])
        bundle = json.loads((ROOT / f"data/{run['sequenceId']}.json").read_text())
        frames = [
            dict(
                frame,
                runId=run["id"],
                revisionId=run["revisionId"],
                modelVersion=run["modelVersion"],
                field={
                    "id": "illustrative-scalar",
                    "label": "Illustrative scalar",
                    "unit": "dimensionless",
                    "domain": [0, 1],
                    "spatialRank": 3,
                    "coordinateUnit": "dimensionless",
                },
            )
            for frame in bundle["frames"]
        ]
        result = page(frames if run["status"] == "completed" else [], request)
    elif kind == "simulation-sessions" and len(parts) == 3:
        result = page(
            [r for r in listing("simulation-runs") if r["sessionId"] == parts[1]],
            request,
        )
    elif kind == "lab" and len(parts) > 1 and parts[1] == "sessions":
        result = (
            get("labs", parts[2]) if len(parts) > 2 else page(listing("labs"), request)
        )
    elif kind in (
        "conversations",
        "simulation-sessions",
        "simulation-runs",
        "simulation-contexts",
    ):
        result = get(kind, parts[1]) if len(parts) > 1 else page(listing(kind), request)
    else:
        raise HTTPException(404, "API route not found")
    return {"data": result}


@app.post("/api/v1/files")
async def upload(file: UploadFile = File(...)):
    content = await file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(413, "File exceeds 10 MiB")
    extension = Path(file.filename or "").suffix.lower()
    if extension not in (".pdf", ".txt", ".csv", ".json"):
        raise HTTPException(415, "Choose PDF, TXT, CSV or JSON")
    try:
        if extension == ".pdf":
            import io

            reader = PdfReader(io.BytesIO(content))
            if len(reader.pages) > 200:
                raise ValueError("Too many pages")
            text = "\n".join(
                f"Page {i + 1}: {page.extract_text()}"
                for i, page in enumerate(reader.pages)
            )
        else:
            text = content.decode("utf-8")
        if not text.strip():
            raise ValueError("No text")
    except Exception:
        raise HTTPException(
            422, "Text could not be extracted. Use a readable text document."
        )
    record = {
        "id": uid(),
        "name": file.filename,
        "mediaType": file.content_type,
        "byteSize": len(content),
        "text": text[:200000],
    }
    put("files", record)
    return {"data": {k: v for k, v in record.items() if k != "text"}}


@app.post("/api/v1/{path:path}")
async def create(path: str, request: Request):
    raw = await request.body()
    try:
        body = json.loads(raw) if raw else {}
    except ValueError:
        raise HTTPException(422, "Invalid JSON")
    if not isinstance(body, dict):
        raise HTTPException(422, "Expected an object")
    parts = path.split("/")
    kind = parts[0]
    if kind == "simulation-runs" and len(parts) == 3:
        return {"data": get(kind, parts[1])}
    if kind == "conversations" and len(parts) == 3 and parts[2] == "messages":
        return {"data": await message(parts[1], body)}
    if kind == "simulation-sessions" and len(parts) == 3 and parts[2] == "runs":
        session = get(kind, parts[1])
        rev = next(
            (r for r in session["revisions"] if r["id"] == body.get("revisionId")), None
        )
        if not rev:
            raise HTTPException(422, "Unknown configuration revision")
        operation = request.headers.get("idempotency-key")
        existing = next(
            (
                r
                for r in listing("simulation-runs")
                if r.get("operationId") == operation and operation
            ),
            None,
        )
        if existing:
            return {"data": existing}
        record = {
            "id": uid(),
            "sessionId": session["id"],
            "revisionId": rev["id"],
            "modelId": rev["modelId"],
            "modelVersion": rev["modelVersion"],
            "configurationDigest": rev["configurationDigest"],
            "status": "completed",
            "origin": "illustrative",
            "createdAt": now(),
            "updatedAt": now(),
            "completedAt": now(),
            "error": None,
            "warnings": [],
            "provenance": MODEL["provenance"],
            "fixtureId": rev["configuration"]["sequenceId"],
            "sequenceId": rev["configuration"]["sequenceId"],
            "demoOutcome": None,
            "operationId": operation,
        }
        return {"data": put("simulation-runs", record)}
    if kind in ("conversations", "simulation-sessions") and len(parts) == 1:
        if (
            not isinstance(body.get("title"), str)
            or not 1 <= len(body["title"].strip()) <= 300
        ):
            raise HTTPException(422, "Title must contain 1–300 characters")
    if kind == "conversations" and not isinstance(body.get("context"), dict):
        raise HTTPException(422, "Research context is required")
    if kind == "simulation-contexts":
        record = dict(body, id=uid(), capturedAt=now())
    elif kind == "simulation-sessions":
        record = {
            "id": uid(),
            "schemaVersion": "simulation.v1",
            "title": body["title"],
            "notes": "",
            "version": 1,
            "createdAt": now(),
            "updatedAt": now(),
            "modelId": MODEL["id"],
            "modelVersion": MODEL["version"],
            "studyIds": body.get("studyIds", []),
            "parent": body.get("parent"),
            "revisions": [revision(body)],
        }
    elif kind == "conversations":
        record = {
            "id": uid(),
            "title": body["title"],
            "createdAt": now(),
            "updatedAt": now(),
            "revision": 1,
            "context": body["context"],
            "messages": [],
            "example": False,
        }
    elif path == "lab/sessions":
        kind = "labs"
        record = dict(
            body,
            id=uid(),
            createdAt=now(),
            updatedAt=now(),
            revision=1,
            selectedRowIds=[],
            snapshots=[],
        )
    else:
        raise HTTPException(404, "API route not found")
    operation = request.headers.get("idempotency-key")
    if operation:
        if len(operation) > 128:
            raise HTTPException(422, "Idempotency key is too long")
        fingerprint = hashlib.sha256(
            json.dumps(body, sort_keys=True).encode()
        ).hexdigest()
        with db() as connection:
            connection.execute("BEGIN IMMEDIATE")
            receipt = connection.execute(
                "SELECT payload FROM records WHERE kind=? AND id=?",
                ("operations", operation),
            ).fetchone()
            if receipt:
                receipt = json.loads(receipt[0])
                if receipt["kind"] != kind or receipt["fingerprint"] != fingerprint:
                    raise HTTPException(
                        409, "This request key was already used for another operation"
                    )
                existing = connection.execute(
                    "SELECT payload FROM records WHERE kind=? AND id=?",
                    (kind, receipt["id"]),
                ).fetchone()
                if not existing:
                    raise HTTPException(
                        409, "The original record was removed. Start a new operation."
                    )
                return {"data": json.loads(existing[0])}
            connection.execute(
                "INSERT INTO records VALUES (?,?,?)",
                (kind, record["id"], json.dumps(record)),
            )
            connection.execute(
                "INSERT INTO records VALUES (?,?,?)",
                (
                    "operations",
                    operation,
                    json.dumps(
                        {"kind": kind, "id": record["id"], "fingerprint": fingerprint}
                    ),
                ),
            )
        return {"data": record}
    return {"data": put(kind, record)}


@app.patch("/api/v1/{path:path}")
async def update(path: str, request: Request):
    body = await request.json()
    parts = path.split("/")
    kind = "labs" if parts[0] == "lab" else parts[0]
    key = parts[-1]
    with db() as connection:
        connection.execute("BEGIN IMMEDIATE")
        row = connection.execute(
            "SELECT payload FROM records WHERE kind=? AND id=?", (kind, key)
        ).fetchone()
        if not row:
            raise HTTPException(404, "Record not found")
        record = json.loads(row[0])
        version = "version" if kind == "simulation-sessions" else "revision"
        if body.get(version) != record[version]:
            raise HTTPException(409, "Record changed. Reload before saving.")
        for field in ("title", "notes"):
            if field in body:
                record[field] = body[field]
        if (
            kind == "simulation-sessions"
            and body.get("configuration")
            and body["configuration"] != record["revisions"][-1]["configuration"]
        ):
            rev = revision(body)
            rev["number"] = len(record["revisions"]) + 1
            record["revisions"].append(rev)
        if kind == "labs":
            for field in ("context", "visualization", "selectedRowIds"):
                if field in body:
                    record[field] = body[field]
            if body.get("appendSnapshot"):
                record["snapshots"].append(body["appendSnapshot"])
        record[version] += 1
        record["updatedAt"] = now()
        connection.execute(
            "UPDATE records SET payload=? WHERE kind=? AND id=?",
            (json.dumps(record), kind, key),
        )
    return {"data": record}


@app.delete("/api/v1/conversations/{key}", status_code=204)
def delete(key: str, request: Request):
    with db() as connection:
        row = connection.execute(
            "SELECT payload FROM records WHERE kind=? AND id=?", ("conversations", key)
        ).fetchone()
        if (
            row
            and request.headers.get("if-match") != f'"{json.loads(row[0])["revision"]}"'
        ):
            raise HTTPException(409, "Conversation changed")
        connection.execute(
            "DELETE FROM records WHERE kind=? AND id=?", ("conversations", key)
        )


_conversation_locks = WeakValueDictionary()


async def message(key, body):
    body = research.validate_message(body)
    lock_key = (auth.account_id.get(), key)
    lock = _conversation_locks.setdefault(lock_key, asyncio.Lock())
    async with lock:
        return await complete_message(key, body)


async def complete_message(key, body):
    saved = get("conversations", key)
    existing = next(
        (m for m in saved["messages"] if m["id"] == body["clientMessageId"]), None
    )
    if existing:
        if existing["markdown"] != body["text"]:
            raise HTTPException(
                409, "This message ID was already used for another question"
            )
        index = saved["messages"].index(existing)
        return {
            "userMessage": existing,
            "assistantMessage": saved["messages"][index + 1],
            "conversationRevision": saved["revision"],
        }
    if (
        not isinstance(body.get("text"), str)
        or not 1 <= len(body["text"].strip()) <= 12000
    ):
        raise HTTPException(422, "Question must contain 1–12000 characters")
    if saved["revision"] != body["revision"]:
        raise HTTPException(409, "Conversation changed. Reload.")
    encrypted = setting("gemini_key")
    if not encrypted:
        raise HTTPException(503, "Connect Gemini at /setup to enable AI research chat.")
    context, selected = research.select_studies(CAT["studies"], saved, body)
    file_ids = list(body["fileIds"])
    # Earlier documents remain available to follow-up questions after the composer clears.
    for previous in saved["messages"][-20:]:
        for attachment in previous.get("attachments", []):
            identity = attachment.get("serverFileId")
            if identity and identity not in file_ids:
                file_ids.append(identity)
    files = [get("files", file_id) for file_id in file_ids[:8]]
    payload, notes = research.build_request(saved, body, context, selected, files)
    answer, model = await research.generate(
        cipher.decrypt(encrypted.encode()).decode(), payload
    )

    def entry(role, text, identity):
        return {
            "id": identity,
            "role": role,
            "generation": "user" if role == "user" else "backend",
            "createdAt": now(),
            "status": "complete",
            "markdown": text,
            "studyIds": context.get("studyIds", []),
            "attachments": [],
            "context": context,
            "evidence": [],
        }

    user = entry("user", body["text"], body["clientMessageId"])
    assistant = entry("assistant", answer, uid())
    user["attachments"] = [
        {
            "id": f["id"],
            "name": f["name"],
            "mediaType": f["mediaType"],
            "byteSize": f["byteSize"],
            "status": "uploaded",
            "serverFileId": f["id"],
            "error": None,
        }
        for f in files
        if f["id"] in body["fileIds"]
    ]
    assistant["modelId"] = model
    assistant["evidence"] = []
    for study in selected:
        for source in study["sources"]:
            if not source.get("url") or source["url"] not in answer:
                continue
            supporting = [note for note in notes if note["sourceUrl"] == source["url"]]
            assistant["evidence"].append(
                {
                    "id": uid(),
                    "classification": "interpretation",
                    "studyId": study["id"],
                    "experimentName": study["title"],
                    "source": source,
                    "passage": " ".join(note["text"] for note in supporting)
                    or study["objective"],
                    "passageKind": "paraphrase",
                    "measurement": None,
                    "studySectionId": None,
                    "provenanceStatus": "partial",
                    "uncertainty": None,
                    "limitations": [note["limitations"] for note in supporting]
                    or ["Investigation overview; quantitative data are not connected."],
                }
            )
    with db() as connection:
        connection.execute("BEGIN IMMEDIATE")
        row = connection.execute(
            "SELECT payload FROM records WHERE kind=? AND id=?",
            ("conversations", key),
        ).fetchone()
        if not row:
            raise HTTPException(404, "Conversation was removed during generation")
        current = json.loads(row[0])
        if current["revision"] != saved["revision"]:
            raise HTTPException(409, "Conversation changed during generation. Reload.")
        current["messages"] += [user, assistant]
        current["context"] = context
        current["revision"] += 1
        current["updatedAt"] = now()
        connection.execute(
            "UPDATE records SET payload=? WHERE kind=? AND id=?",
            (json.dumps(current), "conversations", key),
        )
    return {
        "userMessage": user,
        "assistantMessage": assistant,
        "conversationRevision": current["revision"],
    }


app.mount("/public", StaticFiles(directory=ROOT / "public"), name="public")


@app.get("/welcome")
def welcome():
    return FileResponse(ROOT / "public/landing.html")


DIST = Path(os.getenv("FRONTEND_DIST", str(ROOT.parent / "frontend/dist")))
if (DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")


@app.get("/{path:path}")
def frontend(path: str, request: Request):
    if not path and auth.enabled() and not auth.identity(request):
        return FileResponse(ROOT / "public/landing.html")
    target = (DIST / path).resolve()
    if target.is_relative_to(DIST.resolve()) and target.is_file():
        return FileResponse(target)
    return FileResponse(DIST / "index.html")
