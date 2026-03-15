import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { LoginCard } from "@/components/auth/LoginCard";
import { LogoMark } from "@/components/common/logo-mark";
import { IntroScreen } from "@/components/intro/IntroScreen";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";

export function SpaceLoginPage() {
  const { currentSpace, rememberedSpaceSlug, signIn, signInWithGoogle, signUp, user } = useAuth();
  const { activeProfile } = useProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (currentSpace) {
      navigate(
        activeProfile ? `/${currentSpace.slug}/home` : `/${currentSpace.slug}/profiles`,
        { replace: true },
      );
      return;
    }

    if (user?.pendingApproval) {
      navigate("/pending-approval", { replace: true });
    }
  }, [activeProfile, currentSpace, navigate, user]);

  return (
    <div className="min-h-screen bg-hero-glow">
      {!introDone ? <IntroScreen onComplete={() => setIntroDone(true)} soundEnabled /> : null}
      <div className="grid min-h-screen items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14">
        <div className="hidden lg:block">
          <LogoMark large />
          <p className="mt-6 max-w-xl font-display text-6xl leading-[0.92] text-white">
            Your private memories, staged like cinema.
          </p>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">
            Reverie turns home videos and photo stories into a premium streaming space for the people who lived them.
          </p>
        </div>
        <div className="flex justify-center">
          <LoginCard
            initialEmail={searchParams.get("email") ?? undefined}
            initialSpaceSlug={searchParams.get("space") ?? undefined}
            rememberedSpaceSlug={searchParams.get("space") ?? undefined ? undefined : rememberedSpaceSlug}
            onEmailSubmit={async (values, mode) => {
              try {
                const result =
                  mode === "sign_in"
                    ? await signIn(values)
                    : await signUp(values);
                navigate(result.space ? `/${result.space.slug}/profiles` : "/pending-approval");
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Unable to continue with that account.",
                );
              }
            }}
            onGoogle={async (spaceSlug) => {
              try {
                const result = await signInWithGoogle(spaceSlug);
                navigate(result.space ? `/${result.space.slug}/profiles` : "/pending-approval");
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Unable to continue with Google right now.",
                );
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
