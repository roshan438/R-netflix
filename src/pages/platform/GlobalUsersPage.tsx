import { DashboardLayout } from "@/components/layout/dashboard-layout";

export function GlobalUsersPage() {
  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <h1 className="font-display text-5xl text-white">Global Users</h1>
        <p className="mt-4 text-sm text-white/65">Cross-tenant account management placeholder.</p>
      </section>
    </DashboardLayout>
  );
}
