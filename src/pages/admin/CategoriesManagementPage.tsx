import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { demoCategories } from "@/lib/demo-data";

export function CategoriesManagementPage() {
  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <h1 className="font-display text-5xl text-white">Categories</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {demoCategories.map((item) => (
            <div key={item.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="font-display text-3xl text-white">{item.name}</p>
              <p className="mt-2 text-sm text-white/60">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
