import { Link, useParams } from "react-router-dom";
import type { Collection } from "@/types/domain";
import { SectionHeading } from "@/components/ui/section-heading";

export function CollectionStrip({ items }: { items: Collection[] }) {
  const { spaceSlug = "luna-house" } = useParams();

  return (
    <section className="mt-12">
      <SectionHeading title="Collections" eyebrow="Story Worlds" />
      <div className="grid gap-5 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            className="group relative overflow-hidden rounded-[1.8rem] border border-white/10"
            to={`/${spaceSlug}/collections/${item.id}`}
          >
            <img
              alt={item.title}
              className="h-64 w-full object-cover transition duration-700 group-hover:scale-105"
              src={item.bannerUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <h3 className="font-display text-3xl text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
