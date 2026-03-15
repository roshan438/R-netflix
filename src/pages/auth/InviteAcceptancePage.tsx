import { CheckCircle2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { inviteService } from "@/services/firebase/invites";
import { spaceService } from "@/services/firebase/spaces";

export function InviteAcceptancePage() {
  const { spaceSlug = "luna-house", token = "token" } = useParams();
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const space = await spaceService.getSpaceBySlug(spaceSlug);
      if (!space) {
        setLoading(false);
        return;
      }
      const invite = await inviteService.getInvite(space.id, token);
      setInviteEmail(invite?.email ?? "");
      setLoading(false);
    }

    void load();
  }, [spaceSlug, token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-glow px-6">
      <div className="glass-panel max-w-xl rounded-[2rem] p-8 text-center">
        <Mail className="mx-auto h-12 w-12 text-gold" />
        <p className="mt-6 text-xs uppercase tracking-[0.34em] text-gold/80">Invite Accepted</p>
        <h1 className="mt-3 font-display text-5xl text-white">Join {spaceSlug}</h1>
        <p className="mt-4 text-sm leading-7 text-white/65">
          Sign in or sign up with the invited email below. Once authenticated, this account will be attached to the private space and can pick a profile inside it.
        </p>
        <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-left text-sm text-white/65">
          <p className="font-medium text-white">Invite details</p>
          <p className="mt-2 break-all">Space: {spaceSlug}</p>
          <p className="mt-2 break-all">Email: {loading ? "Loading..." : inviteEmail || "Use the invited email address"}</p>
        </div>
        <Link
          className="mt-8 inline-block"
          to={`/login?space=${encodeURIComponent(spaceSlug)}${inviteEmail ? `&email=${encodeURIComponent(inviteEmail)}` : ""}`}
        >
          <Button>
            <CheckCircle2 className="h-4 w-4" />
            Continue to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
