import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { canAccessPlatform, canManageSpace } from "@/services/utils/permissions";

export function AuthGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-white/70">Loading private space...</div>;
  }

  if (!user) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return <Outlet />;
}

export function ProfileGuard() {
  const { activeProfile } = useProfile();
  const { currentSpace, user } = useAuth();
  const { spaceSlug = "luna-house" } = useParams();
  if (!currentSpace) {
    return user?.pendingApproval ? <Navigate replace to="/pending-approval" /> : <Navigate replace to="/login" />;
  }
  if (!activeProfile) {
    return <Navigate replace to={`/${spaceSlug}/profiles`} />;
  }
  return <Outlet />;
}

export function SpaceAdminGuard() {
  const { user, currentSpace } = useAuth();
  if (!currentSpace) {
    return user?.pendingApproval ? <Navigate replace to="/pending-approval" /> : <Navigate replace to="/login" />;
  }
  const membership = user?.memberships.find((item) => item.spaceId === currentSpace?.id);
  if (!membership || !canManageSpace(membership.role)) {
    return <Navigate replace to={`/${currentSpace?.slug ?? "luna-house"}/home`} />;
  }
  return <Outlet />;
}

export function PlatformAdminGuard() {
  const { user } = useAuth();
  if (!user || !canAccessPlatform(user.platformRole)) {
    return <Navigate replace to="/login" />;
  }
  return <Outlet />;
}
