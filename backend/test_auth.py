import os
import secrets
import unittest
from fastapi.testclient import TestClient
from backend.app import app


class AccountsTest(unittest.TestCase):
    def test_registration_login_and_isolation(self):
        os.environ["FIRESIGHT_ACCOUNTS"] = "1"
        try:
            alice, bob = TestClient(app), TestClient(app)
            self.assertEqual(alice.get("/api/v1/conversations").status_code, 401)
            email = secrets.token_hex(8) + "@example.com"
            response = alice.post(
                "/auth/register",
                data={"email": email, "password": "secure-password"},
                follow_redirects=False,
            )
            self.assertEqual(response.status_code, 303)
            self.assertIn("configure=1", response.headers["location"])
            self.assertIn("HttpOnly", response.headers["set-cookie"])
            context = {"studyIds": [], "datasetIds": [], "labSnapshot": None}
            record = alice.post(
                "/api/v1/conversations",
                json={"title": "Private notebook", "context": context},
            ).json()["data"]
            bob.post(
                "/auth/register",
                data={
                    "email": secrets.token_hex(8) + "@example.com",
                    "password": "secure-password",
                },
                follow_redirects=False,
            )
            self.assertEqual(
                bob.get("/api/v1/conversations/" + record["id"]).status_code, 404
            )
            self.assertEqual(
                bob.get("/api/v1/conversations").json()["data"]["items"], []
            )
            alice.post("/auth/logout", follow_redirects=False)
            self.assertEqual(alice.get("/api/v1/conversations").status_code, 401)
            alice.post(
                "/auth/login",
                data={"email": email, "password": "secure-password"},
                follow_redirects=False,
            )
            self.assertEqual(
                alice.get("/api/v1/conversations/" + record["id"]).status_code, 200
            )
            invalid = alice.get("/auth/google/callback?state=invalid")
            self.assertIn("expired", invalid.text)
        finally:
            del os.environ["FIRESIGHT_ACCOUNTS"]
