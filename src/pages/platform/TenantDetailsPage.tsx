import { DashboardLayout } from "@/components/layout/dashboard-layout";

export function TenantDetailsPage() {
  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <h1 className="font-display text-5xl text-white">Tenant Details</h1>
        <p className="mt-4 text-sm leading-7 text-white/65">
          Platform moderation, space suspension, audit views, and billing state should converge here in production.
        </p>
      </section>
    </DashboardLayout>
  );
}
