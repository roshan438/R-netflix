import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function PendingApprovalPage() {
  const { user, currentSpace, signOut } = useAuth();

  if (currentSpace) {
    return <Navigate replace to={`/${currentSpace.slug}/profiles`} />;
  }

  if (!user?.pendingApproval) {
    return <Navigate replace to="/login" />;
  }

  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.34em] text-gold/80">Pending Approval</p>
        <h1 className="mt-4 font-display text-5xl text-white sm:text-6xl">
          Your private space is waiting for approval.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
          A super admin will review your request and assign your dedicated space before you can
          start inviting members and uploading memories.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Requested Space</p>
            <p className="mt-3 font-display text-3xl text-white">
              {user.pendingApproval.requestedSpaceName}
            </p>
            <p className="mt-2 text-sm text-white/55">{user.pendingApproval.requestedSpaceSlug}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Account</p>
            <p className="mt-3 text-lg text-white">{user.displayName}</p>
            <p className="mt-2 text-sm text-white/55">{user.email}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => void signOut()} type="button" variant="secondary">
            Sign Out
          </Button>
        </div>
      </section>
    </DashboardLayout>
  );
}
