import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useProfile } from "@/context/ProfileContext";

export function ProfilesManagementPage() {
  const { profiles, loading } = useProfile();

  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <h1 className="font-display text-5xl text-white">Profiles</h1>
        {loading ? (
          <div className="mt-8 text-white/60">Loading profiles...</div>
        ) : profiles.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5"
              >
                <img
                  alt={profile.name}
                  className="h-40 w-full rounded-[1.2rem] object-cover"
                  src={profile.avatarUrl}
                />
                <p className="mt-4 font-display text-3xl text-white">{profile.name}</p>
                <p className="mt-2 text-sm text-white/60">{profile.subtitle}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
            No profiles found for this space yet.
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
