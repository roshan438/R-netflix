import type { ReactNode } from "react";
import { PageShell } from "@/components/common/page-shell";
import { TopNav } from "@/components/layout/top-nav";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <PageShell>
      <TopNav />
      {children}
    </PageShell>
  );
}
