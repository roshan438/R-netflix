import { DashboardLayout } from "@/components/layout/dashboard-layout";

export function ActivityModerationPage() {
  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <h1 className="font-display text-5xl text-white">Activity & Moderation</h1>
        <p className="mt-4 text-sm text-white/65">Activity logs, moderation events, and platform analytics rollups belong here.</p>
      </section>
    </DashboardLayout>
  );
}
