import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  spaceSlug: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;
type SubmitValues = Omit<LoginValues, "spaceSlug"> & { spaceSlug: string };

export function LoginCard({
  onEmailSubmit,
  onGoogle,
  initialEmail,
  initialSpaceSlug,
  rememberedSpaceSlug,
}: {
  onEmailSubmit: (values: SubmitValues, mode: "sign_in" | "sign_up") => Promise<void>;
  onGoogle: (spaceSlug: string) => Promise<void>;
  initialEmail?: string;
  initialSpaceSlug?: string;
  rememberedSpaceSlug?: string;
}) {
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [editingSpaceSlug, setEditingSpaceSlug] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      spaceSlug: initialSpaceSlug || rememberedSpaceSlug || "",
      email: initialEmail || "",
      password: "",
    },
  });

  const resolvedSpaceSlug = getValues("spaceSlug") || initialSpaceSlug || rememberedSpaceSlug || "";
  const shouldShowSpaceField = mode === "sign_up" || !resolvedSpaceSlug || editingSpaceSlug;

  useEffect(() => {
    if (initialSpaceSlug) {
      setValue("spaceSlug", initialSpaceSlug);
    } else if (rememberedSpaceSlug) {
      setValue("spaceSlug", rememberedSpaceSlug);
    }
    if (initialEmail) {
      setValue("email", initialEmail);
    }
  }, [initialEmail, initialSpaceSlug, rememberedSpaceSlug, setValue]);

  return (
    <div className="glass-panel w-full max-w-md rounded-[2rem] p-8 shadow-halo">
      <p className="mb-2 text-xs uppercase tracking-[0.38em] text-gold/80">
        Private Space Access
      </p>
      <h1 className="font-display text-4xl text-white">Enter your streaming home</h1>
      <p className="mt-3 text-sm leading-6 text-white/65">
        Google is the easiest way to sign in as a space admin, especially if you plan to connect YouTube with the same account.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-full border border-white/10 bg-white/5 p-1">
        <button
          className={`rounded-full px-4 py-2 text-sm transition ${
            mode === "sign_in" ? "bg-white text-slate-950" : "text-white/70"
          }`}
          onClick={() => {
            setMode("sign_in");
            setEditingSpaceSlug(false);
          }}
          type="button"
        >
          Sign In
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm transition ${
            mode === "sign_up" ? "bg-white text-slate-950" : "text-white/70"
          }`}
          onClick={() => {
            setMode("sign_up");
            setEditingSpaceSlug(true);
          }}
          type="button"
        >
          Sign Up
        </button>
      </div>
      {shouldShowSpaceField ? (
        <div className="mt-6 rounded-[1.6rem] border border-gold/30 bg-gold/10 p-4">
          <p className="text-xs uppercase tracking-[0.32em] text-gold/80">
            {mode === "sign_up" ? "Required First" : "Private Space"}
          </p>
          <label className="mt-2 block text-sm font-medium text-white" htmlFor="spaceSlug">
            Private Space Name / Slug
          </label>
          <p className="mt-1 text-sm leading-6 text-white/60">
            {mode === "sign_up"
              ? "This is required before sign up so your request can be tied to the correct private space."
              : "Update this only if you need to sign into a different approved private space."}
          </p>
          <div className="mt-3">
            <Input id="spaceSlug" placeholder="your-private-space" {...register("spaceSlug")} />
            {errors.spaceSlug ? (
              <p className="mt-2 text-xs text-rose-300">{errors.spaceSlug.message}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-white/45">Private Space</p>
              <p className="mt-2 text-lg text-white">{resolvedSpaceSlug}</p>
              <p className="mt-1 text-sm text-white/55">
                We will use your saved private space for sign in.
              </p>
            </div>
            <Button
              onClick={() => setEditingSpaceSlug(true)}
              size="sm"
              type="button"
              variant="ghost"
            >
              Change
            </Button>
          </div>
        </div>
      )}
      <div className="mt-6">
        <Button
          className="w-full"
          onClick={async () => {
            const targetSpaceSlug = getValues("spaceSlug") || rememberedSpaceSlug || initialSpaceSlug || "";
            if (mode === "sign_up" || shouldShowSpaceField) {
              const isValid = await trigger("spaceSlug");
              if (!isValid || !targetSpaceSlug.trim()) return;
            }
            onGoogle(targetSpaceSlug);
          }}
          size="lg"
          type="button"
          variant="secondary"
        >
          <span className="text-base font-bold">G</span>
          Continue with Google
        </Button>
      </div>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.32em] text-white/35">
        <div className="h-px flex-1 bg-white/10" />
        or with email
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const targetSpaceSlug = values.spaceSlug || rememberedSpaceSlug || initialSpaceSlug || "";
          if ((mode === "sign_up" || shouldShowSpaceField) && targetSpaceSlug.trim().length < 2) {
            await trigger("spaceSlug");
            return;
          }
          await onEmailSubmit(
            {
              ...values,
              spaceSlug: targetSpaceSlug,
            },
            mode,
          );
        })}
      >
        <div>
          <Input placeholder="you@example.com" type="email" {...register("email")} />
          {errors.email ? (
            <p className="mt-2 text-xs text-rose-300">{errors.email.message}</p>
          ) : null}
        </div>
        <div>
          <Input placeholder="Create a secure password" type="password" {...register("password")} />
          {errors.password ? (
            <p className="mt-2 text-xs text-rose-300">{errors.password.message}</p>
          ) : null}
        </div>
        <Button className="w-full" size="lg" type="submit">
          {isSubmitting
            ? mode === "sign_in"
              ? "Signing in..."
              : "Creating account..."
            : mode === "sign_in"
              ? "Sign In"
              : "Create Account"}
        </Button>
        <p className="text-center text-xs leading-5 text-white/40">
          Session expires after 3 hours of inactivity.
        </p>
      </form>
    </div>
  );
}
