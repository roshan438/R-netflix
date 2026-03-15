import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import { AppProviders } from "@/app/AppProviders";
import {
  AuthGuard,
  PlatformAdminGuard,
  ProfileGuard,
  SpaceAdminGuard,
} from "@/routes/guards";

const SpaceLoginPage = lazy(() =>
  import("@/pages/auth/SpaceLoginPage").then((module) => ({
    default: module.SpaceLoginPage,
  })),
);
const InviteAcceptancePage = lazy(() =>
  import("@/pages/auth/InviteAcceptancePage").then((module) => ({
    default: module.InviteAcceptancePage,
  })),
);
const ProfileSelectionPage = lazy(() =>
  import("@/pages/auth/ProfileSelectionPage").then((module) => ({
    default: module.ProfileSelectionPage,
  })),
);
const PendingApprovalPage = lazy(() =>
  import("@/pages/auth/PendingApprovalPage").then((module) => ({
    default: module.PendingApprovalPage,
  })),
);
const HomePage = lazy(() =>
  import("@/pages/app/HomePage").then((module) => ({ default: module.HomePage })),
);
const CollectionsBrowsePage = lazy(() =>
  import("@/pages/app/CollectionsBrowsePage").then((module) => ({
    default: module.CollectionsBrowsePage,
  })),
);
const CollectionDetailPage = lazy(() =>
  import("@/pages/app/CollectionDetailPage").then((module) => ({
    default: module.CollectionDetailPage,
  })),
);
const CategoryPage = lazy(() =>
  import("@/pages/app/CategoryPage").then((module) => ({ default: module.CategoryPage })),
);
const SeasonsBrowsePage = lazy(() =>
  import("@/pages/app/SeasonsBrowsePage").then((module) => ({
    default: module.SeasonsBrowsePage,
  })),
);
const SeasonPage = lazy(() =>
  import("@/pages/app/SeasonPage").then((module) => ({ default: module.SeasonPage })),
);
const SearchPage = lazy(() =>
  import("@/pages/app/SearchPage").then((module) => ({ default: module.SearchPage })),
);
const FavoritesPage = lazy(() =>
  import("@/pages/app/FavoritesPage").then((module) => ({
    default: module.FavoritesPage,
  })),
);
const ContinueWatchingPage = lazy(() =>
  import("@/pages/app/ContinueWatchingPage").then((module) => ({
    default: module.ContinueWatchingPage,
  })),
);
const PlayerPage = lazy(() =>
  import("@/pages/app/PlayerPage").then((module) => ({ default: module.PlayerPage })),
);
const AdminDashboardPage = lazy(() =>
  import("@/pages/admin/AdminDashboardPage").then((module) => ({
    default: module.AdminDashboardPage,
  })),
);
const MediaUploadPage = lazy(() =>
  import("@/pages/admin/MediaUploadPage").then((module) => ({
    default: module.MediaUploadPage,
  })),
);
const MediaLibraryPage = lazy(() =>
  import("@/pages/admin/MediaLibraryPage").then((module) => ({
    default: module.MediaLibraryPage,
  })),
);
const CollectionsManagementPage = lazy(() =>
  import("@/pages/admin/CollectionsManagementPage").then((module) => ({
    default: module.CollectionsManagementPage,
  })),
);
const CategoriesManagementPage = lazy(() =>
  import("@/pages/admin/CategoriesManagementPage").then((module) => ({
    default: module.CategoriesManagementPage,
  })),
);
const SeasonsManagementPage = lazy(() =>
  import("@/pages/admin/SeasonsManagementPage").then((module) => ({
    default: module.SeasonsManagementPage,
  })),
);
const ProfilesManagementPage = lazy(() =>
  import("@/pages/admin/ProfilesManagementPage").then((module) => ({
    default: module.ProfilesManagementPage,
  })),
);
const MemberInviteManagementPage = lazy(() =>
  import("@/pages/admin/MemberInviteManagementPage").then((module) => ({
    default: module.MemberInviteManagementPage,
  })),
);
const HomepageLayoutPage = lazy(() =>
  import("@/pages/admin/HomepageLayoutPage").then((module) => ({
    default: module.HomepageLayoutPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/pages/admin/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);
const PlatformDashboardPage = lazy(() =>
  import("@/pages/platform/PlatformDashboardPage").then((module) => ({
    default: module.PlatformDashboardPage,
  })),
);
const SpacesManagementPage = lazy(() =>
  import("@/pages/platform/SpacesManagementPage").then((module) => ({
    default: module.SpacesManagementPage,
  })),
);
const TenantDetailsPage = lazy(() =>
  import("@/pages/platform/TenantDetailsPage").then((module) => ({
    default: module.TenantDetailsPage,
  })),
);
const GlobalUsersPage = lazy(() =>
  import("@/pages/platform/GlobalUsersPage").then((module) => ({
    default: module.GlobalUsersPage,
  })),
);
const ActivityModerationPage = lazy(() =>
  import("@/pages/platform/ActivityModerationPage").then((module) => ({
    default: module.ActivityModerationPage,
  })),
);
const BillingReadyPage = lazy(() =>
  import("@/pages/platform/BillingReadyPage").then((module) => ({
    default: module.BillingReadyPage,
  })),
);

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas text-white/65">
      Loading screen...
    </div>
  );
}

function lazyElement(element: ReactNode) {
  return <Suspense fallback={<RouteLoader />}>{element}</Suspense>;
}

function withProviders(element: ReactNode) {
  return <AppProviders>{element}</AppProviders>;
}

function SpaceRootRedirect() {
  const { spaceSlug = "" } = useParams();
  return <Navigate replace to={`/${spaceSlug}/home`} />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: withProviders(<Navigate replace to="/login" />),
  },
  {
    path: "/login",
    element: withProviders(lazyElement(<SpaceLoginPage />)),
  },
  {
    path: "/invite/:spaceSlug/:token",
    element: withProviders(lazyElement(<InviteAcceptancePage />)),
  },
  {
    element: withProviders(<AuthGuard />),
    children: [
      {
        path: "/pending-approval",
        element: lazyElement(<PendingApprovalPage />),
      },
      {
        path: "/:spaceSlug/profiles",
        element: lazyElement(<ProfileSelectionPage />),
      },
      {
        path: "/:spaceSlug",
        element: <SpaceRootRedirect />,
      },
      {
        element: <ProfileGuard />,
        children: [
          { path: "/:spaceSlug/home", element: lazyElement(<HomePage />) },
          {
            path: "/:spaceSlug/collections",
            element: lazyElement(<CollectionsBrowsePage />),
          },
          {
            path: "/:spaceSlug/collections/:collectionId",
            element: lazyElement(<CollectionDetailPage />),
          },
          {
            path: "/:spaceSlug/categories/:categoryId",
            element: lazyElement(<CategoryPage />),
          },
          {
            path: "/:spaceSlug/seasons",
            element: lazyElement(<SeasonsBrowsePage />),
          },
          {
            path: "/:spaceSlug/seasons/:seasonId",
            element: lazyElement(<SeasonPage />),
          },
          { path: "/:spaceSlug/search", element: lazyElement(<SearchPage />) },
          { path: "/:spaceSlug/my-list", element: lazyElement(<FavoritesPage />) },
          {
            path: "/:spaceSlug/continue-watching",
            element: lazyElement(<ContinueWatchingPage />),
          },
          { path: "/:spaceSlug/player/:mediaId", element: lazyElement(<PlayerPage />) },
        ],
      },
      {
        element: <SpaceAdminGuard />,
        children: [
          { path: "/:spaceSlug/admin", element: lazyElement(<AdminDashboardPage />) },
          { path: "/:spaceSlug/admin/upload", element: lazyElement(<MediaUploadPage />) },
          { path: "/:spaceSlug/admin/library", element: lazyElement(<MediaLibraryPage />) },
          {
            path: "/:spaceSlug/admin/collections",
            element: lazyElement(<CollectionsManagementPage />),
          },
          {
            path: "/:spaceSlug/admin/categories",
            element: lazyElement(<CategoriesManagementPage />),
          },
          {
            path: "/:spaceSlug/admin/seasons",
            element: lazyElement(<SeasonsManagementPage />),
          },
          {
            path: "/:spaceSlug/admin/profiles",
            element: lazyElement(<ProfilesManagementPage />),
          },
          {
            path: "/:spaceSlug/admin/invites",
            element: lazyElement(<MemberInviteManagementPage />),
          },
          {
            path: "/:spaceSlug/admin/homepage",
            element: lazyElement(<HomepageLayoutPage />),
          },
          {
            path: "/:spaceSlug/admin/settings",
            element: lazyElement(<SettingsPage />),
          },
        ],
      },
      {
        element: <PlatformAdminGuard />,
        children: [
          { path: "/platform", element: lazyElement(<PlatformDashboardPage />) },
          {
            path: "/platform/spaces",
            element: lazyElement(<SpacesManagementPage />),
          },
          {
            path: "/platform/spaces/:spaceId",
            element: lazyElement(<TenantDetailsPage />),
          },
          { path: "/platform/users", element: lazyElement(<GlobalUsersPage />) },
          {
            path: "/platform/activity",
            element: lazyElement(<ActivityModerationPage />),
          },
          {
            path: "/platform/billing",
            element: lazyElement(<BillingReadyPage />),
          },
        ],
      },
    ],
  },
]);
