"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AdminDriverResponse,
  AdminVehicleResponse,
  ProfileResponse,
} from "@/lib/api/generated";
import { message, readable, type Api } from "./shared";

export function AdminDesk({ api }: { api: Api }) {
  const [drivers, setDrivers] = useState<AdminDriverResponse[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicleResponse[]>([]);
  const [permitted, setPermitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const profile = await api<ProfileResponse>("/me");
    if (profile.role !== "ADMIN") {
      throw new Error(
        "This area is for kootu operators. Ask your team’s administrator for access.",
      );
    }
    const [people, fleet] = await Promise.all([
      api<AdminDriverResponse[]>("/admin/drivers"),
      api<AdminVehicleResponse[]>("/admin/vehicles"),
    ]);
    return { people, fleet };
  }, [api]);
  const apply = useCallback((data: Awaited<ReturnType<typeof load>>) => {
    setDrivers(data.people);
    setVehicles(data.fleet);
    setPermitted(true);
  }, []);
  useEffect(() => {
    let live = true;
    void load()
      .then((data) => {
        if (live) apply(data);
      })
      .catch((error) => {
        if (live) setError(message(error));
      });
    return () => {
      live = false;
    };
  }, [load, apply]);
  async function review(
    kind: "drivers" | "vehicles",
    id: string,
    approved: boolean,
  ) {
    setBusy(true);
    setError("");
    try {
      await api(`/admin/${kind}/${id}/verification`, {
        method: "POST",
        body: { approved },
      });
      await load().then(apply);
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="workspace-title">
        <p className="eyebrow">OPERATOR REVIEW</p>
        <h1>
          Check the details.
          <br />
          <em>Then approve.</em>
        </h1>
        <p>
          Approval records your review. Verify licence validity, vehicle
          documents and declared capacity through your operational checks before
          approving.
        </p>
      </div>
      {permitted && (
        <div className="workspace-grid">
          <section>
            <h2>Drivers</h2>
            {!drivers.length && (
              <p className="empty">No driver applications yet.</p>
            )}
            {drivers.map((driver) => (
              <article className="ride-entry" key={driver.id}>
                <span className="status">
                  {readable(driver.verification_status)}
                </span>
                <h3>Licence {driver.licence_reference}</h3>
                <p className="quiet">Driver ID {driver.id}</p>
                <p>
                  {driver.women_only_eligible
                    ? "Declared eligible for women-only groups"
                    : "Standard groups"}
                </p>
                <div className="entry-actions">
                  <button
                    className="action"
                    disabled={busy}
                    onClick={() => void review("drivers", driver.id, true)}
                  >
                    Approve after review
                  </button>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => void review("drivers", driver.id, false)}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </section>
          <section>
            <h2>Vehicles</h2>
            {!vehicles.length && (
              <p className="empty">No vehicles submitted yet.</p>
            )}
            {vehicles.map((vehicle) => (
              <article className="ride-entry" key={vehicle.id}>
                <span className="status">
                  {vehicle.approved ? "approved" : "awaiting approval"}
                </span>
                <h3>{vehicle.registration}</h3>
                <p>
                  {vehicle.seats} seats · {vehicle.luggage_capacity} luggage ·{" "}
                  {vehicle.wheelchair_spaces} wheelchair spaces ·{" "}
                  {vehicle.child_seats} child seats
                  {vehicle.pet_friendly ? " · pets accepted" : ""}
                </p>
                <p className="quiet">Driver ID {vehicle.driver_id}</p>
                <div className="entry-actions">
                  <button
                    className="action"
                    disabled={busy}
                    onClick={() => void review("vehicles", vehicle.id, true)}
                  >
                    Approve after review
                  </button>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => void review("vehicles", vehicle.id, false)}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
