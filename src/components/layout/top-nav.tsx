import { Bell, Clapperboard, LogOut, Mail, Menu, Search, Settings, Shield, UploadCloud, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/common/logo-mark";
import { canManageSpace } from "@/services/utils/permissions";

const links = [
  { label: "Home", to: "" },
  { label: "Collections", to: "collections" },
  { label: "Seasons", to: "seasons" },
  { label: "Search", to: "search" },
  { label: "My List", to: "my-list" },
];

const adminLinks = [
  { label: "Upload", to: "upload" },
  { label: "Library", to: "library" },
  { label: "Invites", to: "invites" },
];

export function TopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentSpace, signOut, user } = useAuth();
  const { activeProfile } = useProfile();
  const { spaceSlug = "luna-house" } = useParams();
  const membership = user?.memberships.find((item) => item.spaceId === currentSpace?.id);
  const canManageCurrentSpace = membership ? canManageSpace(membership.role) : false;
  const isSuperAdmin = user?.platformRole === "super_admin";
  const notificationTarget = isSuperAdmin
    ? "/platform/spaces"
    : canManageCurrentSpace
      ? `/${spaceSlug}/admin/invites`
      : `/${spaceSlug}/continue-watching`;

  return (
    <header className="sticky top-0 z-40 mb-6 border border-white/10 bg-slate-950/78 px-3 py-2.5 backdrop-blur-xl sm:mb-8 xl:rounded-[2rem] xl:px-5 xl:py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to={`/${spaceSlug}/home`}
            className="flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <LogoMark />
            <div className="hidden sm:block">
              <p className="text-[11px] uppercase tracking-[0.42em] text-gold/75">
                {currentSpace?.name ?? "Reverie"}
              </p>
              <p className="mt-1 text-xs text-white/35">
                Private streaming space
              </p>
            </div>
          </Link>
          <div className="hidden xl:block">
            {(canManageCurrentSpace || isSuperAdmin) ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-white/8 pb-3">
                {canManageCurrentSpace ? (
                  adminLinks.map((link) => (
                    <NavLink
                      key={link.label}
                      className={({ isActive }) =>
                        `rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.24em] transition ${
                          isActive
                            ? "border-gold/40 bg-gold/15 text-white"
                            : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
                        }`
                      }
                      to={`/${spaceSlug}/admin/${link.to}`}
                    >
                      {link.label}
                    </NavLink>
                  ))
                ) : null}
                {isSuperAdmin ? (
                  <NavLink
                    className={({ isActive }) =>
                      `rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.24em] transition ${
                        isActive
                          ? "border-gold/40 bg-gold/15 text-white"
                          : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
                      }`
                    }
                    to="/platform/spaces"
                  >
                    Approvals
                  </NavLink>
                ) : null}
              </div>
            ) : null}
            <nav className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              {links.map((link) => (
                <NavLink
                  key={link.label}
                  className={({ isActive }) =>
                    `text-sm transition ${
                      isActive ? "text-white" : "text-white/55 hover:text-white"
                    }`
                  }
                  to={`/${spaceSlug}/${link.to}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 xl:pt-1">
          <Button
            className="h-11 w-11 xl:hidden"
            size="icon"
            variant="ghost"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((value) => !value)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link to={`/${spaceSlug}/search`}>
            <Button className="hidden h-11 w-11 xl:inline-flex" size="icon" variant="ghost" aria-label="Search">
              <Search className="h-[18px] w-[18px]" />
            </Button>
          </Link>
          <Link to={notificationTarget}>
            <Button
              className="hidden h-11 w-11 xl:inline-flex"
              size="icon"
              variant="ghost"
              aria-label={isSuperAdmin ? "Pending approvals" : canManageCurrentSpace ? "Invites" : "Continue watching"}
            >
              <Bell className="h-[18px] w-[18px]" />
            </Button>
          </Link>
          {canManageCurrentSpace ? (
            <>
              <Link to={`/${spaceSlug}/admin/upload`}>
                <Button
                  className="hidden h-11 w-11 xl:inline-flex"
                  size="icon"
                  variant="ghost"
                  aria-label="Upload media"
                >
                  <UploadCloud className="h-[18px] w-[18px]" />
                </Button>
              </Link>
              <Link to={`/${spaceSlug}/admin/library`}>
                <Button
                  className="hidden h-11 w-11 xl:inline-flex"
                  size="icon"
                  variant="ghost"
                  aria-label="Media library"
                >
                  <Clapperboard className="h-[18px] w-[18px]" />
                </Button>
              </Link>
              <Link to={`/${spaceSlug}/admin/invites`}>
                <Button
                  className="hidden h-11 w-11 xl:inline-flex"
                  size="icon"
                  variant="ghost"
                  aria-label="Invite members"
                >
                  <Mail className="h-[18px] w-[18px]" />
                </Button>
              </Link>
            </>
          ) : null}
          {isSuperAdmin ? (
            <Link to={`/${spaceSlug}/admin/settings`}>
              <Button className="h-11 w-11 xl:h-11 xl:w-11" size="icon" variant="ghost" aria-label="Settings">
                <Settings className="h-[18px] w-[18px]" />
              </Button>
            </Link>
          ) : null}
          {activeProfile ? (
            <Link
              className="ml-1 hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 xl:flex"
              to={`/${spaceSlug}/profiles`}
            >
              <img
                alt={activeProfile.name}
                className="h-9 w-9 rounded-full object-cover"
                src={activeProfile.avatarUrl}
              />
              <span className="pr-2 text-sm text-white/80 2xl:inline">
                {activeProfile.name}
              </span>
            </Link>
          ) : null}
          {isSuperAdmin ? (
            <Link to="/platform/spaces">
              <Button className="hidden xl:inline-flex" size="sm" type="button" variant="secondary">
                <Shield className="h-4 w-4" />
                Control
              </Button>
            </Link>
          ) : null}
          <Button
            className="hidden xl:inline-flex"
            onClick={() => void signOut()}
            size="sm"
            type="button"
            variant="ghost"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 xl:hidden ${
          mobileMenuOpen ? "max-h-[34rem] pt-3 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-2 rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
          <nav className="grid grid-cols-2 gap-2">
            {links.map((link) => (
              <NavLink
                key={link.label}
                className={({ isActive }) =>
                  `rounded-2xl border px-3 py-2.5 text-sm transition ${
                    isActive
                      ? "border-gold/40 bg-gold/15 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:text-white"
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
                to={`/${spaceSlug}/${link.to}`}
              >
                {link.label}
              </NavLink>
            ))}
            {isSuperAdmin ? (
              <NavLink
                className={({ isActive }) =>
                  `rounded-2xl border px-3 py-2.5 text-sm transition ${
                    isActive
                      ? "border-gold/40 bg-gold/15 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:text-white"
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
                to="/platform/spaces"
              >
                Approvals
              </NavLink>
            ) : null}
          </nav>
          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
            {(canManageCurrentSpace || isSuperAdmin) ? (
              <div className="mb-1 w-full text-[11px] uppercase tracking-[0.32em] text-gold/70">
                Admin
              </div>
            ) : null}
            <Link to={`/${spaceSlug}/search`} onClick={() => setMobileMenuOpen(false)}>
              <Button className="h-10 px-4" variant="ghost">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </Link>
            <Link to={notificationTarget} onClick={() => setMobileMenuOpen(false)}>
              <Button className="h-10 px-4" variant="ghost">
                <Bell className="h-4 w-4" />
                {isSuperAdmin ? "Approvals" : canManageCurrentSpace ? "Invites" : "Continue Watching"}
              </Button>
            </Link>
            {canManageCurrentSpace ? (
              <>
                <Link to={`/${spaceSlug}/admin/upload`} onClick={() => setMobileMenuOpen(false)}>
                  <Button className="h-10 px-4" variant="secondary">
                    <UploadCloud className="h-4 w-4" />
                    Upload
                  </Button>
                </Link>
                <Link to={`/${spaceSlug}/admin/library`} onClick={() => setMobileMenuOpen(false)}>
                  <Button className="h-10 px-4" variant="secondary">
                    <Clapperboard className="h-4 w-4" />
                    Library
                  </Button>
                </Link>
                <Link to={`/${spaceSlug}/admin/invites`} onClick={() => setMobileMenuOpen(false)}>
                  <Button className="h-10 px-4" variant="secondary">
                    <Mail className="h-4 w-4" />
                    Invites
                  </Button>
                </Link>
              </>
            ) : null}
            {isSuperAdmin ? (
              <Link to={`/${spaceSlug}/admin/settings`} onClick={() => setMobileMenuOpen(false)}>
                <Button className="h-10 px-4" variant="ghost">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            ) : null}
            {activeProfile ? (
              <Link
                className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
                to={`/${spaceSlug}/profiles`}
              >
                <img
                  alt={activeProfile.name}
                  className="h-8 w-8 rounded-full object-cover"
                  src={activeProfile.avatarUrl}
                />
                <span className="truncate text-sm text-white/80">{activeProfile.name}</span>
              </Link>
            ) : null}
            <Button
              className="h-10 px-4"
              onClick={() => {
                setMobileMenuOpen(false);
                void signOut();
              }}
              type="button"
              variant="ghost"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
