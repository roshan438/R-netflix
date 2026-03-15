import { Bell, Clapperboard, Mail, Menu, Search, Settings, UploadCloud, X } from "lucide-react";
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

export function TopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentSpace, user } = useAuth();
  const { activeProfile } = useProfile();
  const { spaceSlug = "luna-house" } = useParams();
  const membership = user?.memberships.find((item) => item.spaceId === currentSpace?.id);
  const canManageCurrentSpace = membership ? canManageSpace(membership.role) : false;
  const isSuperAdmin = user?.platformRole === "super_admin";

  return (
    <header className="sticky top-0 z-40 mb-6 border border-white/10 bg-slate-950/70 px-3 py-2.5 backdrop-blur-xl sm:mb-8 xl:rounded-full xl:px-4 xl:py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3 sm:gap-6">
          <Link
            to={`/${spaceSlug}/home`}
            className="flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <LogoMark />
            <div className="hidden sm:block">
              <p className="text-xs uppercase tracking-[0.34em] text-white/45">
                {currentSpace?.name ?? "Reverie"}
              </p>
            </div>
          </Link>
          <nav className="hidden items-center gap-5 xl:flex">
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
            {canManageCurrentSpace ? (
              <>
                <NavLink
                  className={({ isActive }) =>
                    `text-sm transition ${
                      isActive ? "text-white" : "text-white/55 hover:text-white"
                    }`
                  }
                  to={`/${spaceSlug}/admin/upload`}
                >
                  Upload
                </NavLink>
                <NavLink
                  className={({ isActive }) =>
                    `text-sm transition ${
                      isActive ? "text-white" : "text-white/55 hover:text-white"
                    }`
                  }
                  to={`/${spaceSlug}/admin/library`}
                >
                  Library
                </NavLink>
                <NavLink
                  className={({ isActive }) =>
                    `text-sm transition ${
                      isActive ? "text-white" : "text-white/55 hover:text-white"
                    }`
                  }
                  to={`/${spaceSlug}/admin/invites`}
                >
                  Invites
                </NavLink>
              </>
            ) : null}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            className="h-11 w-11 xl:hidden"
            size="icon"
            variant="ghost"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((value) => !value)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Button className="hidden h-11 w-11 xl:inline-flex" size="icon" variant="ghost" aria-label="Search">
            <Search className="h-[18px] w-[18px]" />
          </Button>
          <Button
            className="hidden h-11 w-11 xl:inline-flex"
            size="icon"
            variant="ghost"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
          </Button>
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
              className="ml-2 hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 xl:flex"
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
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 xl:hidden ${
          mobileMenuOpen ? "max-h-[28rem] pt-3 opacity-100" : "max-h-0 opacity-0"
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
          </nav>
          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
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
          </div>
        </div>
      </div>
    </header>
  );
}
