"""Account authentication and Google OAuth for the shared application host."""

import hashlib
import html
import json
import os
import secrets
import sqlite3
import time
from contextvars import ContextVar
from contextlib import contextmanager
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse

account_id = ContextVar("account_id", default=None)
router = APIRouter()
storage = None
cipher = None


@contextmanager
def accounts():
    connection = sqlite3.connect(storage / "accounts.db", timeout=15)
    connection.execute(
        "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT UNIQUE,password TEXT,google_sub TEXT UNIQUE)"
    )
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def configure(directory, encryption):
    global storage, cipher
    storage, cipher = directory, encryption
    with accounts() as connection:
        connection.execute("SELECT 1")


def enabled():
    return (
        os.getenv(
            "FIRESIGHT_ACCOUNTS", "1" if os.getenv("RAILWAY_PUBLIC_DOMAIN") else "0"
        )
        == "1"
    )


def identity(request):
    try:
        data = json.loads(
            cipher.decrypt(
                request.cookies.get("firesight_session", "").encode(), ttl=604800
            )
        )
        if data["id"] == "legacy":
            return "legacy"
        with accounts() as connection:
            return (
                data["id"]
                if connection.execute(
                    "SELECT id FROM users WHERE id=?", (data["id"],)
                ).fetchone()
                else None
            )
    except Exception:
        return None


def login_response(user, welcome=False):
    response = RedirectResponse("/?configure=1" if welcome else "/", 303)
    response.set_cookie(
        "firesight_session",
        cipher.encrypt(json.dumps({"id": user}).encode()).decode(),
        httponly=True,
        secure=bool(os.getenv("RAILWAY_PUBLIC_DOMAIN")),
        samesite="lax",
        max_age=604800,
    )
    return response


def auth_page(register=False, error=""):
    title = "Create your account" if register else "Welcome back"
    target = "register" if register else "login"
    google = (
        '<a class="google" href="/auth/google">Continue with Google</a><div class="divider">or use your email</div>'
        if os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET")
        else ""
    )
    from pathlib import Path

    template = Path(__file__).parent / "public/auth.html"
    values = {
        "title": title,
        "intro": "Create a workspace for your research and experiments."
        if register
        else "Sign in to pick up your research where you left off.",
        "target": target,
        "error": f'<p class="error" role="alert">{html.escape(error)}</p>'
        if error
        else "",
        "google": google,
        "autocomplete": "new-password" if register else "current-password",
        "minlength": 'minlength="10"' if register else "",
        "password_placeholder": "Create a strong password"
        if register
        else "Enter your password",
        "hint": '<p class="form-hint">Use at least 10 characters.</p>'
        if register
        else "",
        "submit": "Create account" if register else "Sign in",
        "switch": 'Already have an account? <a href="/login">Sign in</a>'
        if register
        else 'New to Fire-XII? <a href="/register">Create an account</a>',
        "footnote": "You’ll be invited to connect your Gemini API key after registration. You can also set it up later."
        if register
        else "Your research is saved to your account. Your Gemini API key is encrypted on the server.",
    }
    markup = template.read_text()
    for name, value in values.items():
        markup = markup.replace("{{" + name + "}}", value)
    return HTMLResponse(markup)


@router.get("/login")
def login_page():
    return auth_page()


@router.get("/register")
def register_page():
    return auth_page(True)


def password_hash(password, salt):
    return hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1).hex()


@router.post("/auth/login")
@router.post("/auth/register")
async def credentials(request: Request):
    action = request.url.path.rsplit("/", 1)[-1]
    if action not in ("login", "register"):
        raise HTTPException(404)
    form = await request.form()
    email = str(form.get("email", "")).strip().lower()
    password = str(form.get("password", ""))
    if len(password) > 128 or len(email) > 254 or "@" not in email:
        return auth_page(action == "register", "Enter a valid email and password.")
    with accounts() as connection:
        if action == "register":
            if len(password) < 10:
                return auth_page(True, "Use a password with at least 10 characters.")
            salt = secrets.token_bytes(16)
            user = secrets.token_hex(16)
            try:
                connection.execute(
                    "INSERT INTO users VALUES (?,?,?,NULL)",
                    (user, email, salt.hex() + ":" + password_hash(password, salt)),
                )
                connection.commit()
            except sqlite3.IntegrityError:
                return auth_page(
                    True, "This email already has an account. Sign in to continue."
                )
            return login_response(user, True)
        row = connection.execute(
            "SELECT id,password FROM users WHERE email=?", (email,)
        ).fetchone()
        if row and row[1]:
            salt, expected = row[1].split(":")
            if secrets.compare_digest(
                password_hash(password, bytes.fromhex(salt)), expected
            ):
                return login_response(row[0])
        return auth_page(False, "Email or password is incorrect.")


@router.post("/auth/logout")
def logout():
    response = RedirectResponse("/login", 303)
    response.delete_cookie("firesight_session")
    return response


@router.get("/auth/me")
def me(request: Request):
    user = identity(request)
    return {"authenticated": bool(user)}


@router.get("/auth/google")
def google(request: Request):
    if not os.getenv("GOOGLE_CLIENT_ID") or not os.getenv("GOOGLE_CLIENT_SECRET"):
        return auth_page(
            error="Google sign-in is being configured. Use email to continue."
        )
    state = secrets.token_urlsafe(32)
    redirect_uri = (
        "https://" + os.environ["RAILWAY_PUBLIC_DOMAIN"] + "/auth/google/callback"
    )
    response = RedirectResponse(
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + urlencode(
            {
                "client_id": os.environ["GOOGLE_CLIENT_ID"],
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "openid email profile",
                "state": state,
            }
        ),
        303,
    )
    response.set_cookie(
        "oauth_state", state, httponly=True, secure=True, samesite="lax", max_age=600
    )
    return response


@router.get("/auth/google/callback")
async def google_callback(request: Request):
    state = request.cookies.get("oauth_state", "")
    if not state or not secrets.compare_digest(
        state, request.query_params.get("state", "")
    ):
        return auth_page(error="Google sign-in expired. Please try again.")
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            token = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": request.query_params.get("code", ""),
                    "client_id": os.environ["GOOGLE_CLIENT_ID"],
                    "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
                    "redirect_uri": "https://"
                    + os.environ["RAILWAY_PUBLIC_DOMAIN"]
                    + "/auth/google/callback",
                    "grant_type": "authorization_code",
                },
            )
            token.raise_for_status()
            info = await client.get(
                "https://openidconnect.googleapis.com/v1/userinfo",
                headers={"Authorization": "Bearer " + token.json()["access_token"]},
            )
            info.raise_for_status()
            profile = info.json()
        if not profile.get("email_verified"):
            raise ValueError("Unverified email")
        with accounts() as connection:
            row = connection.execute(
                "SELECT id FROM users WHERE google_sub=?", (profile["sub"],)
            ).fetchone()
            welcome = not row
            if row:
                user = row[0]
            else:
                # Require password sign-in for existing accounts before linking identities.
                if connection.execute(
                    "SELECT id FROM users WHERE email=?", (profile["email"].lower(),)
                ).fetchone():
                    return auth_page(
                        error="This email already has a password account. Sign in with your password."
                    )
                user = secrets.token_hex(16)
                connection.execute(
                    "INSERT INTO users VALUES (?,?,NULL,?)",
                    (user, profile["email"].lower(), profile["sub"]),
                )
                connection.commit()
        response = login_response(user, welcome)
        response.delete_cookie("oauth_state")
        return response
    except Exception:
        return auth_page(
            error="Google sign-in could not finish. Please try again or use email."
        )
