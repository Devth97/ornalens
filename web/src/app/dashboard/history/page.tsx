"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { listJobs } from "@/lib/api-client";

interface Job {
  id: string;
  status: string;
  jewellery_image_url?: string;
  model_image_url?: string | null;
  jewellery_description?: string;
  model_style?: { template_id?: string };
  created_at: string;
}

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  pending:    { text: "#888",     bg: "#88888822" },
  processing: { text: "#3B82F6", bg: "#3B82F622" },
  completed:  { text: "#22C55E", bg: "#22C55E22" },
  failed:     { text: "#EF4444", bg: "#EF444422" },
};

export default function HistoryPage() {
  const getToken = async () => null;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<Job | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const data = await listJobs(getToken);
      setJobs(data ?? []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const filtered = jobs.filter((j) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      j.jewellery_description?.toLowerCase().includes(q) ||
      j.status.toLowerCase().includes(q)
    );
  });

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
        await navigator.share({ title: `Ornalens — ${desc ?? "Photoshoot"}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied!");
      }
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin h-8 w-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
        <p className="text-[#888] text-sm mt-4">Loading history...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">�</div>
        <h2 className="text-white text-lg font-bold mb-2">No shoots yet</h2>
        <p className="text-[#888] text-sm mb-6">Generate your first photoshoot from the Create page</p>
        <Link href="/dashboard/create" className="inline-block px-6 py-3 bg-[#D4AF37] text-[#0a0a0a] font-bold rounded-xl hover:brightness-110 transition-all">
          ✦ Start Creating
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-5">🕐 History</h1>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]">⌕</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by attributes..."
          className="w-full bg-[#141414] border border-[#222] rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
        />
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {filtered.map((job) => (
          <div key={job.id} className="bg-[#141414] rounded-2xl border border-[#1f1f1f] overflow-hidden">
            <div className="flex items-start gap-4 p-4">
              {/* Thumbnail */}
              <div
                className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#222] cursor-pointer"
                onClick={() => job.model_image_url && setPreview(job)}
              >
                {job.model_image_url ? (
                  <Image src={job.model_image_url} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#444] text-2xl">◆</div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-base truncate">
                  {job.jewellery_description ?? "Jewellery shoot"}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{
                      color: STATUS_COLORS[job.status]?.text ?? "#888",
                      backgroundColor: STATUS_COLORS[job.status]?.bg ?? "#88888822",
                    }}
                  >
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                  {job.status === "completed" && (
                    <span className="text-[#D4AF37] text-xs font-semibold bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full">
                      450 tokens
                    </span>
                  )}
                </div>
                <p className="text-[#555] text-xs mt-1">
                  {new Date(job.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "numeric", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 px-4 pb-4">
              <button
                onClick={() => job.model_image_url && setPreview(job)}
                disabled={!job.model_image_url}
                className="py-2.5 rounded-xl border border-[#2a2a2a] text-white text-sm font-semibold hover:border-[#D4AF37]/40 hover:bg-[#1a1a1a] transition-colors disabled:opacity-40"
              >
                Preview
              </button>
              <button
                onClick={() => job.model_image_url && handleDownload(job.model_image_url, job.id)}
                disabled={!job.model_image_url}
                className="py-2.5 rounded-xl border border-[#2a2a2a] text-white text-sm font-semibold hover:border-[#D4AF37]/40 hover:bg-[#1a1a1a] transition-colors disabled:opacity-40"
              >
                Save
              </button>
              <Link
                href={`/dashboard/photoshoot/${job.model_style?.template_id ?? ""}`}
                className="py-2.5 rounded-xl border border-[#2a2a2a] text-white text-sm font-semibold text-center hover:border-[#D4AF37]/40 hover:bg-[#1a1a1a] transition-colors"
              >
                Regenerate
              </Link>
              <button
                onClick={() => job.model_image_url && handleShare(job.model_image_url, job.jewellery_description)}
                disabled={!job.model_image_url}
                className="py-2.5 rounded-xl border border-[#2a2a2a] text-[#D4AF37] text-sm font-semibold hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-colors disabled:opacity-40"
              >
                Share
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-lg w-full bg-[#0a0a0a] rounded-2xl overflow-hidden border border-[#222]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square">
              <Image src={preview.model_image_url!} alt="" fill className="object-contain" unoptimized />
            </div>
            <div className="p-4 flex gap-2">
              <button
                onClick={() => handleDownload(preview.model_image_url!, preview.id)}
                className="flex-1 py-3 rounded-xl bg-[#D4AF37] text-[#0a0a0a] font-bold hover:brightness-110 transition-all"
              >
                ⬇ Download
              </button>
              <button
                onClick={() => handleShare(preview.model_image_url!, preview.jewellery_description)}
                className="flex-1 py-3 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37] font-bold hover:bg-[#D4AF37]/10 transition-colors"
              >
                ↗ Share
              </button>
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
