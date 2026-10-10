import json
from datetime import timedelta
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.models.domain import now


@pytest.fixture
def signing_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def signed(key, **changes):
    time = now()
    claims = {
        "iss": "https://test.clerk.accounts.dev",
        "sub": "alice",
        "azp": "http://localhost:3000",
        "iat": time,
        "nbf": time,
        "exp": time + timedelta(minutes=5),
        **changes,
    }
    return jwt.encode(claims, key, algorithm="RS256", headers={"kid": "test"})


@pytest.mark.parametrize(
    "changes",
    [
        {"iss": "https://evil.example"},
        {"azp": "https://evil.example"},
        {"exp": 0},
        {"sub": ""},
        {"nbf": 4102444800},
    ],
)
def test_invalid_jwt_rejected(signing_key, changes):
    app = create_app(
        Settings(app_env="test", clerk_issuer="https://test.clerk.accounts.dev", _env_file=None)
    )
    app.state.jwks_client = SimpleNamespace(
        get_signing_key_from_jwt=lambda token: SimpleNamespace(key=signing_key.public_key())
    )
    with TestClient(app) as client:
        assert (
            client.get(
                "/me", headers={"Authorization": "Bearer " + signed(signing_key, **changes)}
            ).status_code
            == 401
        )


def test_forged_signature_rejected(signing_key):
    app = create_app(
        Settings(app_env="test", clerk_issuer="https://test.clerk.accounts.dev", _env_file=None)
    )
    app.state.jwks_client = SimpleNamespace(
        get_signing_key_from_jwt=lambda token: SimpleNamespace(key=signing_key.public_key())
    )
    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    with TestClient(app) as client:
        assert (
            client.get("/me", headers={"Authorization": "Bearer " + signed(other)}).status_code
            == 401
        )


def test_valid_signed_jwt_role_claim_cannot_promote(client, signing_key):
    from app.core.auth import verify_token

    client.app.dependency_overrides.pop(verify_token)
    client.app.state.settings.clerk_issuer = "https://test.clerk.accounts.dev"
    # Exercise PyJWKClient selection with an actual RSA JWK, without calling an external account.
    from jwt import PyJWKClient

    jwks = PyJWKClient("https://test.clerk.accounts.dev/.well-known/jwks.json")
    jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(signing_key.public_key()))
    jwk.update(kid="test", use="sig", alg="RS256")
    jwks.fetch_data = lambda: {"keys": [jwk]}
    client.app.state.jwks_client = jwks
    response = client.get(
        "/me", headers={"Authorization": "Bearer " + signed(signing_key, role="ADMIN")}
    )
    assert response.status_code == 200
    assert response.json()["role"] == "PASSENGER"
    assert client.get("/me").status_code == 401


def test_missing_configuration_is_not_fake_success():
    with TestClient(create_app(Settings(app_env="test", _env_file=None))) as client:
        assert client.get("/me").status_code == 401
        assert client.get("/me", headers={"Authorization": "Bearer placeholder"}).status_code == 503
        assert client.get("/ready").status_code == 503
        assert not client.get("/ready").json()["provider_credentials_verified"]
