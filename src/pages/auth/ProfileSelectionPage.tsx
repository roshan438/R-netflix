import { Navigate, useNavigate, useParams } from "react-router-dom";
import { PageShell } from "@/components/common/page-shell";
import { LogoMark } from "@/components/common/logo-mark";
import { ProfilePicker } from "@/components/profiles/ProfilePicker";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";

export function ProfileSelectionPage() {
  const { currentSpace, user } = useAuth();
  const { profiles, loading, setActiveProfile } = useProfile();
  const navigate = useNavigate();
  const { spaceSlug = "luna-house" } = useParams();

  if (!currentSpace) {
    return user?.pendingApproval ? <Navigate replace to="/pending-approval" /> : <Navigate replace to="/login" />;
  }

  return (
    <PageShell className="flex min-h-screen flex-col">
      <div className="pt-5">
        <LogoMark />
      </div>
      <div className="flex-1 place-content-center">
        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center text-white/60">
            Loading profiles...
          </div>
        ) : profiles.length ? (
          <ProfilePicker
            onSelect={(profile) => {
              setActiveProfile(profile);
              navigate(`/${spaceSlug}/home`);
            }}
            profiles={profiles}
          />
        ) : (
          <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] px-8 text-center">
            <p className="text-xs uppercase tracking-[0.34em] text-gold/80">
              No Profiles Yet
            </p>
            <h1 className="mt-4 font-display text-5xl text-white">
              This space needs its first profiles
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65">
              Ask the space admin to create profiles in the admin dashboard before entering the streaming experience.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
