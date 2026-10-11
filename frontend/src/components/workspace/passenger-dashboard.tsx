"use client";

import { DriverLocationPin } from "./driver-location";
import styles from "./passenger-dashboard.module.css";

import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Car, Check, Clock, MapPin, Plane, RefreshCw, Users, Ticket, Route, Luggage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api/client";
import type { GroupResponse, MatchResponse, ProfileResponse, RequestResponse } from "@/lib/api/generated";
import { signInHref } from "@/lib/auth-navigation";
import { RequestFrame } from "./request-frame";
import { localTime, message, readable } from "./shared";

const activeStatuses = new Set(["WAITING", "MATCHED", "ASSIGNED", "IN_PROGRESS"]);
const cancellable = new Set(["WAITING", "MATCHED", "ASSIGNED"]);
const stages = ["WAITING", "MATCHED", "ASSIGNED", "IN_PROGRESS", "COMPLETED"];
const stageLabels = ["Waiting", "Matched", "Driver assigned", "On the way", "Completed"];

function SignedDashboard() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [rides, setRides] = useState<RequestResponse[]>([]);
  const [groups, setGroups] = useState<Record<string, GroupResponse>>({});
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const revision = useRef(0);
  const fetching = useRef(false);
  const lock = useRef(false);
  const api = useCallback(async <T,>(path: `/${string}`, options?: Parameters<typeof apiRequest>[2]) => {
    const token = await getToken();
    if (!token) throw new Error("Sign in again to view your rides.");
    return apiRequest<T>(path, token, options);
  }, [getToken]);

  const load = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    const current = ++revision.current;
    try {
      const [me, items] = await Promise.all([api<ProfileResponse>("/me"), api<RequestResponse[]>("/ride-requests")]);
      const ids = [...new Set(items.map(ride => ride.group_id).filter((id): id is string => !!id))];
      const details = await Promise.allSettled(ids.map(id => api<GroupResponse>(`/ride-groups/${id}`)));
      if (current !== revision.current) return;
      const available: Record<string, GroupResponse> = {};
      details.forEach(result => { if (result.status === "fulfilled") available[result.value.id] = result.value; });
      setProfile(me); setRides(items); setGroups(available); setHasData(true);
      setError(details.some(result => result.status === "rejected") ? "Some group details could not be loaded. Refresh to try again." : "");
    } catch (caught) { if (current === revision.current) setError(message(caught)); }
    finally { fetching.current = false; if (current === revision.current) setLoading(false); }
  }, [api]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const initial = setTimeout(() => void load(), 0);
    const generation = revision;
    const timer = setInterval(() => { if (!document.hidden && !lock.current) void load(); }, 15000);
    return () => { generation.current++; clearTimeout(initial); clearInterval(timer); };
  }, [isLoaded, isSignedIn, load]);

  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    revision.current++; lock.current = true; setBusy(true); setNotice(""); setError("");
    try { await action(); await load(); }
    catch (caught) { setError(message(caught)); }
    finally { lock.current = false; setBusy(false); }
  }

  const upcoming = rides.filter(ride => activeStatuses.has(ride.status)).sort((a, b) => Date.parse(a.ready_at) - Date.parse(b.ready_at));
  const history = rides.filter(ride => !activeStatuses.has(ride.status)).sort((a, b) => Date.parse(b.ready_at) - Date.parse(a.ready_at));
  const featured = upcoming[0];
  const group = featured?.group_id ? groups[featured.group_id] : undefined;
  const currentStage = featured ? stages.indexOf(featured.status) : -1;
  const name = profile?.display_name || user?.firstName || "there";

  function rideActions(ride: RequestResponse) {
    return <div className="flex flex-wrap gap-2">
      {cancellable.has(ride.status) && <Button asChild variant="outline" size="sm"><Link href={`/request?edit=${encodeURIComponent(ride.id)}`}>Edit preview</Link></Button>}
      {ride.status === "WAITING" && <Button size="sm" disabled={busy} onClick={() => void run(async () => {
        const result = await api<MatchResponse>(`/ride-requests/${ride.id}/match`, { method: "POST", timeout: 150000 });
        setNotice(result.message || (result.matched ? "Your group is ready for driver review." : "Your request is still waiting for a compatible group."));
      })}>Find a group</Button>}
      {cancellable.has(ride.status) && <Button variant="outline" size="sm" disabled={busy} onClick={() => setCancelId(ride.id)}>Cancel request</Button>}
      {cancelId === ride.id && <div className="w-full rounded-lg border bg-background p-3"><p className="mb-3 text-sm">Cancel this saved ride request?</p><div className="flex flex-wrap gap-2"><Button variant="destructive" size="sm" disabled={busy} onClick={() => void run(async () => { await api(`/ride-requests/${ride.id}/cancel`, { method: "POST" }); setCancelId(null); setNotice("Ride request cancelled."); })}>Confirm cancellation</Button><Button variant="outline" size="sm" disabled={busy} onClick={() => setCancelId(null)}>Keep request</Button></div></div>}
    </div>;
  }

  if (!isLoaded) return <p role="status">Loading your session…</p>;
  if (!isSignedIn) return <Card><CardHeader><CardTitle>Your rides, in one place</CardTitle><CardDescription>Sign in to see your upcoming ride, group and journey history.</CardDescription></CardHeader><CardContent><Button asChild><Link href={signInHref("/dashboard")}>Sign in</Link></Button></CardContent></Card>;

  return <div className={styles.dashboard}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>YOUR TRAVEL SPACE</p><h2>Your journeys.</h2><p>Welcome back, {name.split(" ")[0]}. Let’s get you from arrivals to home.</p></div><Button aria-label="Refresh journeys" variant="outline" className={styles.refresh} disabled={busy || loading} onClick={() => void run(async () => {})}><RefreshCw className="size-4" />Refresh</Button></header>
    {error && <p role="alert" className={styles.feedback}>{error}</p>}
    {notice && <p role="status" className={styles.feedback}>{notice}</p>}
    {loading || !hasData ? <section className={styles.loading} role="status"><Plane size={24} /><p>{loading ? "Getting your journeys ready…" : "Your journeys couldn’t be loaded. Use Refresh to try again."}</p></section> : <>
      <div className={styles.mainGrid}>
        {featured ? <section className={styles.panel} aria-labelledby="upcoming-title">
          <div className={styles.panelHeading}><div><p className={styles.eyebrow}>UP NEXT</p><h3 id="upcoming-title">Your airport ride</h3></div><Badge variant="secondary">{readable(featured.status)}</Badge></div>
          <div className={styles.route}><span className={styles.routeIcon}><Plane size={22} /></span><div><strong>{featured.airport}</strong><span>Arrival airport</span></div><ArrowUpRight size={20} /><div><strong>{featured.destination_name}</strong><span>Your destination</span></div></div>
          <dl className={styles.details}>{[["Flight", `${featured.flight_number} · ${featured.flight_date}`], ["Ready for pickup", localTime(featured.ready_at)], ["Flight status", readable(featured.flight_status)], ["Your party", `${featured.passengers} passengers · ${featured.luggage} bags`]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <div className={styles.rideActions}>{rideActions(featured)}</div>
          {cancellable.has(featured.status) && <p className={styles.caption}>Edit preview creates a new request. Your current booking stays unchanged until you cancel it.</p>}
        </section> : <section className={styles.booking} aria-labelledby="booking-title">
          <div className={styles.bookingTop}><span className={styles.bookingIcon}><Plane size={24} aria-hidden="true" /></span><span>AIRPORT → YOUR DESTINATION</span></div>
          <h3 id="booking-title">A softer landing.<br />A shared way home.</h3><p>Tell us when you land and where you’re headed. We’ll look for a compatible shared ride.</p>
          <div className={styles.bookingActions}><Button asChild><Link href="/request">Plan a ride <ArrowUpRight className="size-4" /></Link></Button><Link className={styles.quietLink} href="/passenger"><Ticket size={16} />Start with your ticket</Link></div>
          <div className={styles.bookingFoot}><span><Users size={14} />Compatible travellers</span><span><Car size={14} />Approved drivers</span></div>
        </section>}
        <aside className={styles.panel} aria-labelledby="ride-guide-title"><div className={styles.panelHeading}><h3 id="ride-guide-title">{featured ? "Ride progress" : "Three steps to your ride"}</h3><Route size={18} aria-hidden="true" /></div>
          <ol className={styles.timeline}>{(featured ? stageLabels.map((label, index) => ({ label, description: index === currentStage ? "Your current stage" : "", complete: index < currentStage, current: index === currentStage })) : [
            { label: "Add your arrival", description: "Enter your flight or upload a ticket.", complete: false, current: false },
            { label: "Choose your destination", description: "Confirm your drop-off and travel needs.", complete: false, current: false },
            { label: "Meet your shared ride", description: "A driver accepts your compatible group.", complete: false, current: false },
          ]).map((step, index) => <li key={step.label} aria-current={step.current ? "step" : undefined}><span className={styles.step}>{step.complete ? <Check size={14} /> : String(index + 1).padStart(2, "0")}</span><div><strong>{step.label}</strong>{step.description && <p>{step.description}</p>}</div></li>)}</ol>
          <p className={styles.guideNote}>{featured ? "Updates appear here as your ride progresses." : "A match depends on compatible arrivals and an available, approved vehicle."}</p>
        </aside>
      </div>
      <section className={styles.summary} aria-label="Journey summary">{[
        { label: "Active requests", value: upcoming.length, icon: Plane },
        { label: "Completed rides", value: rides.filter(ride => ride.status === "COMPLETED").length, icon: Check },
        { label: "Next pickup", value: group ? localTime(group.departure_at) : "Not scheduled", icon: Clock },
      ].map(stat => <div key={stat.label}><stat.icon size={18} aria-hidden="true" /><div><span>{stat.label}</span><strong>{stat.value}</strong></div></div>)}</section>
      {featured && <div className={styles.equalGrid}>
        <section className={styles.panel}><div className={styles.panelHeading}><h3>Your group</h3><Users size={18} /></div>{group ? <dl className={styles.details}>{[["Passengers", String(group.passengers)], ["Bags", String(group.luggage)], ["Departure", localTime(group.departure_at)], ["Drop-off area", group.destination_cluster || "Not available"], ["Group status", readable(group.status)], ["Women-only group", group.women_only ? "Yes" : "No"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p className={styles.muted}>{featured.group_id ? "Group details are unavailable. Refresh to try again." : "Your group details will appear when a compatible match is found."}</p>}</section>
        <section className={styles.panel}><div className={styles.panelHeading}><h3>Driver & pickup</h3><Car size={18} /></div><dl className={styles.details}><div><dt>Vehicle</dt><dd>{group?.vehicle?.registration || "Awaiting assignment"}</dd></div><div><dt>Capacity</dt><dd>{group?.vehicle ? `${group.vehicle.seats} seats · ${group.vehicle.luggage_capacity} bags` : "Available after assignment"}</dd></div></dl>{group && <div className={styles.driverLocation}><DriverLocationPin location={group.driver_location} /></div>}<p className={styles.caption}>Driver contact and the pickup point have not been shared here yet. Confirm these details and your fare before travel. Pay the driver directly.</p></section>
      </div>}
      {upcoming.length > 1 && <section className={styles.panel}><div className={styles.panelHeading}><h3>Other upcoming requests</h3><Badge variant="secondary">{upcoming.length - 1}</Badge></div>{upcoming.slice(1).map(ride => <div key={ride.id} className={styles.otherRide}><div><strong>{ride.airport} → {ride.destination_name}</strong><Badge variant="secondary">{readable(ride.status)}</Badge></div><p className={styles.caption}>{ride.flight_number} · {localTime(ride.ready_at)}</p>{rideActions(ride)}</div>)}</section>}
      <section id="rides-title" className={styles.panel} aria-labelledby="history-title"><div className={styles.panelHeading}><div><h3 id="history-title">Journey history</h3><p>Completed and cancelled rides, all in one place.</p></div><span className={styles.count}>{history.length}</span></div>{history.length ? <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Journey</th><th>Flight / ready time</th><th>Status</th></tr></thead><tbody>{history.map(ride => <tr key={ride.id}><td><span><MapPin size={15} />{ride.airport} → {ride.destination_name}</span></td><td>{ride.flight_number}<small>{localTime(ride.ready_at)}</small></td><td><Badge variant="outline">{readable(ride.status)}</Badge></td></tr>)}</tbody></table></div> : <div className={styles.historyEmpty}><span><Luggage size={22} aria-hidden="true" /></span><div><strong>No past journeys yet</strong><p>Your completed and cancelled rides will appear here.</p></div></div>}</section>
      {!!group?.events.length && <section className={styles.panel}><div className={styles.panelHeading}><h3>Latest updates</h3></div><ol className={styles.events}>{group.events.slice(-5).reverse().map((event, index) => <li key={`${event.created_at}-${index}`}><span>{readable(event.kind)}</span><time dateTime={event.created_at}>{localTime(event.created_at)}</time></li>)}</ol></section>}
    </>}
  </div>;

}

function DashboardSession() {
  const { userId } = useAuth();
  return <SignedDashboard key={userId || "signed-out"} />;
}

export function PassengerDashboard() {
  return <RequestFrame area="dashboard">{process.env.NEXT_PUBLIC_AUTH_ENABLED === "true" ? <DashboardSession /> : <Card><CardHeader><CardTitle>Your passenger dashboard</CardTitle><CardDescription>Configure sign-in to see your saved rides, group and driver assignment.</CardDescription></CardHeader><CardContent><Button asChild><Link href="/request">Open request chat</Link></Button></CardContent></Card>}</RequestFrame>;
}
