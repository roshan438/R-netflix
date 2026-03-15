import { useEffect, useState } from "react";
import { Copy, RotateCcw, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteService } from "@/services/firebase/invites";
import { membershipService, type SpaceMemberRecord } from "@/services/firebase/memberships";

export function MemberInviteManagementPage() {
  const { currentSpace, user } = useAuth();
  const [email, setEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<
    Array<{ id: string; email: string; role: "member" | "space_admin"; status: string; createdAt: number; link: string }>
  >([]);
  const [members, setMembers] = useState<SpaceMemberRecord[]>([]);

  async function loadHistory() {
    if (!currentSpace) return;
    const invites = await inviteService.listInvites(currentSpace.id);
    setHistory(invites);
  }

  async function loadMembers() {
    if (!currentSpace) return;
    const items = await membershipService.listMembers(currentSpace.id);
    setMembers(items.filter((member) => member.status !== "revoked"));
  }

  useEffect(() => {
    void loadHistory();
    void loadMembers();
  }, [currentSpace]);

  return (
    <DashboardLayout>
      <section className="glass-panel max-w-3xl rounded-[2rem] p-8">
        <h1 className="font-display text-5xl text-white">Invite Members</h1>
        <p className="mt-3 text-sm leading-7 text-white/65">
          In production, this action should call a Cloud Function that issues a secure token hash and sends an email link.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Input onChange={(event) => setEmail(event.target.value)} placeholder="member@example.com" value={email} />
          <Button
            onClick={async () => {
              if (!currentSpace) return;
              try {
                const invite = await inviteService.createInvite({
                  email,
                  role: "member",
                  spaceId: currentSpace.id,
                  spaceSlug: currentSpace.slug,
                });
                setInviteLink(invite.link);
                await navigator.clipboard.writeText(invite.link).catch(() => undefined);
                setSending(true);
                const emailResult = await inviteService.sendInviteEmail({
                  spaceId: currentSpace.id,
                  email: invite.email,
                  inviteLink: invite.link,
                }).catch(() => ({ sent: false, reason: "request_failed" }));
                toast.success(
                  emailResult.sent
                    ? "Invite emailed and copied."
                    : "Invite link created and copied. Email sending is not configured yet.",
                );
                await loadHistory();
                await loadMembers();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not create invite.");
              } finally {
                setSending(false);
              }
            }}
          >
            {sending ? "Sending..." : "Generate Invite"}
          </Button>
        </div>
        {inviteLink ? (
          <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
            <p className="break-all">{inviteLink}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteLink).catch(() => undefined);
                  toast.success("Invite link copied.");
                }}
                type="button"
                variant="secondary"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Button
                onClick={async () => {
                  if (navigator.share) {
                    await navigator.share({
                      title: "Join my private Reverie space",
                      text: "Use this private invite link to join the space.",
                      url: inviteLink,
                    }).catch(() => undefined);
                  } else {
                    await navigator.clipboard.writeText(inviteLink).catch(() => undefined);
                    toast.success("Share isn’t available here, so the link was copied instead.");
                  }
                }}
                type="button"
                variant="secondary"
              >
                <Send className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        ) : null}
        <div className="mt-8">
          <h2 className="font-display text-3xl text-white">Members</h2>
          <div className="mt-4 space-y-3">
            {members.length ? (
              members.map((member) => (
                <div
                  key={member.id}
                  className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-white">{member.email}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/45">
                        {member.status} • {member.role}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {member.email !== user?.email ? (
                        <Button
                          onClick={async () => {
                            if (!currentSpace) return;
                            await membershipService.updateRole(
                              currentSpace.id,
                              member.email,
                              member.role === "space_admin" ? "member" : "space_admin",
                            );
                            toast.success(
                              member.role === "space_admin"
                                ? "Admin demoted to member."
                                : "Member promoted to admin.",
                            );
                            await loadMembers();
                          }}
                          type="button"
                          variant="secondary"
                        >
                          {member.role === "space_admin" ? "Demote Admin" : "Promote Admin"}
                        </Button>
                      ) : null}
                      {member.email !== user?.email ? (
                        <Button
                          onClick={async () => {
                            if (!currentSpace) return;
                            await membershipService.revokeMember(currentSpace.id, member.email);
                            toast.success("Member removed from this space.");
                            await loadMembers();
                            await loadHistory();
                          }}
                          type="button"
                          variant="danger"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove User
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/55">No members added yet.</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-3xl text-white">Invite History</h2>
          <div className="mt-4 space-y-3">
            {history.length ? (
              history.map((invite) => (
                <div
                  key={invite.id}
                  className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-white">{invite.email}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/45">
                        {invite.status} • {invite.role}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={async () => {
                          if (!currentSpace) return;
                          const result = await inviteService.sendInviteEmail({
                            spaceId: currentSpace.id,
                            email: invite.email,
                            inviteLink: invite.link,
                          }).catch(() => ({ sent: false }));
                          toast.success(result.sent ? "Invite resent." : "Invite link copied for manual resend.");
                        }}
                        type="button"
                        variant="secondary"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Resend
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!currentSpace) return;
                          await inviteService.revokeInvite({
                            spaceId: currentSpace.id,
                            inviteId: invite.id,
                            email: invite.email,
                          });
                          toast.success("Invite revoked.");
                          await loadHistory();
                        }}
                        type="button"
                        variant="danger"
                      >
                        <Trash2 className="h-4 w-4" />
                        Revoke
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/55">No invites sent yet.</p>
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
