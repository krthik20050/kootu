"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GroupResponse,
  MatchResponse,
  ProfileResponse,
  RequestResponse,
} from "@/lib/api/generated";
import { localTime, message, readable, type Api } from "./shared";
import { RequestChat } from "./request-chat";
import { RideGroup } from "./ride-group";

const active = new Set(["WAITING", "MATCHED", "ASSIGNED"]);

export function ChatPassenger({ api, accountName = "" }: { api: Api; accountName?: string }) {
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [groups, setGroups] = useState<Record<string, GroupResponse>>({});
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const lock = useRef(false);
  const revision = useRef(0);
  const fetching = useRef(false);
  const [loading, setLoading] = useState(true);
  const [editRide, setEditRide] = useState<RequestResponse | undefined>();

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
    const loaded = await Promise.allSettled(
      ids.map((id) => api<GroupResponse>(`/ride-groups/${id}`)),
    );
    return {
      me,
      items,
      groups: Object.fromEntries(loaded.flatMap(result => result.status === "fulfilled" ? [[result.value.id, result.value]] : [])),
      groupError: loaded.some(result => result.status === "rejected"),
    };
  }, [api]);

  const apply = useCallback((data: Awaited<ReturnType<typeof load>>) => {
    setProfile(data.me);
    setRequests(data.items);
    setGroups(data.groups);
    setError(data.groupError ? "Some group details could not be loaded. Refresh to try again." : "");
    const editId = new URLSearchParams(window.location.search).get("edit");
    setEditRide(data.items.find(ride => ride.id === editId));
  }, []);

  const refresh = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    const current = ++revision.current;
    try {
      const data = await load();
      if (current === revision.current) apply(data);
    } catch (caught) {
      if (current === revision.current) throw caught;
    } finally { fetching.current = false; }
  }, [load, apply]);

  useEffect(() => {
    let live = true;
    const generation = revision;
    const initial = setTimeout(() => void refresh()
      .catch((error) => {
        if (live) setError(message(error));
      })
      .finally(() => {
        if (live) setLoading(false);
      }), 0);
    const timer = setInterval(() => {
      if (!document.hidden && !lock.current)
        void refresh()
          .catch((error) => {
            if (live) setError(message(error));
          });
    }, 15000);
    return () => {
      live = false;
      generation.current++;
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [refresh]);

  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    revision.current++;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      await refresh();
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }

  async function findGroup(ride: RequestResponse) {
    await run(async () => {
      setMatchingId(ride.id);
      try {
        const result = await api<MatchResponse>(`/ride-requests/${ride.id}/match`, { method: "POST", timeout: 150000 });
        if (result.matched && result.group) {
          const matched = result.group;
          setGroups(current => ({ ...current, [matched.id]: matched }));
          const updated: RequestResponse = { ...ride, group_id: matched.id, status: matched.status === "PROPOSED" ? "MATCHED" : matched.status };
          setRequests(current => current.some(item => item.id === ride.id) ? current.map(item => item.id === ride.id ? updated : item) : [...current, updated]);
        }
        setNotice(result.message || (result.matched ? "Group found. Check your group details below." : "No compatible group yet. Your request remains waiting; you can try again later."));
      } finally {
        setMatchingId(null);
      }
    });
  }

  function groupCard(ride: RequestResponse) {
    return <RideGroup ride={ride} group={ride.group_id ? groups[ride.group_id] : undefined} busy={busy} matching={matchingId === ride.id} onMatch={() => void findGroup(ride)} onRefresh={() => void run(async () => {})} />;
  }

  return (
    <>
      <div className="workspace-grid">
        <RequestChat
          key={`${profile?.id || "loading"}:${editRide?.id || "new"}`}
          api={api}
          profile={profile}
          accountName={accountName}
          disabled={busy || loading || !profile}
          initialRide={editRide}
          onSaved={() => { void refresh().catch(caught => setError(message(caught))); }}
          renderSavedRide={ride => <>{groupCard(requests.find(item => item.id === ride.id) || ride)}{error && <p className="chat-error" role="alert">{error}</p>}{notice && <p className="chat-notice" role="status">{notice}</p>}</>}
        />
        <aside className="ride-list" aria-labelledby="rides-title">
          <div className="aside-title">
            <p className="eyebrow">SAVED ARRIVALS</p>
            <button
              className="text-button"
              disabled={busy || loading || !profile}
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
                {(active.has(ride.status) || group) && groupCard(ride)}
                <div className="entry-actions">
                  {active.has(ride.status) && (
                    <button
                      className="text-button"
                      disabled={busy || loading || !profile}
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
