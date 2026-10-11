import httpx2 as httpx
import pytest
from fastapi import HTTPException
from pydantic import SecretStr

from app.core.config import Settings
from app.schemas.integrations import Coordinates
from app.services import geoapify
from app.services.geoapify import GeoapifyRouting, routing_for


@pytest.fixture
def routing(monkeypatch):
    geoapify._cache.clear()
    monkeypatch.setattr(geoapify.time, "sleep", lambda seconds: None)
    return GeoapifyRouting(Settings(geoapify_api_key=SecretStr("test-key"), _env_file=None))


def transport(monkeypatch, handler):
    client = httpx.Client
    monkeypatch.setattr(
        geoapify.httpx, "Client", lambda **kw: client(transport=httpx.MockTransport(handler), **kw)
    )


def test_routing_contract_and_cache(routing, monkeypatch):
    calls = []

    def handler(request):
        calls.append(request)
        assert request.url.params["waypoints"] == "10.0,76.0|10.1,76.1"
        assert request.url.params["units"] == "metric"
        assert request.url.params["mode"] == "drive"
        return httpx.Response(200, json={"results": [{"distance": 1500, "time": 300}]})

    transport(monkeypatch, handler)
    origin, destination = (
        Coordinates(latitude=10, longitude=76),
        Coordinates(latitude=10.1, longitude=76.1),
    )
    assert routing.estimate(origin, destination).distance_metres == 1500
    assert routing.estimate(origin, destination).duration_seconds == 300
    assert len(calls) == 1
    assert isinstance(routing_for(Settings(_env_file=None)), GeoapifyRouting)


def test_search_india_filter_empty_and_valid_results(routing, monkeypatch):
    def handler(request):
        assert request.url.params["filter"] == "countrycode:in"
        if request.url.params["text"] == "unknown":
            return httpx.Response(200, json={"results": []})
        return httpx.Response(
            200,
            json={
                "results": [
                    {"formatted": "Aluva station", "place_id": "place", "lat": 10.1, "lon": 76.35}
                ]
            },
        )

    transport(monkeypatch, handler)
    assert routing.search("Aluva station")[0]["coordinates"] == {
        "latitude": 10.1,
        "longitude": 76.35,
    }
    geoapify._cache.clear()
    assert routing.search("unknown") == []


@pytest.mark.parametrize(
    "status,payload",
    [
        (429, {}),
        (401, {"secret": "do not expose"}),
        (200, {"results": [{"distance": -1, "time": 100}]}),
        (200, {"results": []}),
    ],
)
def test_provider_failure_never_fabricates_route(routing, monkeypatch, status, payload):
    transport(monkeypatch, lambda request: httpx.Response(status, json=payload))
    with pytest.raises(HTTPException) as caught:
        routing.estimate(
            Coordinates(latitude=10, longitude=76), Coordinates(latitude=11, longitude=77)
        )
    assert caught.value.status_code in {502, 503}
    assert "secret" not in caught.value.detail.lower()


def test_missing_key_is_clear():
    with pytest.raises(HTTPException) as caught:
        GeoapifyRouting(Settings(_env_file=None)).search("Aluva station")
    assert caught.value.status_code == 503
