"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, LayoutDashboard, List, History, User, CircleHelp, Wallet } from "lucide-react";
const links = [
  ["/driver", "Overview", LayoutDashboard], ["/driver/ride-requests", "Ride requests", Car],
  ["/driver/my-trips", "My trips", List], ["/driver/ride-history", "Ride history", History],
  ["/driver/profile", "Profile & vehicles", User], ["/driver/earnings", "Earnings", Wallet],
  ["/driver/help", "Help", CircleHelp],
] as const;
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <div className="driver-sidebar"><Link href="/" className="driver-brand">kootu.</Link>
    <p className="eyebrow">DRIVER WORKSPACE</p><nav aria-label="Driver navigation">{links.map(([href, label, Icon]) =>
      <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={onNavigate}><Icon size={18} />{label}</Link>
    )}</nav><Link className="driver-passenger-link" href="/dashboard">Passenger workspace →</Link></div>;
}
