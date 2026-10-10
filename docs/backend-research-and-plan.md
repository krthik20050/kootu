# Matching backend: research, implementation and next decisions

Reviewed 11 October 2026 (IST). Scope: backend coordination, matching and PostgreSQL; frontend and ticket/speech AI are outside this change. Sources describe published designs, not access to competitors' proprietary code. No claim of zero defects, global optimality or measured production capacity is justified.

## Recommendation

Keep one modular FastAPI backend and PostgreSQL/PostGIS. Strengthen correctness and measurement before introducing microservices, a message broker or ML. Matching is a constrained allocation problem: first establish which parties and vehicles can travel together, then choose among feasible options. An AI confidence score must never override capacity, explicit preferences or individual wait limits.

The first implementation milestone is complete locally: better SQL filtering, distinct-account grouping, a dispatch horizon, bounded road-aware alternatives, fairer maintenance attempts, refreshed locked state and stronger database constraints. Deployment requires migration 202610110003 first. No frontend API contract changed.

## How matching works now

1. An authenticated passenger submits a confirmed arrival, destination coordinates, party size and explicit needs. A client UUID identifies retries of the same submission. A profile represents an account, not independently verified identity.
2. Requests persist in `passenger_requests`. Scheduled requests are accepted up to 30 days ahead, but proposals now require readiness within `DISPATCH_HORIZON_MINUTES` (default 30). This is dispatch coordination, not a guaranteed advance reservation.
3. PostgreSQL finds up to 100 nearby WAITING requests at the same airport. Before applying the limit, it excludes the seed account, incompatible women-only policy, non-overlapping wait windows, requests outside the dispatch horizon and pairs exceeding configured seats/luggage. Geography `ST_DWithin` uses metres and can use the existing GiST index.
4. Up to 30 available, approved vehicles are considered, smallest seat capacity then stable ID. Each candidate group must fit actual vehicle equipment. The first vehicle supporting a group supplies the capacity limits for this attempt; the algorithm does not optimize across the whole fleet.
5. The deterministic order is same flight/date, readiness difference, geodesic destination distance, then request ID. Candidates are added only if compatible with every existing member. Each account contributes at most one request to a group; multiple people in a party belong in its passenger count.
6. Directed Google road distances are checked while constructing the group. A road-incompatible candidate is skipped and later candidates can be considered. Successful pair checks are retained only within this attempt. The budget is `max(12, seats_limit * (seats_limit - 1))` directed lookups: 12 at the default four seats, up to 56 with eight. Budget exhaustion leaves unverified candidates out. Provider errors abort the attempt; they never authorize unverified travel.
7. Provider I/O occurs outside the read transaction. Request rows are then locked in ID order and their versions/statuses rechecked. Driver/vehicle locks refresh ORM values before availability checks. A group, memberships, offers and event are committed atomically.
8. PROPOSED means passengers fit, not a confirmed cab. An eligible driver accepts an unexpired offer; one transaction reserves driver and vehicle. Database uniqueness prevents duplicate active assignments. Assignment, start, completion, cancellation and flight disruption are separate states.

Example: A is ready 10:00 and can wait until 10:20; B is ready 10:10 and can wait until 10:40. They may depart at 10:10 if all other checks pass. C, ready at 10:25, cannot join: the group cannot average away A's deadline. A flight match is only a preference; passengers on different flights can share.

The departure rule is `max(current_time, each_ready_time) <= min(each_ready_time + each_max_wait)`. All timestamps are timezone-aware and normalized for comparison. Flight adjustments use the original baseline so the same reported delay is not repeatedly added.

## Parameters and their meaning

| Parameter | Current use | Important limitation |
| --- | --- | --- |
| Airport | Exact IATA equality | No terminal, meeting-point or airport access rules |
| Ready time and maximum wait | Hard intersection; individual wait 5–120 minutes | Passenger readiness is declared/flight-adjusted, not a check-in signal |
| Dispatch horizon | Default 30 minutes, configurable 5–120 | Limits initial proposals; later flight delays can still hold an assigned cab |
| Destination coordinates | Whole-group geodesic and directed road checks; default 3 km | Does not bound airport-to-drop-off duration or total detour |
| Passenger/luggage counts | Sums fit policy and actual vehicle; defaults 4/4 | Bags are counts, not measured volume; equipment-seat interaction needs operational specification |
| Wheelchair/child-seat spaces | Required totals must fit vehicle | Space count alone does not verify accessibility equipment certification |
| Pets | Required vehicle capability | Allergies and explicit refusal to share with pets are not modeled |
| Women-only request | Separate matching pool and eligible driver | Declarations/approval are not government identity verification |
| Flight/date | Soft ranking preference | Not a substitute for ready time or road compatibility |
| Request version/status | Transaction conflict protection | Requires all future mutators to preserve the version discipline |
| Account ID | One booking account per group | Does not prevent one account booking overlapping separate trips |
| Attempt timestamps | Least-recently-attempted maintenance rotation | Fair attempts do not guarantee a match or service-level deadline |

