import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function SectionHeading({
  title,
  eyebrow,
  href,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gold/80">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-3xl font-semibold tracking-[0.02em] text-white">
          {title}
        </h2>
      </div>
      {href ? (
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
          to={href}
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
