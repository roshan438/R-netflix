import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { spaceService } from "@/services/firebase/spaces";
import type { SpaceAccessRequest, SpaceSummary } from "@/types/domain";

export function SpacesManagementPage() {
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [pendingRequests, setPendingRequests] = useState<SpaceAccessRequest[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  async function loadSpaces() {
    const [results, requests] = await Promise.all([
      spaceService.listSpaces(),
      spaceService.listPendingRequests(),
    ]);
    setSpaces(results);
    setPendingRequests(requests);
  }

  useEffect(() => {
    void loadSpaces();
  }, []);

  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <h1 className="font-display text-5xl text-white">Spaces</h1>
        <div className="mt-8 rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-gold/80">Pending Approvals</p>
              <h2 className="mt-2 font-display text-3xl text-white">New Space Requests</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60">
              {pendingRequests.length} pending
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {pendingRequests.length ? (
              pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4"
                >
                  <div>
                    <p className="font-display text-2xl text-white">{request.requestedSpaceName}</p>
                    <p className="mt-1 text-sm text-white/55">
                      {request.requestedSpaceSlug} · {request.email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          await spaceService.approveRequest(request.id);
                          toast.success("Space request approved.");
                          await loadSpaces();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Could not approve request.");
                        }
                      }}
                      type="button"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          await spaceService.rejectRequest(request.id);
                          toast.success("Space request rejected.");
                          await loadSpaces();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Could not reject request.");
                        }
                      }}
                      type="button"
                      variant="secondary"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.3rem] border border-dashed border-white/10 p-4 text-sm text-white/55">
                No pending signup requests right now.
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 grid gap-4 rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5 lg:grid-cols-2">
          <div className="space-y-4">
            <Input onChange={(event) => setName(event.target.value)} placeholder="Space name" value={name} />
            <Input onChange={(event) => setSlug(event.target.value)} placeholder="space-slug" value={slug} />
            <Input
              onChange={(event) => setOwnerEmail(event.target.value)}
              placeholder="Initial admin email"
              type="email"
              value={ownerEmail}
            />
          </div>
          <div className="space-y-4">
            <Textarea
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Private streaming space for a couple or family..."
              value={description}
            />
            <Button
              onClick={async () => {
                try {
                  await spaceService.createSpace({
                    name,
                    slug,
                    description,
                    ownerEmail,
                  });
                  setName("");
                  setSlug("");
                  setDescription("");
                  setOwnerEmail("");
                  toast.success("Space created.");
                  await loadSpaces();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not create space.");
                }
              }}
              type="button"
            >
              Create Space
            </Button>
          </div>
        </div>
        <div className="mt-8 space-y-4">
          {spaces.map((space) => (
            <div key={space.id} className="flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
              <div>
                <p className="font-display text-3xl text-white">{space.name}</p>
                <p className="mt-1 text-sm text-white/60">{space.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm text-white/45">Active</p>
                <Button
                  onClick={async () => {
                    try {
                      await spaceService.deleteSpace(space.id);
                      toast.success("Space deleted.");
                      await loadSpaces();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not delete space.");
                    }
                  }}
                  type="button"
                  variant="danger"
                >
                  Delete Space
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
