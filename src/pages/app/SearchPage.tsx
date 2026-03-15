import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MediaCard } from "@/components/home/MediaCard";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { mediaService } from "@/services/firebase/media";
import type { MediaItem } from "@/types/domain";

export function SearchPage() {
  const { currentSpace } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!currentSpace) return;
    const timer = window.setTimeout(() => {
      mediaService.search(currentSpace.id, { query, type: "all" }).then(setResults);
    }, 240);
    return () => window.clearTimeout(timer);
  }, [currentSpace, query]);

  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <div className="flex items-center gap-3">
          <SearchIcon className="h-5 w-5 text-gold" />
          <Input
            className="border-0 bg-transparent px-0 text-lg focus:ring-0"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, collection, category, season..."
            value={query}
          />
        </div>
      </section>
      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {results.map((item) => (
          <MediaCard key={item.id} media={item} aspect="poster" />
        ))}
      </section>
    </DashboardLayout>
  );
}