Names, voice, language, religion, caste, appearance and inferred personality are not compatibility signals. Free text does not silently allocate equipment. Defaults are pilot product choices, not learned or externally validated optimal values.

## What other systems teach us

| Primary source | Published approach | Decision for Kootu |
| --- | --- | --- |
| [Alonso-Mora et al., PNAS research](https://people.csail.mit.edu/jalonsom/docs/17-alonsomora-ridesharing-pnas.pdf) | Builds request/vehicle shareability and feasible-trip graphs, then optimizes assignment with waiting, delay and capacity constraints. | Separate feasibility from allocation quality. Small airport groups can evaluate stop permutations before considering a general solver; the paper's simulation is not our benchmark. |
| [Uber Engineering, July 2025](https://www.uber.com/us/en/blog/reinforcement-learning-for-modeling-marketplace-balance/) | Adds learned long-term driver value to online matching, trained from trip and idle transitions and evaluated through simulation and experiments. | Useful later for fleet positioning; Kootu lacks the trip history and operating scale to justify copying this ML architecture. |
| [Lyft Shared Saver, historical launch](https://www.lyft.com/blog/posts/introducing-shared-saver) | Uses a short wait and walking pickup/drop-off locations to facilitate sharing. | Time and pickup flexibility can increase feasible matches, but must be explicit and accessible. This historical page does not establish current Kochi availability. |
| [Quick Ride Taxipool help](https://quickride.in/taxipool-help.php) | Describes route/time grouping, sharing choices, limited deviation and confirmation near scheduled pickup. | Separate scheduled intent from driver confirmation. Published help does not reveal its actual optimization weights or internal implementation. |
| [Google OR-Tools time-window routing](https://developers.google.com/optimization/routing/vrptw) | Models route travel times and permitted visit windows. | Candidate tool for later multi-vehicle routing. A solver still needs trustworthy inputs, a time limit and a safe fallback. Not installed in this milestone. |

## Database design and transaction boundaries

Existing tables remain the source of truth; no duplicate data store was introduced.

| Table | Responsibility and integrity |
| --- | --- |
| `profiles` | Clerk subject, server role and explicit preferences; unique subject |
| `passenger_requests` | Arrival baseline/current readiness, location, party needs, state/version; new nullable match/flight attempt times |
| `drivers`, `vehicles` | Separate approval, equipment and availability; available rows must be approved |
| `ride_groups` | Proposal/assignment/trip state; paired driver/vehicle; assigned, started and completed groups require assignment |
| `ride_members` | Request-to-group membership; request primary key prevents duplicate membership |
| `driver_offers` | Driver acceptance opportunity and expiry; valid states and actual vehicle-owner relationship |
| `trip_events` | Group lifecycle events; not yet a complete admin or matching-decision audit log |
| `provider_usage` | Shared per-user API request counters; not a provider-wide billing cap |

Migration 202610110003 adds legal-state checks, positive request versions, composite vehicle/driver foreign keys for offers and groups, approval/availability checks, attempt timestamps and partial queue indexes. The generated PostGIS point and GiST index remain. Constraints validate historical rows and intentionally fail rather than invent repairs. They prevent illegal stored combinations; they do not encode every allowed transition between states. [PostgreSQL constraint reference](https://www.postgresql.org/docs/17/ddl-constraints.html).

Use short database transactions, consistent lock order and explicit conflict responses. `FOR UPDATE` alone does not refresh previously loaded Python objects; the added `populate_existing` matters. [PostgreSQL locking](https://www.postgresql.org/docs/17/explicit-locking.html), [SQLAlchemy refresh behavior](https://docs.sqlalchemy.org/en/20/orm/queryguide/api.html#populate-existing).

Spatial distance belongs in the database shortlist, with indexed predicates, followed by road verification. The new indexes express access patterns; their benefit at scale must be measured using realistic data and `EXPLAIN (ANALYZE, BUFFERS)`. [PostGIS ST_DWithin](https://postgis.net/docs/ST_DWithin.html).

Maintenance retains its existing PostgreSQL session advisory lock. Flight lookup attempts (including empty results/failures) advance a separate timestamp; successful flight data retains its own update semantics. Automatic matching skips expired/far-future requests and rotates attempted requests. Proposal expiry processes at most 100 groups per cycle. This bounds each batch, not total end-to-end latency.

## Risk register

| Priority | Failure scenario | Status / next action |
| --- | --- | --- |
| P1 | Duplicate membership or two drivers winning one group | Existing locks and database uniqueness, existing concurrency regressions retained |
| P1 | A future booking monopolizes current fleet | Initial proposals now gated by dispatch horizon; delay-after-assignment still needs operator/release policy |
| P1 | A legal-looking record references another driver's vehicle | Composite foreign keys added and tested |
| P1 | Short road distance but excessive passenger travel time | Still open: airport pickup anchor, stop order, traffic-aware durations and per-passenger detour limits |
| P1 | An assigned ride misses its wait deadline and cannot start | Still open: define no-show/late-pickup recovery and notifications; today explicit cancellation/operator intervention is required |
| P1 | Missing routing configuration or provider outage | Fail closed; no fabricated ride. Live routing and signed-in trip remain deployment acceptance gates |
| P2 | Incompatible rows occupy all 100 shortlist positions | Fixed for seed time/policy/account/basic capacity filters; equipment/fleet truncation can still miss feasible options |
| P2 | One road-incompatible candidate blocks a good alternative | Bounded road-aware reconstruction added; still greedy and can miss globally better subsets |
| P2 | Failed/empty flight lookups or impossible requests monopolize worker | Attempt rotation and expired/future matching filter added; minimum revisit time/backoff remains future work |
| P2 | Operator revokes approval during driver availability request | Locked ORM refresh and approval constraint added; targeted race regression |
| P2 | Provider spend or tail latency grows unexpectedly | Calls bounded per attempt; global quotas, circuit breaker, total request deadline and same-flight coalescing still needed |
| P2 | Matching or expiry throughput is below arrival rate | Default cycle is 900 seconds, 5 match attempts and 30 flight lookups; measure backlog before changing frequency/cost |
| P2 | Sleeping API prevents maintenance | Existing hosting limitation; an awake worker is required for dependable scheduled processing |
| P2 | Duplicate submission races, retry storms, pool exhaustion | Existing conflict responses; broader idempotency/retry/backpressure and load tests required |
| P2 | Long-lived access to completed trip manifests | Define retention, deletion/export and post-trip driver access; do not copy private coordinates into analytics |
| P2 | Abusive demand or several bookings from one account | Per-endpoint limits do not cover all abuse; define active-booking limits and operator escalation |
| P2 | Driver marked available far from airport | No driver GPS/service-area/ETA model; approval and availability do not prove pickup feasibility |
| P3 | Ranking favors same-flight users while others repeatedly wait | Attempt fairness improved, allocation fairness unmeasured; add deadline/age-aware evaluation |

No finite checklist establishes absence of all issues. User research must cover pickup accessibility, baggage delays, meeting-point confusion, allergies, cancellations, consent and staffed support as well as software correctness.

## Next implementation milestones

1. **Route feasibility:** add an approved airport/terminal pickup catalog, passenger detour allowance and driver pickup ETA. For each small candidate group, retrieve directed durations including the airport, enumerate drop-off orders (four stops: at most 24), and reject any order violating a passenger's total wait/detour bound. Add stop service time. Duration uncertainty needs a conservative margin, not an exact-time promise. Store the selected route version and verification time.
2. **Allocation quality:** evaluate bounded alternative groups and vehicles using a stated objective: first meet all constraints, then serve more waiting parties, prioritize deadlines/age, minimize maximum passenger detour, then total travel. Compare with the current heuristic on seeded synthetic scenarios and later consented pilot data. Do not introduce arbitrary numerical weights without showing the trade-offs.
3. **Lifecycle depth:** centralize release/expiry/disruption transitions in the ride lifecycle module with group-first locking and one event contract. This gives callers one place for state rules rather than reproducing changes in endpoints and workers. Add missed-pickup policy, explicit passenger readiness and driver response deadlines. Preserve operator assistance for started rides.
4. **Reliable scheduling and notifications:** move maintenance to an independently awake worker only when deployment supports it. Add per-flight lookup coalescing, per-provider global budgets/backoff, due-at scheduling and backlog metrics. When notifications are added, use a PostgreSQL transactional outbox and idempotent delivery; do not send inside ride transactions.
5. **Scale with evidence:** load-test realistic airport bursts, approved/unsupported fleet mixes and outages. Track p50/p95/p99 latency, pool wait, lock wait, candidate counts, routing calls, worker backlog/oldest age, match rate, individual wait breaches and cancellations. Tune connection counts across replicas; retain session/direct pooling for the advisory lock. Partition by airport or introduce dedicated queues only after measured contention justifies it.

[Google route matrices](https://developers.google.com/maps/documentation/routes/compute_route_matrix) can batch directed distance/duration work, but responses have per-element failures and indices; every element needs validation. Batching is not a free billing guarantee. Shared caching needs review of provider terms and data retention rules.

## Validation and rollout

Baseline: 53 backend tests passed locally before edits. New regressions use disposable PostgreSQL/PostGIS, not production. They cover crowded shortlists, account duplicates, far-future dispatch, road alternatives/call budget, failed/empty polling fairness, invalid DB states/vehicle ownership and a forced approval race. Existing concurrent matching/acceptance, auth, provider, privacy and migration tests also run. Final command results are recorded in CHANGELOG.md.

Before release: back up and inspect the target database; apply migration 202610110003 with the migration owner; investigate any constraint failure without automatically deleting records; run readiness and authenticated end-to-end booking/accept/cancel/start/complete checks. New columns are server-internal and wire contracts stay unchanged. Do not auto-push code into the connected deployment before the migration is applied. Rolling back application code can leave the additive schema in place; do not drop data to reverse the release.

Production burst load, failover/restore, real routing, actual airport pickup and a complete signed-in trip have not been verified in this work. Proposed SLOs require an agreed operating window and measured baselines; no synthetic benchmark is presented as live capacity.
