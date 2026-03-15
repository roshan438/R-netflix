import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { demoSeasons } from "@/lib/demo-data";

export function SeasonsManagementPage() {
  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <h1 className="font-display text-5xl text-white">Seasons</h1>
        <div className="mt-8 space-y-4">
          {demoSeasons.map((item) => (
            <div key={item.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="font-display text-3xl text-white">{item.title}</p>
              <p className="mt-2 text-sm text-white/60">
                {item.type === "auto_year" ? "Automatic year season" : "Custom editorial season"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
