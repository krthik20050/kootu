# Geoapify address autocomplete

Set `GEOAPIFY_API_KEY` in `backend/.env`, or `.environment/.env` before running `scripts/sync_env.py`, and restart the backend. Keep the key private; no `NEXT_PUBLIC_` setting is needed.

The chat searches after 3 characters and a 300ms pause through authenticated `GET /locations/search?q=...`. The backend calls Geoapify Address Autocomplete with `format=json`, `filter=countrycode:in`, `lang=en`, and up to 5 results. Formatted addresses, place IDs and validated latitude/longitude map into the existing location response. Selecting a result supplies the ride's drop-off coordinates. Existing per-user provider budgets apply.

Source: [Geoapify Address Autocomplete documentation](https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/). The chat displays Geoapify and OpenStreetMap attribution. Google Routes remains the road-distance provider.
