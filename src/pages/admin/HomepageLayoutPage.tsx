import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { demoHomepageRows } from "@/lib/demo-data";

export function HomepageLayoutPage() {
  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <h1 className="font-display text-5xl text-white">Homepage Layout</h1>
        <div className="mt-8 space-y-4">
          {demoHomepageRows.map((row, index) => (
            <div key={row.id} className="flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
              <div>
                <p className="font-display text-3xl text-white">{row.title}</p>
                <p className="mt-1 text-sm text-white/60">{row.type}</p>
              </div>
              <p className="text-sm text-white/45">Order {index + 1}</p>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
