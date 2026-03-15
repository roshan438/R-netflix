import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";

export function SettingsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.platformRole === "super_admin";

  return (
    <DashboardLayout>
      <section className="grid gap-5 xl:grid-cols-2">
        <div className="glass-panel rounded-[2rem] p-8">
          <h1 className="font-display text-5xl text-white">Space Settings</h1>
          <div className="mt-8 space-y-4 text-sm text-white/65">
            <p>Intro sound enabled</p>
            <p>Autoplay next enabled</p>
            <p>Profile selection enabled</p>
            <p>Branding accent color</p>
          </div>
        </div>
        <div className="glass-panel rounded-[2rem] p-8">
          <h2 className="font-display text-4xl text-white">Future Billing Placeholder</h2>
          <p className="mt-4 text-sm leading-7 text-white/65">
            This tenant settings surface is ready for Stripe customer IDs, plan status, trial windows, storage tiers, and seat limits.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.34em] text-gold/80">Platform Access</p>
            <h3 className="mt-3 font-display text-3xl text-white">Promote This Account</h3>
            <p className="mt-3 text-sm leading-7 text-white/65">
              Use this once in your dev environment to grant your current account platform-super-admin access and unlock the dedicated space creation dashboard.
            </p>
            <Button
              className="mt-5"
              disabled={isSuperAdmin}
              onClick={async () => {
                if (!user?.id || !isFirebaseConfigured || !firestoreDb) {
                  toast.error("Firebase must be configured before promoting an account.");
                  return;
                }

                try {
                  await updateDoc(doc(firestoreDb, "users", user.id), {
                    platformRole: "super_admin",
                    updatedAt: serverTimestamp(),
                  });
                  toast.success("This account is now a platform super admin. Reloading...");
                  window.setTimeout(() => window.location.reload(), 700);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not promote account.");
                }
              }}
              type="button"
            >
              {isSuperAdmin ? "Already Platform Super Admin" : "Promote To Platform Admin"}
            </Button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
