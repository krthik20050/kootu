"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  GroupResponse,
  MatchResponse,
  ProfileResponse,
  RequestResponse,
} from "@/lib/api/generated";
import { localTime, message, readable, type Api } from "./shared";
import { RequestChat } from "./request-chat";

const active = new Set(["WAITING", "MATCHED", "ASSIGNED"]);

export function Passenger({ api, accountName = "" }: { api: Api; accountName?: string }) {
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [groups, setGroups] = useState<Record<string, GroupResponse>>({});
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [me, items] = await Promise.all([
      api<ProfileResponse>("/me"),
      api<RequestResponse[]>("/ride-requests"),
    ]);
    const ids = [
      ...new Set(
        items
          .map((row) => row.group_id)
          .filter((id): id is string => id !== null),
      ),
    ];
    const loaded = await Promise.all(
      ids.map((id) => api<GroupResponse>(`/ride-groups/${id}`)),
    );
    return {
      me,
      items,
      groups: Object.fromEntries(loaded.map((group) => [group.id, group])),
    };
  }, [api]);

  const apply = useCallback((data: Awaited<ReturnType<typeof load>>) => {
    setProfile(data.me);
    setRequests(data.items);
    setGroups(data.groups);
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
    setNotice("");
    try {
      await action();
      await load().then(apply);
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="workspace-grid">
        <RequestChat
          key={profile?.id || "loading"}
          api={api}
          profile={profile}
          accountName={accountName}
          disabled={busy}
        />
        <aside className="ride-list" aria-labelledby="rides-title">
          <div className="aside-title">
            <p className="eyebrow">SAVED ARRIVALS</p>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => void run(async () => {})}
            >
              Refresh
            </button>
          </div>
          <h2 id="rides-title">Your journeys</h2>
          {loading && <p role="status">Loading your arrivals…</p>}
          {!loading && !requests.length && (
            <p className="empty">
              Your saved arrivals will appear here, with the group and driver
              status.
            </p>
          )}
          {requests.map((ride) => {
            const group = ride.group_id ? groups[ride.group_id] : undefined;
            return (
              <article className="ride-entry" key={ride.id}>
                <span className="status">{readable(ride.status)}</span>
                <h3>
                  {ride.airport} → {ride.destination_name}
                </h3>
                <p>
                  {localTime(ride.ready_at)} · {ride.passengers} passenger
                  {ride.passengers === 1 ? "" : "s"} · {ride.luggage} luggage
                </p>
                <p className="quiet">
                  Flight {ride.flight_number} · {readable(ride.flight_status)}
                </p>
                {group && (
                  <div className="group-details">
                    <strong>
                      {group.vehicle
                        ? `Vehicle ${group.vehicle.registration}`
                        : "Waiting for driver acceptance"}
                    </strong>
                    <p>
                      {group.passengers} passengers · leave{" "}
                      {localTime(group.departure_at)}
                    </p>
                    <ol>
                      {group.events.slice(-3).map((event, index) => (
                        <li key={`${event.created_at}-${index}`}>
                          {readable(event.kind)}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <div className="entry-actions">
                  {ride.status === "WAITING" && (
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const result = await api<MatchResponse>(
                            `/ride-requests/${ride.id}/match`,
                            { method: "POST", timeout: 150000 },
                          );
                          setNotice(
                            result.message || "Group sent for driver review.",
                          );
                        })
                      }
                    >
                      Look for a group
                    </button>
                  )}
                  {active.has(ride.status) && (
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await api(`/ride-requests/${ride.id}/cancel`, {
                            method: "POST",
                          });
                          setNotice("Arrival cancelled.");
                        })
                      }
                    >
                      Cancel request
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </aside>
      </div>
      <div className="workspace-feedback">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
      </div>
    </>
  );
}
