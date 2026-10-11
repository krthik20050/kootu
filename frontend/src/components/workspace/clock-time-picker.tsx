"use client";

import { useState } from "react";
import { Clock3, Minus, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDashboardTheme } from "@/components/ui/app-1-utils/dashboard-theme";
import { cn } from "@/lib/utils";

type TimeValue = { time: string; date: string };

function splitTime(time: string) {
  const [hours, minutes] = (time || "12:00").split(":").map(Number);
  return { hours: String(hours % 12 || 12), minutes: String(minutes).padStart(2, "0"), period: hours >= 12 ? "PM" : "AM" };
}

function displayTime(time: string) {
  if (!time) return "Choose pickup time";
  const { hours, minutes, period } = splitTime(time);
  return `${hours}:${minutes} ${period}`;
}

export function ClockTimePicker({ value, date, suggestion, disabled, onChange }: {
  value: string;
  date: string;
  suggestion?: TimeValue | null;
  disabled: boolean;
  onChange: (value: TimeValue) => void;
}) {
  const { theme } = useDashboardTheme();
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState("12");
  const [minutes, setMinutes] = useState("00");
  const [period, setPeriod] = useState("PM");
  const [day, setDay] = useState(date);
  const [mode, setMode] = useState<"hours" | "minutes">("hours");
  const hour = Number(hours);
  const minute = Number(minutes);
  const valid = hours !== "" && minutes !== "" && Number.isInteger(hour) && hour >= 1 && hour <= 12 && Number.isInteger(minute) && minute >= 0 && minute <= 59;
  const selected = mode === "hours" ? hour % 12 : minute / 5;
  const angle = valid ? (mode === "hours" ? hour % 12 * 30 : minute * 6) : 0;

  function selectTime(time: TimeValue) {
    const parts = splitTime(time.time);
    setHours(parts.hours); setMinutes(parts.minutes); setPeriod(parts.period); setDay(time.date);
  }

  function adjustTime(amount: number) {
    if (!valid) return;
    const hour24 = hour % 12 + (period === "PM" ? 12 : 0);
    // UTC arithmetic preserves the displayed IST wall time through midnight.
    const adjusted = new Date(`${day}T${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`);
    adjusted.setUTCMinutes(adjusted.getUTCMinutes() + amount);
    if (!Number.isFinite(adjusted.getTime())) return;
    const iso = adjusted.toISOString();
    selectTime({ date: iso.slice(0, 10), time: iso.slice(11, 16) });
  }

  function apply() {
    if (!valid || disabled) return;
    const hour24 = hour % 12 + (period === "PM" ? 12 : 0);
    onChange({ date: day, time: `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}` });
    setOpen(false);
  }

  return <Sheet open={open && !disabled} onOpenChange={next => {
    if (next) { selectTime({ time: value || suggestion?.time || "12:00", date: value ? date : suggestion?.date || date }); setMode("hours"); }
    setOpen(next);
  }}>
    <SheetTrigger asChild>
      <Button id="pickup-ready-time" type="button" variant="outline" disabled={disabled} aria-describedby="pickup-time-help" className="clock-time-trigger">
        <Clock3 data-icon="inline-start" aria-hidden="true" /><span>{displayTime(value)}</span><span className="text-xs text-muted-foreground">IST</span>
      </Button>
    </SheetTrigger>
    <SheetContent side="bottom" className="app1-dashboard clock-time-sheet" data-theme={theme}>
      <SheetHeader>
        <SheetTitle>Choose pickup-ready time</SheetTitle>
        <SheetDescription>Tap the clock or enter a time. All times are in IST.</SheetDescription>
      </SheetHeader>
      <div className="clock-time-body">
        <div className="clock-time-fields">
          <div className="flex flex-col gap-2"><Label htmlFor="pickup-hour">Hour</Label><Input id="pickup-hour" type="number" min={1} max={12} step={1} inputMode="numeric" value={hours} aria-invalid={hours === "" || hour < 1 || hour > 12 || !Number.isInteger(hour)} onFocus={() => setMode("hours")} onChange={event => setHours(event.target.value)} /></div>
          <span className="clock-time-colon" aria-hidden="true">:</span>
          <div className="flex flex-col gap-2"><Label htmlFor="pickup-minute">Minute</Label><Input id="pickup-minute" type="number" min={0} max={59} step={1} inputMode="numeric" value={minutes} aria-invalid={minutes === "" || minute < 0 || minute > 59 || !Number.isInteger(minute)} onFocus={() => setMode("minutes")} onChange={event => setMinutes(event.target.value)} /></div>
          <fieldset className="clock-time-period"><legend className="sr-only">AM or PM</legend>{["AM", "PM"].map(option => <label key={option}><input type="radio" name="pickup-period" value={option} checked={period === option} onChange={() => setPeriod(option)} /><span>{option}</span></label>)}</fieldset>
        </div>
        <div className="flex justify-center gap-2">
          <Button type="button" variant={mode === "hours" ? "secondary" : "ghost"} size="sm" aria-pressed={mode === "hours"} onClick={() => setMode("hours")}>Hours</Button>
          <Button type="button" variant={mode === "minutes" ? "secondary" : "ghost"} size="sm" aria-pressed={mode === "minutes"} onClick={() => setMode("minutes")}>Minutes</Button>
        </div>
        <div className="clock-time-dial" role="group" aria-label={mode === "hours" ? `Choose hour in ${period}` : "Choose minutes"}>
          <span className="clock-time-hand" aria-hidden="true" style={{ transform: `rotate(${angle}deg)` }} /><span className="clock-time-center" aria-hidden="true" />
          {Array.from({ length: 12 }, (_, index) => {
            const number = mode === "hours" ? index || 12 : index * 5;
            const radians = index * Math.PI / 6;
            return <Button key={index} type="button" variant={selected === index ? "default" : "ghost"} size="icon" className="clock-time-number" aria-label={mode === "hours" ? `${number} ${period}` : `${number} minutes`} aria-pressed={selected === index} style={{ left: `${50 + Math.sin(radians) * 39}%`, top: `${50 - Math.cos(radians) * 39}%` }} onClick={() => {
              if (mode === "hours") { setHours(String(number)); setMode("minutes"); }
              else setMinutes(String(number).padStart(2, "0"));
            }}>{mode === "minutes" ? String(number).padStart(2, "0") : number}</Button>;
          })}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={!valid} onClick={() => adjustTime(-5)} aria-label="5 minutes earlier"><Minus data-icon="inline-start" aria-hidden="true" />5 min</Button>
          <span className="text-xs text-muted-foreground">Fine-tune</span>
          <Button type="button" variant="outline" size="sm" disabled={!valid} onClick={() => adjustTime(5)} aria-label="5 minutes later"><Plus data-icon="inline-start" aria-hidden="true" />5 min</Button>
        </div>
        {suggestion && <Button type="button" variant="ghost" size="sm" onClick={() => selectTime(suggestion)}><Sparkles data-icon="inline-start" aria-hidden="true" />Use flight suggestion · {displayTime(suggestion.time)}</Button>}
        <p className={cn("text-center text-xs", valid ? "text-muted-foreground" : "text-destructive")} role="status">{valid ? `Pickup on ${day} · India time (UTC+05:30)` : "Enter an hour from 1–12 and minutes from 00–59."}</p>
      </div>
      <SheetFooter className="gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="button" disabled={!valid || disabled} onClick={apply}>Use {valid ? displayTime(`${String(hour % 12 + (period === "PM" ? 12 : 0)).padStart(2, "0")}:${String(minute).padStart(2, "0")}`) : "time"}</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>;
}
