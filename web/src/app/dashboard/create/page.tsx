"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TEMPLATES,
  CATEGORIES,
  type Template,
  type TemplateCategory,
} from "@/data/templates";
import { useFavorites } from "@/hooks/useFavorites";

export default function CreatePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("All");
  const { toggleFavorite, isFavorite } = useFavorites();

  const filtered = useMemo(() => {
    let list = TEMPLATES;
    if (activeCategory !== "All") {
      list = list.filter((t) => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, search]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-[#D4AF37]">✦</span> Create Visuals
        </h1>
        <p className="text-[#888] text-sm mt-1">
          Choose a photoshoot template for your jewellery
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] text-lg">⌕</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search photoshoot styles..."
          className="w-full bg-[#141414] border border-[#222] rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
              activeCategory === cat
                ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/8"
                : "border-[#222] text-[#888] bg-[#141414] hover:border-[#444] hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-[#666] text-sm">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              isFavorite={isFavorite(t.id)}
              onToggleFavorite={() => toggleFavorite(t.id)}
            />
          ))}
        </div>
      )}
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
          <h3 className="text-white text-sm font-bold truncate">{template.title}</h3>
          <p className="text-[#888] text-xs mt-1 line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
      >
        <span className={`text-lg ${isFavorite ? "text-[#EF4444]" : "text-[#999]"}`}>
          {isFavorite ? "♥" : "♡"}
        </span>
      </button>
    </div>
  );
}
