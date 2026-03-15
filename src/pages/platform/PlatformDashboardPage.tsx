import { DashboardLayout } from "@/components/layout/dashboard-layout";

export function PlatformDashboardPage() {
  return (
    <DashboardLayout>
      <section className="grid gap-4 xl:grid-cols-4">
        {[
          ["Active Spaces", "14"],
          ["Trialing", "3"],
          ["Suspended", "1"],
          ["Monthly Streams", "18.2k"],
        ].map(([label, value]) => (
          <div key={label} className="glass-panel rounded-[1.8rem] p-6">
            <p className="text-sm text-white/55">{label}</p>
            <p className="mt-3 font-display text-5xl text-white">{value}</p>
          </div>
        ))}
      </section>
    </DashboardLayout>
  );
}
