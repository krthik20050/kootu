# Matching engine design

Status: design only. No candidate generation, optimization, spatial query, driver search or matching endpoint is implemented.

The product model is **airport → small destination cluster → shared cab**. Thrissur city/nearby destinations can form one candidate; Guruvayur should normally form another. Never group passengers because their destinations share a name or lie somewhere along one long route.

## Inputs and policy

Requests eventually contain normalized airport, flight/date, estimated passenger-ready window (arrival plus deplaning/baggage allowance), validated destination coordinates, party size, luggage needs, maximum waiting time and safety preferences. Drivers contribute verified eligibility, availability and approved vehicle capacity. Same-flight candidates are preferred for synchronized timing; nearby-flight candidates remain possible when their ready windows overlap within everyone's limit.

Product-approved configuration must define cluster radius/diameter, maximum allowed road deviation/stops, wait limits, luggage units, minimum viability and women-only eligibility including driver policy. Do not infer these values or demographic eligibility from names. Treat unavailable required data as incomplete rather than silently compatible.

## Hard constraints

- Same airport and active, non-expired requests.
- A feasible shared departure interval respecting each request's ready window and maximum wait; do not average away an individual wait violation.
- Destination proximity in metres, bounded across the entire cluster and relative to an agreed drop area. Prevent transitive neighbour chains from creating a distant multi-stop route.
- Total seats for parties and luggage within vehicle capacity; revalidate against the assigned vehicle, not an assumed cab size.
- Compatible safety preferences. Women-only groups require explicit eligibility and driver policy; ordinary groups must not absorb women-only requests.
- Available, COOTU-approved driver/vehicle before confirming assignment.
- Road detour/stops within policy when routing data is required. Straight-line distance is a candidate filter, not proof of a valid road journey.

## Soft optimization

Among feasible candidates, score waiting time, destination dispersion, estimated road detour, occupancy and estimated passenger savings. Prefer same-flight groups when otherwise viable. Normalize units and explain scores; do not claim savings without a fare model. Keep deterministic tie-breaks (ready time, creation time, stable ID), bounded candidate sizes and explicit expiration to avoid starvation. Hard constraints always outrank scores.

Start with understandable heuristics and fixtures, not a solver framework or LLM. PostGIS retrieves nearby requests; routing refines road compatibility. Policy version and evaluation reasons should eventually accompany decisions for debugging without leaking passenger details.

## Candidate flow

1. Validate request and confirmed flight details.
2. Determine ready interval and expiry.
3. Retrieve geographically compatible active requests at the same airport using PostGIS and compatible time windows.
4. Apply hard constraints, including whole-cluster spatial bounds and safety.
5. Score compatible candidates and construct a bounded candidate group.
6. Validate capacity and feasibility against a real eligible vehicle.
7. Propose/create a group transactionally, protecting against concurrent requests and duplicate membership.
8. Search eligible available drivers; send an expiring offer.
9. Accept atomically, rechecking capacity, request state and availability before assignment.

The early implementation may propose groups before a driver is available; keep proposed versus confirmed explicit. A proposal is not a guaranteed ride. Never hold a database transaction open while making a routing-provider call.

## Passenger cancellation

Update request and membership atomically → recompute remaining capacity, route and economics → determine whether group is viable → search compatible waiting passengers where still within existing riders' commitments → re-match if possible → update affected passengers/driver. An accepted driver or departed trip requires a distinct cancellation policy; do not casually move committed riders between groups.

## Flight delays and cancellations

Trusted flight update → update estimated ready windows of affected requests → reevaluate affected groups → preserve groups still feasible → re-match only incompatible members/groups → revise or withdraw pending offers → notify affected parties. Flight cancellation must distinguish cancelling the request from passenger-confirmed alternate travel. Avoid repeated reshuffling for tiny ETA changes; define policy thresholds and preserve valid accepted commitments.

## Acceptance cases for the next workstream

Test same-flight preference, compatible nearby flights, different airport rejection, Thrissur/Guruvayur separation, transitive cluster-chain rejection, road-distance mismatch, no overlapping feasible departure, one rider's wait limit, multi-passenger party capacity, luggage overflow, women-only compatibility, unapproved driver rejection, expired offer, concurrent membership/acceptance, passenger cancellation, delayed/cancelled flight and provider failure. No tests of a fake engine are included in bootstrap.
