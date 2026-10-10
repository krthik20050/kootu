# Deterministic destination-cluster matching

Implemented in `services/matching.py` and `services/rides.py`. Default pilot: at least two distinct requests, up to 4 passenger seats and 4 luggage pieces, a 3000m cluster, and each passenger's own 5–120 minute maximum wait. These are configurable product choices, not competitor benchmarks.

1. Validate a confirmed flight arrival and a precise WGS84 destination pin. Party counts include everyone in that request.
2. Require seed readiness within the configurable dispatch horizon (30 minutes by default). Retrieve up to 100 WAITING requests at the same airport through indexed PostGIS geography `ST_DWithin`. Before the limit, exclude the seed account, incompatible women-only policy, non-overlapping/expired wait windows, out-of-horizon readiness and pairs exceeding policy seats/luggage.
3. Consider up to 30 approved/available vehicles. Order candidates by same flight/date first, absolute ready-time difference, geodesic distance and stable ID.
4. Greedily add a candidate only if every member remains compatible: distinct booking accounts, whole-cluster pair distances, airport, women-only policy, overlapping wait intervals, total seats/luggage, actual wheelchair/child-seat spaces, pet policy and driver eligibility. An unsupported candidate does not block a later feasible one.
5. Rebuild against the selected vehicle's immutable capacity snapshot, verifying each added destination pair in both road directions through Google Routes. Skip road-incompatible candidates and consider later alternatives. Reuse directed checks within the attempt; the budget is `max(12, max_group_seats * (max_group_seats - 1))`. Unverified candidates cannot join after budget exhaustion. A route outage does not permit a proposal.
6. Reacquire request/driver/vehicle locks, revalidate request versions and availability, create a group, memberships and expiring offers to a bounded eligible fleet atomically. A proposal is not a confirmed ride.
7. Acceptance rechecks state/time/capacity, locks assignment and reserves driver/vehicle. Database unique indexes forbid two active trips for either.

The shared departure is `max(now, all ready times)`. It must not exceed any member's `ready_at + max_wait_minutes`; no averaged wait can override an individual limit. Whole-cluster checking prevents a chain of neighbouring destinations exceeding the cluster diameter, but does not prove a short total trip. The default four-seat policy allows at most 12 directed routing calls per attempt, including rejected alternatives.

The heuristic is bounded and deterministic, not a globally optimal fare or route solver. It does not estimate savings, quote fares, optimize actual stop order, or promise an available cab. The assigned driver receives drop-off pins after acceptance. Matching users get explicit waiting states if no suitable fleet/group exists.

Automatic attempts rotate by last attempt time, excluding expired and far-future requests; failed/empty flight lookups also advance an independent attempt timestamp. This prevents a fixed failing prefix from monopolizing each bounded cycle. See [research, risks and staged architecture plan](backend-research-and-plan.md) for limits and future route-duration work.

## Changes after a proposal

Passenger cancellation before departure removes that request. Proposed groups are withdrawn/requeued; an assigned group can continue if at least two distinct requests remain. Smaller groups are dissolved, pending/accepted offers withdrawn and the driver/vehicle released. Started/completed trips reject self-service cancellation and require operator assistance.

Confirmed flight delays update readiness from a baseline. A feasible group's departure moves; an infeasible group is dissolved and waiting members are eligible for later matching. Cancelled/diverted/incident flights set FLIGHT_CANCELLED for the affected request. Expired or rejected offers are released by maintenance. Flights after trip start do not reshuffle a moving cab.

## Regression cases

Tests cover same-flight preference, alternate-flight compatibility, different airports, whole-cluster diameter, road mismatch, wait boundary, capacity, women-only separation, required equipment, approval/availability, cancellation, repeated flight delay, missing estimate, expiry, duplicate membership and concurrent acceptance. Fixtures replace external providers only in tests; production always uses configured adapters.

Assigned drivers can release a group before departure if they can no longer serve it. Requests return to waiting and that driver/vehicle go unavailable. Started/completed groups reject release. Offers are sent to up to 30 fitting fleet entries, at most one vehicle per driver; one acceptance withdraws competing offers. Consistent group-first locks serialize competing acceptances.
