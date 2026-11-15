import unittest
from unittest.mock import AsyncMock, patch
import httpx
from fastapi import HTTPException
from fastapi.testclient import TestClient
from backend.app import app, setting, cipher
from backend import research


class ResearchChatTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.context = {"studyIds": ["flex"], "datasetIds": [], "labSnapshot": None}
        self.conversation = self.client.post(
            "/api/v1/conversations",
            json={"title": "FLEX regression", "context": self.context},
        ).json()["data"]
        setting("gemini_key", cipher.encrypt(b"test-key").decode())

    def send(self, text, revision, identity, files=None, context=None):
        return self.client.post(
            "/api/v1/conversations/" + self.conversation["id"] + "/messages",
            json={
                "text": text,
                "revision": revision,
                "clientMessageId": identity,
                "context": context or self.context,
                "fileIds": files or [],
            },
        )

    def test_follow_up_keeps_turns_sources_documents_and_context(self):
        file = self.client.post(
            "/api/v1/files",
            files={
                "file": (
                    "notes.txt",
                    b"The user is interested in droplet extinction.",
                    "text/plain",
                )
            },
        ).json()["data"]
        source = research.NOTES[0]["sourceUrl"]
        generated = AsyncMock(
            side_effect=[
                ("FLEX studies inert-gas suppression. " + source, "test-model"),
                ("The droplet provides a controlled geometry. " + source, "test-model"),
            ]
        )
        with patch("backend.research.generate", generated):
            first = self.send(
                "How does FLEX approach fire suppression?", 1, "first", [file["id"]]
            )
            self.assertEqual(first.status_code, 200)
            self.assertEqual(
                first.json()["data"]["userMessage"]["attachments"][0]["serverFileId"],
                file["id"],
            )
            follow = self.send(
                "explain it more",
                2,
                "follow",
                context={"studyIds": [], "datasetIds": [], "labSnapshot": None},
            )
            self.assertEqual(follow.status_code, 200)
            payload = generated.call_args.args[1]
            self.assertEqual(
                [turn["role"] for turn in payload["contents"]],
                ["user", "model", "user"],
            )
            self.assertIn("droplet", payload["contents"][-1]["parts"][0]["text"])
            self.assertIn("researchNotes", payload["contents"][-1]["parts"][0]["text"])
            self.assertEqual(
                follow.json()["data"]["assistantMessage"]["studyIds"], ["flex"]
            )
            self.assertTrue(follow.json()["data"]["assistantMessage"]["evidence"])
            replay = self.send("explain it more", 2, "follow")
            self.assertEqual(
                replay.json()["data"]["assistantMessage"]["id"],
                follow.json()["data"]["assistantMessage"]["id"],
            )
            self.assertEqual(generated.await_count, 2)

    def test_invalid_message_and_provider_failure_leave_history_unchanged(self):
        self.assertEqual(self.send("", 1, "empty").status_code, 422)
        with patch(
            "backend.research.generate",
            AsyncMock(side_effect=HTTPException(429, "Quota exhausted")),
        ):
            self.assertEqual(self.send("Explain FLEX", 1, "error").status_code, 429)
        saved = self.client.get(
            "/api/v1/conversations/" + self.conversation["id"]
        ).json()["data"]
        self.assertEqual(saved["revision"], 1)
        self.assertEqual(saved["messages"], [])

    def test_creation_is_idempotent_and_payload_mismatch_rejected(self):
        import uuid

        headers = {"Idempotency-Key": str(uuid.uuid4())}
        body = {"title": "Retry", "context": self.context}
        first = self.client.post(
            "/api/v1/conversations", json=body, headers=headers
        ).json()["data"]
        again = self.client.post(
            "/api/v1/conversations", json=body, headers=headers
        ).json()["data"]
        self.assertEqual(first["id"], again["id"])
        self.assertEqual(
            self.client.post(
                "/api/v1/conversations",
                json={**body, "title": "Other"},
                headers=headers,
            ).status_code,
            409,
        )


class GeminiTransportTest(unittest.IsolatedAsyncioTestCase):
    async def test_multiple_text_parts_and_retry(self):
        responses = [
            httpx.Response(503),
            httpx.Response(
                200,
                json={
                    "candidates": [
                        {
                            "content": {
                                "parts": [
                                    {"thought": True, "text": "hidden"},
                                    {"text": "Answer one"},
                                    {"text": "Answer two"},
                                ]
                            },
                            "finishReason": "STOP",
                        }
                    ]
                },
            ),
        ]
        with (
            patch("httpx.AsyncClient.post", AsyncMock(side_effect=responses)),
            patch("backend.research.asyncio.sleep", AsyncMock()),
        ):
            answer, model = await research.generate("test-key", {})
        self.assertEqual(answer, "Answer one\nAnswer two")

    async def test_key_and_quota_errors_are_actionable(self):
        for status, expected in [(403, "key"), (429, "quota"), (404, "model")]:
            with (
                patch(
                    "httpx.AsyncClient.post",
                    AsyncMock(return_value=httpx.Response(status)),
                ),
                patch("backend.research.asyncio.sleep", AsyncMock()),
            ):
                with self.assertRaises(HTTPException) as error:
                    await research.generate("test-key", {})
                self.assertIn(expected, error.exception.detail.lower())
