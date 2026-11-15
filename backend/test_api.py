import os
import tempfile
import unittest
import hashlib

_storage = tempfile.TemporaryDirectory()
os.environ["DATA_DIR"] = _storage.name
from fastapi.testclient import TestClient
from backend.app import app, setting, cipher, MODEL


class ApiTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_key_encrypted_and_not_returned(self):
        key = "test-provider-key-never-send-" + "x" * 20
        response = self.client.post("/setup", data={"key": key})
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(key, response.text)
        self.assertNotIn(key, setting("gemini_key"))
        self.assertEqual(cipher.decrypt(setting("gemini_key").encode()).decode(), key)
        self.assertEqual(response.headers["cache-control"], "no-store")

    def test_auth_and_cross_origin(self):
        os.environ["FIRESIGHT_PASSWORD_HASH"] = hashlib.scrypt(
            b"test-password", salt=b"firesight-login-v1", n=16384, r=8, p=1
        ).hex()
        try:
            self.assertEqual(self.client.get("/setup").status_code, 401)
            self.assertEqual(self.client.get("/health").status_code, 200)
            self.assertEqual(
                self.client.get(
                    "/setup", auth=("firesight", "test-password")
                ).status_code,
                200,
            )
            self.assertEqual(
                self.client.post(
                    "/setup",
                    auth=("firesight", "test-password"),
                    headers={"Origin": "https://other.test"},
                    data={"key": "x" * 25},
                ).status_code,
                403,
            )
        finally:
            del os.environ["FIRESIGHT_PASSWORD_HASH"]

    def test_saved_run_and_revision_conflict(self):
        session = self.client.post(
            "/api/v1/simulation-sessions",
            json={"title": "Test experiment", "configuration": MODEL["defaults"]},
        ).json()["data"]
        self.assertEqual(
            self.client.get("/api/v1/simulation-sessions/" + session["id"]).json()[
                "data"
            ],
            session,
        )
        endpoint = "/api/v1/simulation-sessions/" + session["id"] + "/runs"
        options = {
            "json": {"revisionId": session["revisions"][0]["id"]},
            "headers": {"Idempotency-Key": "test-run"},
        }
        run = self.client.post(endpoint, **options).json()["data"]
        self.assertEqual(
            self.client.post(endpoint, **options).json()["data"]["id"], run["id"]
        )
        self.assertEqual(
            len(
                self.client.get(
                    "/api/v1/simulation-runs/" + run["id"] + "/frames"
                ).json()["data"]["items"]
            ),
            9,
        )
        self.assertEqual(
            self.client.patch(
                "/api/v1/simulation-sessions/" + session["id"],
                json={"version": 0, "title": "stale"},
            ).status_code,
            409,
        )

    def test_upload_and_validation(self):
        self.assertEqual(
            self.client.post(
                "/api/v1/files",
                files={"file": ("notes.txt", b"Research notes", "text/plain")},
            ).status_code,
            200,
        )
        self.assertEqual(
            self.client.post(
                "/api/v1/files", files={"file": ("program.exe", b"not allowed")}
            ).status_code,
            415,
        )
        self.assertEqual(
            self.client.get("/api/v1/resources?cursor=invalid").status_code, 422
        )
        self.assertEqual(
            self.client.get("/api/v1/simulation-models/not-real").status_code, 404
        )
