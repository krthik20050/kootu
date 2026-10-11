import AppShell from "@/components/driver-dashboard/AppShell";
import HeroBanner from "@/components/driver-dashboard/HeroBanner";
import MetricsGrid from "@/components/driver-dashboard/MetricsGrid";
import OpportunitiesSchedule from "@/components/driver-dashboard/OpportunitiesSchedule";

export default function DriverPage() {
  return (
    <AppShell title="Overview" subtitle="DRIVER WORKSPACE">
      <HeroBanner />
      <MetricsGrid />
      <OpportunitiesSchedule />
    </AppShell>
  );
}
