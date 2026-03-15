import { Link } from "react-router-dom";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { UploadStudio } from "@/components/admin/UploadStudio";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";

export function AdminDashboardPage() {
  const { currentSpace, user } = useAuth();
  const isSuperAdmin = user?.platformRole === "super_admin";

  return (
    <DashboardLayout>
      {currentSpace ? (
        <section className="mb-8 glass-panel flex flex-wrap items-center justify-between gap-4 rounded-[1.8rem] p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-gold/80">Private Space</p>
            <p className="mt-2 font-display text-4xl text-white">{currentSpace.name}</p>
            <p className="mt-1 text-sm text-white/55">Slug: {currentSpace.slug}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={`/${currentSpace.slug}/admin/upload`}>
              <Button variant="secondary">Upload Memory</Button>
            </Link>
            <Link to={`/${currentSpace.slug}/admin/invites`}>
              <Button variant="secondary">Invite Members</Button>
            </Link>
            {isSuperAdmin ? (
              <Link to={`/${currentSpace.slug}/admin/settings`}>
                <Button variant="secondary">Open Settings</Button>
              </Link>
            ) : (
              <Button
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
                variant="secondary"
              >
                Become Super Admin
              </Button>
            )}
          </div>
        </section>
      ) : null}
      <UploadStudio />
    </DashboardLayout>
  );
}
