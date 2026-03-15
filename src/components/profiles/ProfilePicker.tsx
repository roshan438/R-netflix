import { motion } from "framer-motion";
import type { Profile } from "@/types/domain";

export function ProfilePicker({
  profiles,
  onSelect,
}: {
  profiles: Profile[];
  onSelect: (profile: Profile) => void;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-center">
      <p className="mb-3 text-xs uppercase tracking-[0.38em] text-gold/80">
        Choose Profile
      </p>
      <h1 className="font-display text-5xl text-white sm:text-6xl">
        Who&apos;s watching tonight?
      </h1>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {profiles.map((profile, index) => (
          <motion.button
            key={profile.id}
            className="group rounded-[2rem] border border-white/10 bg-white/5 p-5 text-left transition hover:-translate-y-1 hover:border-gold/50 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-gold"
            initial={{ opacity: 0, y: 24 }}
            onClick={() => onSelect(profile)}
            transition={{ delay: index * 0.08 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="relative overflow-hidden rounded-[1.5rem]">
              <img
                alt={profile.name}
                className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                src={profile.avatarUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            </div>
            <h2 className="mt-4 font-display text-3xl text-white">{profile.name}</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">{profile.subtitle}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
