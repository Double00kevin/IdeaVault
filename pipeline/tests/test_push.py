"""Tests for the push module."""

import hashlib
import hmac
import json

from pipeline.push.cloudflare import _generate_signature


class TestGenerateSignature:
    def test_deterministic(self):
        payload = b'{"test": true}'
        secret = "test-secret-123"

        sig1 = _generate_signature(payload, secret)
        sig2 = _generate_signature(payload, secret)
        assert sig1 == sig2

    def test_matches_manual_hmac(self):
        payload = b'{"ideas": []}'
        secret = "my-secret"

        expected = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256,
        ).hexdigest()

        result = _generate_signature(payload, secret)
        assert result == expected

    def test_different_secrets_different_signatures(self):
        payload = b'{"test": true}'

        sig1 = _generate_signature(payload, "secret-a")
        sig2 = _generate_signature(payload, "secret-b")
        assert sig1 != sig2
