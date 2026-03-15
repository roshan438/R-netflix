export function LogoMark({ large = false }: { large?: boolean }) {
  return (
    <div className={large ? "text-6xl" : "text-3xl"}>
      <span className="font-display font-semibold tracking-[0.22em] text-gradient">
        R
      </span>
    </div>
  );
}
