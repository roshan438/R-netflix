import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MediaRail } from "@/components/home/MediaRail";
import { useAuth } from "@/context/AuthContext";
import { categoryService } from "@/services/firebase/categories";
import type { Category, MediaItem } from "@/types/domain";

export function CategoryPage() {
  const { categoryId = "" } = useParams();
  const { currentSpace } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!currentSpace || !categoryId) return;
    categoryService.getById(categoryId, currentSpace.id).then((item) => setCategory(item ?? null));
    categoryService.getItems(categoryId, currentSpace.id).then(setItems);
  }, [categoryId, currentSpace]);

  if (!category) {
    return (
      <DashboardLayout>
        <div className="glass-panel rounded-[2rem] p-8 text-white/65">Loading category...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-gold/80">Category</p>
        <h1 className="mt-3 font-display text-6xl text-white">{category.name}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">{category.description}</p>
      </section>
      <MediaRail eyebrow="Curated" items={items} title={`${category.name} Memories`} />
    </DashboardLayout>
  );
}
