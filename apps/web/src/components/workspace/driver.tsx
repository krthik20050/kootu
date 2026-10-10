"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import type {
  DriverResponse,
  GroupResponse,
  OfferResponse,
  ManifestResponse,
  VehicleResponse,
} from "@/lib/api/generated";
import { localTime, message, readable, type Api } from "./shared";

export function DriverDesk({ api }: { api: Api }) {
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
  }, []);
  useEffect(() => {
    let live = true;
    void load()
      .then((data) => {
        if (live) apply(data);
      })
      .catch((error) => {
        if (live) setError(message(error));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    const timer = setInterval(() => {
      if (!document.hidden)
        void load()
          .then((data) => {
            if (live) apply(data);
          })
          .catch((error) => {
            if (live) setError(message(error));
          });
    }, 15000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [load, apply]);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await load().then(apply);
    } catch (error) {
      setError(message(error));
    } finally {
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
  return (
    <>
      <div className="workspace-title">
        <p className="eyebrow">THE DRIVER DESK</p>
        <h1>
          A full cab.
          <br />
          <em>A clear route.</em>
        </h1>
        <p>
          Keep your vehicle’s capacity accurate. You’ll receive groups that fit
          the seats, luggage and needs you can support.
        </p>
      </div>
      {loading && <p role="status">Loading your driver account…</p>}
      {!loading && !driver && (
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
        <div className="workspace-grid">
          <section>
            <div className="driver-availability">
              <h2>Your availability</h2>
              <p className="status">{readable(driver.verification_status)}</p>
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
            </div>
            <h2>Your vehicles</h2>
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
            <form onSubmit={addVehicle}>
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
            </form>
          </section>
          <aside className="ride-list">
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
            <h2>Your groups</h2>
            {!offers.length && (
              <p className="empty">
                New groups appear here when you and an approved vehicle are
                available.
              </p>
            )}
            {offers.map((offer) => {
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
        </div>
      )}
    </>
  );
}
