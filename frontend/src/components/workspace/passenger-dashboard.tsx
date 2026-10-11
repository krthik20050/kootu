"use client";

import { DriverLocationPin } from "./driver-location";

import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Car, Check, Clock, MapPin, Plane, RefreshCw, Users } from "lucide-react";
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

  return <div className="flex flex-col gap-6">
    <div className="passenger-welcome"><div><p className="eyebrow">YOUR PASSENGER DASHBOARD</p><h2>Hi {name.split(" ")[0]}, where’s next?</h2><p>Your flight, your shared ride, your journey home.</p></div><div className="passenger-welcome-actions"><Button variant="outline" disabled={busy || loading} onClick={() => void run(async () => {})}><RefreshCw className="mr-2 size-4" />Refresh</Button><Button asChild><Link href="/request"><Plane className="mr-2 size-4" />Request a ride</Link></Button></div></div>
    {error && <p role="alert" className="rounded-lg border border-destructive bg-card p-4 text-sm">{error}</p>}
    {notice && <p role="status" className="rounded-lg border bg-secondary p-4 text-sm text-secondary-foreground">{notice}</p>}
    {rides.some(ride => cancellable.has(ride.status)) && <p className="text-xs text-muted-foreground">Edit preview starts a new request from your saved details. It does not update the original booking.</p>}
    {loading || !hasData ? <p role="status">{loading ? "Loading your rides…" : "Ride data could not be loaded. Use Refresh to try again."}</p> : <>
      <div className="passenger-summary grid grid-cols-2 gap-3 xl:grid-cols-4">{[
        { label: "Active requests", value: upcoming.length, icon: Plane },
        { label: "Completed rides", value: rides.filter(ride => ride.status === "COMPLETED").length, icon: Check },
        { label: "Group passengers", value: group?.passengers ?? "—", icon: Users },
        { label: "Next departure", value: group ? localTime(group.departure_at) : "Not scheduled", icon: Clock },
      ].map(stat => <Card key={stat.label}><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">{stat.label}</CardTitle><stat.icon className="size-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-xl font-semibold tabular-nums">{stat.value}</p></CardContent></Card>)}</div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardHeader><CardTitle>Upcoming ride</CardTitle><CardDescription>Your next active airport request</CardDescription></CardHeader><CardContent>
          {featured ? <div className="flex flex-col gap-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3>{featured.airport} → {featured.destination_name}</h3><Badge>{readable(featured.status)}</Badge></div><dl className="grid gap-4 sm:grid-cols-2">{[["Flight", `${featured.flight_number} · ${featured.flight_date}`], ["Pickup-ready time", localTime(featured.ready_at)], ["Flight status", readable(featured.flight_status)], ["Your party", `${featured.passengers} passengers · ${featured.luggage} bags`]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}</dl>{rideActions(featured)}</div>
            : <div className="flex flex-col items-start gap-3"><Plane className="size-8 text-primary" /><p className="text-sm text-muted-foreground">No upcoming ride requests yet. Start with your flight and drop-off.</p><Button asChild><Link href="/request">Plan your ride</Link></Button></div>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Ride status</CardTitle><CardDescription>{featured ? "Follow your ride from request to arrival" : "Your ride’s progress will appear here"}</CardDescription></CardHeader><CardContent><ol className="flex flex-col gap-4">{stageLabels.map((label, index) => <li key={label} aria-current={index === currentStage ? "step" : undefined} className={`flex items-center gap-3 text-sm ${index <= currentStage ? "text-primary" : "text-muted-foreground"}`}><span className="flex size-7 shrink-0 items-center justify-center rounded-full border">{index < currentStage ? <Check className="size-4" /> : index + 1}</span><span>{label}{index === currentStage && <span className="ml-2 text-xs">· Current</span>}</span></li>)}</ol></CardContent></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Your group</CardTitle><CardDescription>Shared ride details, without sharing other passengers’ private information</CardDescription></CardHeader><CardContent>{group ? <dl className="grid gap-4 sm:grid-cols-2">{[["Passengers", String(group.passengers)], ["Luggage", `${group.luggage} bags`], ["Departure", localTime(group.departure_at)], ["Drop-off area", group.destination_cluster || "Not available"], ["Group status", readable(group.status)], ["Women-only group", group.women_only ? "Yes" : "No"]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>)}</dl> : <p className="text-sm text-muted-foreground">{featured?.group_id ? "Group details are unavailable. Refresh to try again." : "Your group will appear after a match is found."}</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Driver & pickup</CardTitle><CardDescription>Assigned vehicle and pickup details</CardDescription></CardHeader><CardContent><div className="flex flex-col gap-4"><Car className="size-6 text-primary" /><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Vehicle number</dt><dd className="mt-1 text-sm">{group?.vehicle?.registration || "Awaiting assignment"}</dd></div><div><dt className="text-xs text-muted-foreground">Driver name</dt><dd className="mt-1 text-sm">Not available yet</dd></div><div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Pickup instructions</dt><dd className="mt-1 text-sm text-muted-foreground">Pickup point and driver contact details have not been shared yet.</dd></div></dl>{group && <DriverLocationPin location={group.driver_location} />}{group?.vehicle && <p className="text-xs text-muted-foreground">{group.vehicle.seats} seats · {group.vehicle.luggage_capacity} bag capacity</p>}</div></CardContent></Card>
      </div>
      {upcoming.length > 1 && <Card><CardHeader><CardTitle>Other upcoming requests</CardTitle></CardHeader><CardContent className="flex flex-col gap-5">{upcoming.slice(1).map(ride => <div key={ride.id} className="flex flex-col gap-3 border-b pb-4 last:border-0"><div className="flex flex-wrap justify-between gap-2"><span className="text-sm font-medium">{ride.airport} → {ride.destination_name}</span><Badge variant="secondary">{readable(ride.status)}</Badge></div><p className="text-xs text-muted-foreground">{ride.flight_number} · {localTime(ride.ready_at)}</p>{rideActions(ride)}</div>)}</CardContent></Card>}
      <Card id="rides-title" className="scroll-mt-20"><CardHeader><CardTitle>Past rides</CardTitle><CardDescription>Completed and cancelled requests</CardDescription></CardHeader><CardContent>{history.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="p-3">Journey</th><th className="p-3">Flight / ready time</th><th className="p-3">Status</th></tr></thead><tbody>{history.map(ride => <tr key={ride.id} className="border-b last:border-0"><td className="p-3"><span className="inline-flex items-center gap-2"><MapPin className="size-4 shrink-0" />{ride.airport} → {ride.destination_name}</span></td><td className="p-3">{ride.flight_number}<span className="mt-1 block text-xs text-muted-foreground">{localTime(ride.ready_at)}</span></td><td className="p-3"><Badge variant="outline">{readable(ride.status)}</Badge></td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">Completed or cancelled rides will appear here.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Recent ride updates</CardTitle></CardHeader><CardContent>{group?.events.length ? <ol className="flex flex-col gap-3">{group.events.slice(-5).reverse().map((event, index) => <li key={`${event.created_at}-${index}`} className="flex flex-wrap justify-between gap-2 text-sm"><span>{readable(event.kind)}</span><time className="text-xs text-muted-foreground" dateTime={event.created_at}>{localTime(event.created_at)}</time></li>)}</ol> : <p className="text-sm text-muted-foreground">Group and trip updates will appear here.</p>}</CardContent></Card>
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
