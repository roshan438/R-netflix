import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-hero-glow px-4 pb-14 pt-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
