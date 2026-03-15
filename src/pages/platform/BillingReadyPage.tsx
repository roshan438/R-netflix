import { DashboardLayout } from "@/components/layout/dashboard-layout";

export function BillingReadyPage() {
  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <h1 className="font-display text-5xl text-white">Billing Ready</h1>
        <p className="mt-4 text-sm leading-7 text-white/65">
          Future Stripe plans, subscriptions, trial management, webhooks, and account provisioning hooks will connect here.
        </p>
      </section>
    </DashboardLayout>
  );
}
