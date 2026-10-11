"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CarFront, Radio, ArrowUpRight } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import type {
  DriverResponse,
  GroupResponse,
  OfferResponse,
  ManifestResponse,
  VehicleResponse,
} from "@/lib/api/generated";
import { localTime, message, readable, type Api } from "./shared";
import { DriverLocationShare } from "./driver-location";

export type DriverView = "overview" | "profile" | "offers" | "trips" | "history";

export function DriverDesk({ api, view = "overview" }: { api: Api; view?: DriverView }) {
  const operation = useRef(false);
  const revision = useRef(0);
  const [driver, setDriver] = useState<DriverResponse | null>(null);
  const [vehicles, setVehicles] = useState<VehicleResponse[]>([]);
  const [offers, setOffers] = useState<OfferResponse[]>([]);
  const [groups, setGroups] = useState<Record<string, GroupResponse>>({});
  const [stops, setStops] = useState<Record<string, ManifestResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clock, setClock] = useState(0);

  const load = useCallback(async () => {
    let current: DriverResponse;
    try {
      current = await api<DriverResponse>("/drivers/me");
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
    const [fleet, incoming] = await Promise.all([
      api<VehicleResponse[]>("/vehicles"),
      api<OfferResponse[]>("/driver-offers"),
    ]);
    const accepted = incoming.filter((offer) => offer.status === "ACCEPTED");
    const trips = await Promise.all(
      accepted.map((offer) =>
        api<GroupResponse>(`/ride-groups/${offer.group_id}`),
      ),
    );
    return {
      current,
      fleet,
      incoming,
      groups: Object.fromEntries(trips.map((group) => [group.id, group])),
    };
  }, [api]);
  const apply = useCallback((data: Awaited<ReturnType<typeof load>>) => {
    setDriver(data?.current || null);
    setVehicles(data?.fleet || []);
    setOffers(data?.incoming || []);
    setGroups(data?.groups || {});
    setStops((old) =>
      Object.fromEntries(
        Object.entries(old).filter(([id]) => data?.groups[id]),
      ),
    );
    setClock(Date.now());
    setError("");
  }, []);
  useEffect(() => {
    let live = true;
    let fetching = false;
    const refresh = () => {
      if (fetching || operation.current) return;
      fetching = true;
      const current = revision.current;
      void load()
      .then((data) => {
        if (live && current === revision.current) apply(data);
      })
      .catch((error) => {
        if (live && current === revision.current) setError(message(error));
      })
      .finally(() => {
        fetching = false;
        if (live) setLoading(false);
      });
    };
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 15000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [load, apply]);
  async function run(action: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    revision.current++;
    setBusy(true);
    setError("");
    try {
      await action();
      await load().then(apply);
    } catch (error) {
      setError(message(error));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }
  function onboarding(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void run(async () => {
      await api("/drivers", {
        method: "POST",
        body: {
          licence_reference: String(form.get("licence_reference")),
          women_only_eligible: form.get("women_only_eligible") === "on",
        },
      });
    });
  }
  function addVehicle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const formElement = event.currentTarget;
    void run(async () => {
      await api("/vehicles", {
        method: "POST",
        body: {
          registration: String(form.get("registration")).toUpperCase(),
          seats: Number(form.get("seats")),
          luggage_capacity: Number(form.get("luggage_capacity")),
          wheelchair_spaces: Number(form.get("wheelchair_spaces")),
          child_seats: Number(form.get("child_seats")),
          pet_friendly: form.get("pet_friendly") === "on",
        },
      });
      formElement.reset();
    });
  }
  const visibleOffers = offers.filter(offer => {
    const group = groups[offer.group_id];
    if (view === "offers") return offer.status === "PENDING" && Date.parse(offer.expires_at) > clock;
    if (view === "trips") return group && ["ASSIGNED", "IN_PROGRESS"].includes(group.status);
    if (view === "history") return group ? ["COMPLETED", "CANCELLED"].includes(group.status) : offer.status !== "PENDING" || Date.parse(offer.expires_at) <= clock;
    return true;
  });
  return (
    <>
      {view === "overview" && <div className="workspace-title driver-hero">
        <div><p className="eyebrow">YOUR DAY ON THE ROAD</p>
        <h2>Ready for your next ride.</h2>
        <p>Manage your availability, keep your fleet ready and review incoming groups.</p></div>
        <Link href="/driver/profile" className="secondary">Manage fleet <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
      }
      {view === "overview" && driver && <div className="driver-metrics">{[["Pending offers", offers.filter(item => item.status === "PENDING" && Date.parse(item.expires_at) > clock).length], ["Active trips", Object.values(groups).filter(item => ["ASSIGNED", "IN_PROGRESS"].includes(item.status)).length], ["Completed rides", Object.values(groups).filter(item => item.status === "COMPLETED").length], ["Approved vehicles", vehicles.filter(item => item.approved).length]].map(([label, value]) => <section key={label} className="driver-panel"><h3>{label}</h3><p className="driver-metric-value">{value}</p></section>)}</div>}
      {loading && <p role="status">Loading your driver account…</p>}
      {!loading && !driver && !error && (
        <form className="onboarding" onSubmit={onboarding}>
          <h2>Join as a driver</h2>
          <p>
            An operator must review your licence and vehicle before you can
            receive groups. Arrange document verification with the operator.
          </p>
          <label>
            Licence reference
            <input
              name="licence_reference"
              required
              minLength={5}
              maxLength={120}
            />
          </label>
          <label className="check">
            <input name="women_only_eligible" type="checkbox" />I am eligible to
            drive women-only groups.
          </label>
          <button className="action" disabled={busy}>
            Submit for review
          </button>
        </form>
      )}
      {driver && (
        <div className={`workspace-grid driver-view-${view}`}>
          <section hidden={!["overview", "profile"].includes(view)}>
            <div className="driver-availability">
              <div className="driver-section-heading"><span className="driver-section-icon"><Radio size={20} aria-hidden="true" /></span><h2>Your availability</h2><span className="status">{readable(driver.verification_status)}</span></div>
              <div className="driver-availability-state" data-available={driver.available}><span aria-hidden="true" />{driver.available ? "Available for rides" : "Currently offline"}</div>
              <p>
                {driver.available
                  ? "You are available for new offers."
                  : "You are unavailable for new offers."}
              </p>
              <button
                className="action"
                disabled={busy || driver.verification_status !== "APPROVED"}
                onClick={() =>
                  void run(async () => {
                    await api("/drivers/me/availability", {
                      method: "PATCH",
                      body: { available: !driver.available },
                    });
                  })
                }
              >
                {driver.available ? "Go unavailable" : "Go available"}
              </button>
              {driver.verification_status !== "APPROVED" && <p className="quiet">Operator approval is required before you can go available.</p>}
            </div>
            <div className="driver-section-heading"><span className="driver-section-icon"><CarFront size={20} aria-hidden="true" /></span><h2>Your vehicles</h2></div>
            {vehicles.length === 0 && (
              <p className="empty">
                Add a vehicle to submit it for operator review.
              </p>
            )}
            {vehicles.map((vehicle) => (
              <article key={vehicle.id} className="ride-entry">
                <h3>{vehicle.registration}</h3>
                <p>
                  {vehicle.seats} passenger seats · {vehicle.luggage_capacity}{" "}
                  luggage · {vehicle.wheelchair_spaces} wheelchair spaces ·{" "}
                  {vehicle.child_seats} child seats
                  {vehicle.pet_friendly ? " · pets accepted" : ""}
                </p>
                <p className="status">
                  {vehicle.approved ? "approved" : "awaiting approval"} ·{" "}
                  {vehicle.available ? "available" : "unavailable"}
                </p>
                <button
                  className="secondary"
                  disabled={
                    busy ||
                    !vehicle.approved ||
                    driver.verification_status !== "APPROVED"
                  }
                  onClick={() =>
                    void run(async () => {
                      await api(`/vehicles/${vehicle.id}/availability`, {
                        method: "PATCH",
                        body: { available: !vehicle.available },
                      });
                    })
                  }
                >
                  {vehicle.available ? "Set unavailable" : "Set available"}
                </button>
              </article>
            ))}
            {view === "overview" ? <Link className="secondary driver-fleet-link" href="/driver/profile">Add or manage vehicles <ArrowUpRight size={16} aria-hidden="true" /></Link> : <form onSubmit={addVehicle}>
              <fieldset disabled={busy}>
                <legend>Add a vehicle</legend>
                <label>
                  Registration
                  <input
                    name="registration"
                    required
                    minLength={5}
                    maxLength={24}
                    pattern="[A-Za-z0-9 -]+"
                  />
                </label>
                <div className="form-row">
                  <label>
                    Passenger seats
                    <input
                      name="seats"
                      type="number"
                      min={1}
                      max={8}
                      defaultValue={4}
                      required
                    />
                  </label>
                  <label>
                    Luggage capacity
                    <input
                      name="luggage_capacity"
                      type="number"
                      min={0}
                      max={12}
                      defaultValue={4}
                      required
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Wheelchair spaces
                    <input
                      name="wheelchair_spaces"
                      type="number"
                      min={0}
                      max={2}
                      defaultValue={0}
                      required
                    />
                  </label>
                  <label>
                    Child seats
                    <input
                      name="child_seats"
                      type="number"
                      min={0}
                      max={4}
                      defaultValue={0}
                      required
                    />
                  </label>
                </div>
                <label className="check">
                  <input name="pet_friendly" type="checkbox" />
                  Pets accepted
                </label>
                <button className="secondary">Submit vehicle for review</button>
              </fieldset>
            </form>}
          </section>
          <aside className="ride-list" hidden={view === "profile"}>
            <div className="aside-title">
              <p className="eyebrow">OFFERS & TRIPS</p>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => void run(async () => {})}
              >
                Refresh
              </button>
            </div>
            <h2>{view === "history" ? "Past offers & trips" : view === "trips" ? "Active trips" : view === "offers" ? "Pending ride offers" : "Your groups"}</h2>
            {!visibleOffers.length && (
              <p className="empty">
                {view === "history" ? "Completed trips and closed offers will appear here." : view === "trips" ? "No assigned or in-progress trips. Accepted offers will appear here." : "New groups appear here when you and an approved vehicle are available."}
              </p>
            )}
            {visibleOffers.map((offer) => {
              const group = groups[offer.group_id];
              const expired = Date.parse(offer.expires_at) <= clock;
              return (
                <article className="ride-entry" key={offer.id}>
                  <span className="status">
                    {group
                      ? readable(group.status)
                      : expired && offer.status === "PENDING"
                        ? "expired"
                        : readable(offer.status)}
                  </span>
                  <h3>
                    {offer.airport} →{" "}
                    {offer.destination_cluster || "Destination cluster"}
                  </h3>
                  {offer.destination_area && (
                    <a
                      className="text-button"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps/search/?api=1&query=${offer.destination_area.latitude},${offer.destination_area.longitude}`}
                    >
                      View approximate destination area ↗
                    </a>
                  )}
                  <p>
                    {offer.passengers} passengers · {offer.luggage} luggage
                    <br />
                    Ready {localTime(group?.departure_at || offer.departure_at)}
                  </p>
                  <p className="quiet">
                    {offer.wheelchair_spaces} wheelchair spaces ·{" "}
                    {offer.child_seats} child seats
                    {offer.pet_friendly ? " · travelling with a pet" : ""}
                  </p>
                  {offer.status === "PENDING" && !expired && (
                    <>
                      <p className="quiet">
                        Respond by {localTime(offer.expires_at)}. Accept only if
                        you can meet the pickup time.
                      </p>
                      <div className="entry-actions">
                        <button
                          className="action"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await api(`/driver-offers/${offer.id}/accept`, {
                                method: "POST",
                              });
                            })
                          }
                        >
                          Accept group
                        </button>
                        <button
                          className="text-button"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await api(`/driver-offers/${offer.id}/reject`, {
                                method: "POST",
                              });
                            })
                          }
                        >
                          Decline
                        </button>
                      </div>
                    </>
                  )}
                  {group &&
                    ["ASSIGNED", "IN_PROGRESS"].includes(group.status) && (
                      <div className="entry-actions">
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              const manifest = await api<ManifestResponse[]>(
                                `/ride-groups/${group.id}/manifest`,
                              );
                              setStops((old) => ({
                                ...old,
                                [group.id]: manifest,
                              }));
                            })
                          }
                        >
                          View drop-offs & notes
                        </button>
                        <button
                          className="action"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await api(`/ride-groups/${group.id}/status`, {
                                method: "POST",
                                body: {
                                  status:
                                    group.status === "ASSIGNED"
                                      ? "IN_PROGRESS"
                                      : "COMPLETED",
                                },
                              });
                            })
                          }
                        >
                          {group.status === "ASSIGNED"
                            ? "Start trip"
                            : "Complete trip"}
                        </button>
                      </div>
                    )}
                  {group && ["ASSIGNED", "IN_PROGRESS"].includes(group.status) && <DriverLocationShare api={api} groupId={group.id} />}
                  {stops[offer.group_id] && (
                    <ol className="manifest">
                      {stops[offer.group_id].map((stop) => (
                        <li key={stop.id}>
                          <strong>
                            {stop.display_name || "Passenger party"} ·{" "}
                            {stop.destination_name}
                          </strong>
                          <p>
                            {stop.passengers} passengers · {stop.luggage}{" "}
                            luggage
                          </p>
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={`https://www.google.com/maps/search/?api=1&query=${stop.destination.latitude},${stop.destination.longitude}`}
                          >
                            Open drop-off pin ↗
                          </a>
                          {stop.notes && <p>{stop.notes}</p>}
                        </li>
                      ))}
                    </ol>
                  )}
                  {group?.status === "ASSIGNED" && (
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await api(`/ride-groups/${group.id}/cancel`, {
                            method: "POST",
                          });
                        })
                      }
                    >
                      Release group & go unavailable
                    </button>
                  )}
                </article>
              );
            })}
          </aside>
        </div>
      )}
      {error && (
        <div className="workspace-feedback">
          <p className="error" role="alert">
            {error}
          </p>
          <button className="secondary" disabled={busy} onClick={() => void run(async () => {})}>Retry connection</button>
        </div>
      )}
    </>
  );
}
