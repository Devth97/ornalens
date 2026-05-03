"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { listJobs } from "@/lib/api-client";

type Job = {
  id: string;
  status: string;
  jewellery_description?: string;
  model_image_url?: string;
  created_at: string;
};

export default function GalleryPage() {
  const getToken = async () => null;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Job | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const data = await listJobs(getToken);
      const completed = (data ?? []).filter(
        (j: Job) => j.status === "completed" && j.model_image_url
      );
      setJobs(completed);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === jobs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(jobs.map((j) => j.id)));
    }
  };

  const handleDownload = async (url: string, jobId: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = link;
      a.download = `ornalens-${jobId.slice(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(link);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleShare = async (url: string, desc?: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Ornalens — ${desc ?? "AI Jewellery Photoshoot"}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Image URL copied to clipboard!");
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#888] text-sm mt-4">Loading gallery...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">🖼</div>
        <h2 className="text-white text-lg font-bold mb-2">No images yet</h2>
        <p className="text-[#888] text-sm max-w-xs mx-auto mb-6">
          Your completed AI photoshoots will appear here
        </p>
        <a
          href="/dashboard/create"
          className="inline-block px-6 py-3 bg-[#D4AF37] text-[#0a0a0a] font-bold rounded-xl hover:brightness-110 transition-all"
        >
          ✦ Create Your First Shoot
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-white">🖼 Gallery</h1>
        <button
          onClick={selectAll}
          className="text-[#D4AF37] text-sm font-semibold hover:underline"
        >
          {selected.size === jobs.length ? "Deselect All" : "Select All Items"}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="relative group bg-[#141414] rounded-2xl overflow-hidden border border-[#1f1f1f] hover:border-[#D4AF37]/30 transition-all"
          >
            {/* Checkbox overlay */}
            <div
              className={`absolute top-2 right-2 z-10 w-6 h-6 rounded flex items-center justify-center border-2 cursor-pointer transition-all ${
                selected.has(job.id)
                  ? "bg-[#D4AF37] border-[#D4AF37]"
                  : "bg-black/50 border-white/40 opacity-0 group-hover:opacity-100"
              }`}
              onClick={() => toggleSelect(job.id)}
            >
              {selected.has(job.id) && (
                <span className="text-black text-xs font-bold">✓</span>
              )}
            </div>

            {/* Image */}
            <div
              className="relative aspect-square cursor-pointer"
              onClick={() => setPreview(job)}
            >
              <Image
                src={job.model_image_url!}
                alt={job.jewellery_description ?? ""}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Action row */}
            <div className="flex justify-around py-2 border-t border-[#1f1f1f]">
              <button
                onClick={() => setPreview(job)}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#222] text-[#888] hover:text-white transition-colors"
                title="Preview"
              >
                🔍
              </button>
              <button
                onClick={() => alert(`Template: ${job.jewellery_description ?? "—"}\nDate: ${new Date(job.created_at).toLocaleDateString("en-IN")}`)}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#222] text-[#888] hover:text-white transition-colors"
                title="Info"
              >
                ℹ
              </button>
              <button
                onClick={() => handleShare(job.model_image_url!, job.jewellery_description)}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#222] text-[#888] hover:text-white transition-colors"
                title="Share"
              >
                ↗
              </button>
              <button
                onClick={() => handleDownload(job.model_image_url!, job.id)}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#222] text-[#888] hover:text-white transition-colors"
                title="Download"
              >
                ⬇
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox preview */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#0a0a0a] rounded-2xl overflow-hidden border border-[#222]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square">
              <Image
                src={preview.model_image_url!}
                alt={preview.jewellery_description ?? ""}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">
                  {preview.jewellery_description ?? "Jewellery shoot"}
                </p>
                <p className="text-[#555] text-xs mt-0.5">
                  {new Date(preview.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleShare(
                      preview.model_image_url!,
                      preview.jewellery_description
                    )
                  }
                  className="px-4 py-2 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37] text-sm font-semibold hover:bg-[#D4AF37]/10 transition-colors"
                >
                  ↗ Share
                </button>
                <button
                  onClick={() =>
                    handleDownload(preview.model_image_url!, preview.id)
                  }
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#0a0a0a] text-sm font-bold hover:brightness-110 transition-all"
                >
                  ⬇ Save
                </button>
              </div>
            </div>
            <button
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
