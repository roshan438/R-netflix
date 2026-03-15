import { Link, useParams } from "react-router-dom";
import { SectionHeading } from "@/components/ui/section-heading";

export function TaxonomyGrid({
  title,
  items,
  basePath,
}: {
  title: string;
  items: Array<{ id: string; title: string; description?: string }>;
  basePath: "categories" | "seasons";
}) {
  const { spaceSlug = "luna-house" } = useParams();

  return (
    <section className="mt-12">
      <SectionHeading title={title} eyebrow="Discover" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            className="glass-panel rounded-[1.6rem] p-6 transition hover:-translate-y-1 hover:border-gold/40"
            to={`/${spaceSlug}/${basePath}/${item.id}`}
          >
            <h3 className="font-display text-3xl text-white">{item.title}</h3>
            {item.description ? (
              <p className="mt-3 text-sm leading-6 text-white/65">{item.description}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
