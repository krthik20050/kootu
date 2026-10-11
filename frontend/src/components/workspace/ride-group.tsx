"use client";

import { DriverLocationPin } from "./driver-location";

import { RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { GroupResponse, RequestResponse } from "@/lib/api/generated";
import { localTime, readable } from "./shared";

export function RideGroup({ ride, group, busy, matching, onMatch, onRefresh }: {
  ride: RequestResponse;
  group?: GroupResponse;
  busy: boolean;
  matching: boolean;
  onMatch: () => void;
  onRefresh: () => void;
}) {
  return <Card className="ride-group-card">
    <CardHeader>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>Your ride group</CardTitle>
        <Badge variant="secondary">{group ? readable(group.status) : readable(ride.status)}</Badge>
      </div>
      <CardDescription>{group ? "Your shared ride details" : ride.group_id ? "Group details could not be loaded. Refresh to try again." : "Find passengers with compatible arrivals and nearby drop-offs."}</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      {group ? <>
        <dl className="grid grid-cols-2 gap-3">
          {[["Passengers", String(group.passengers)], ["Luggage", `${group.luggage} bags`], ["Departure", localTime(group.departure_at)], ["Drop-off area", group.destination_cluster || "Not available"], ["Vehicle", group.vehicle?.registration || "Awaiting assignment"], ["Women-only group", group.women_only ? "Yes" : "No"]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="m-0 mt-1 text-sm">{value}</dd></div>)}
        </dl>
        <DriverLocationPin location={group.driver_location} />
        {group.events.length > 0 && <ol aria-label="Recent group updates" className="flex flex-col gap-2 text-xs text-muted-foreground">{group.events.slice(-3).reverse().map((event, index) => <li key={`${event.created_at}-${index}`}>{readable(event.kind)} · <time dateTime={event.created_at}>{localTime(event.created_at)}</time></li>)}</ol>}
      </> : ride.status === "WAITING" && <p className="text-sm text-muted-foreground">{matching ? "Checking compatible passengers and available vehicles…" : "Your request is saved. Look for a group when you’re ready."}</p>}
      <div className="flex flex-wrap gap-2">
        <p className="w-full text-sm text-muted-foreground">Agree the fare and your share with the driver before travel. Pay the driver directly; kootu does not collect or confirm payments in this MVP.</p>
        {ride.status === "WAITING" && !group && <Button type="button" size="sm" disabled={busy} onClick={onMatch}><Users data-icon="inline-start" aria-hidden="true" />{matching ? "Finding a group…" : "Find a group"}</Button>}
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onRefresh}><RefreshCw data-icon="inline-start" aria-hidden="true" />Refresh</Button>
      </div>
      {matching && <p role="status" className="text-xs text-muted-foreground">Matching can take a moment. Keep this page open.</p>}
    </CardContent>
  </Card>;
}
