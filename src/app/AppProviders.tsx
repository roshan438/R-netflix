import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { ProfileProvider } from "@/context/ProfileContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <PlayerProvider>{children}</PlayerProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
