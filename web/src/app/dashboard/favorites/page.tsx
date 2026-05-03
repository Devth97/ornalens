"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { TEMPLATES, type Template } from "@/data/templates";
import { useFavorites } from "@/hooks/useFavorites";

export default function FavoritesPage() {
  const { favorites, toggleFavorite, loaded } = useFavorites();

  const favoriteTemplates = useMemo(() => {
    return TEMPLATES.filter((t) => favorites.has(t.id));
  }, [favorites]);

  if (!loaded) {
    return (
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#888] text-sm mt-4">Loading favorites...</p>
      </div>
    );
  }

  if (favoriteTemplates.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">♡</div>
        <h2 className="text-white text-lg font-bold mb-2">No favorites yet</h2>
        <p className="text-[#888] text-sm max-w-xs mx-auto">
          Browse templates and tap the heart icon to save your favorites for quick access
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-6 px-6 py-3 bg-[#D4AF37] text-[#0a0a0a] font-bold rounded-xl hover:brightness-110 transition-all"
        >
          Browse Templates →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">
        <span className="text-[#D4AF37]">♥</span> Favorites
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {favoriteTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isFavorite={true}
            onToggleFavorite={() => toggleFavorite(template.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  isFavorite,
  onToggleFavorite,
}: {
  template: Template;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <div className="group relative bg-[#141414] rounded-2xl border border-[#1f1f1f] overflow-hidden hover:border-[#D4AF37]/40 transition-all hover:shadow-lg hover:shadow-[#D4AF37]/5">
      <Link href={`/dashboard/photoshoot/${template.id}`} className="block">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={template.thumbnail}
            alt={template.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute top-3 left-3">
            <span className="bg-black/70 text-[#D4AF37] text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-md uppercase">
              {template.category}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-white text-sm font-bold truncate">
            {template.title}
          </h3>
          <p className="text-[#888] text-xs mt-1 line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        </div>
      </Link>
      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
      >
        <span
          className={`text-lg ${isFavorite ? "text-[#EF4444]" : "text-[#999]"}`}
        >
          {isFavorite ? "♥" : "♡"}
        </span>
      </button>
    </div>
  );
}
