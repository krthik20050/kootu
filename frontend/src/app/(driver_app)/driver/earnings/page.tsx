import AppShell from "@/components/driver-dashboard/AppShell";
import Link from "next/link";
export default function Page() { return <AppShell title="Earnings"><section className="driver-panel"><h2>Earnings</h2><p>Kootu currently coordinates shared rides. Fare calculation, payments, receipts and payouts are not implemented. No earnings balance is available.</p><Link className="action" href="/driver">Return to driver overview</Link></section></AppShell>; }
