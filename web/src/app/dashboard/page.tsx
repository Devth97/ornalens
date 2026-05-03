"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { listJobs, getTokenBalance } from "@/lib/api-client";

type Job = {
  id: string;
  status: string;
  jewellery_description?: string;
  model_image_url?: string;
  jewellery_image_url?: string;
  model_style?: { template_id?: string; quality?: string };
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#888",
  processing: "#3B82F6",
  completed: "#22C55E",
  failed: "#EF4444",
};

export default function DashboardPage() {
  const getToken = async () => null;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokensBalance, setTokensBalance] = useState<number | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number>(0);

  const loadData = useCallback(async () => {
    try {
      const [data, tok] = await Promise.all([
        listJobs(getToken),
        getTokenBalance(getToken),
      ]);
      setJobs(data ?? []);
      setTokensBalance(tok.tokens_balance);
      setTokensUsed(tok.tokens_used);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // alias for refresh button
  const loadJobs = loadData;

  useEffect(() => { loadData(); }, [loadData]);

  const completed = jobs.filter(j => j.status === "completed").length;
  const processing = jobs.filter(j => j.status === "processing" || j.status === "pending").length;
  const failed = jobs.filter(j => j.status === "failed").length;
  const recent = jobs.slice(0, 5);
  const thisMonth = jobs.filter(j => {
    const d = new Date(j.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
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

  return (
    <div className="space-y-5 pb-8">
      {/* Available Tokens banner */}
      <div className="flex items-center justify-between bg-[#141414] border border-[#1f1f1f] rounded-2xl px-5 py-4">
        <span className="text-[#D4AF37] font-bold text-sm">Available Tokens</span>
        <span className="text-[#D4AF37] font-extrabold text-lg">
          {loading || tokensBalance === null ? "—" : tokensBalance.toLocaleString()}
        </span>
      </div>

      {/* Two quick-action cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Create Visuals */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-white font-bold text-base">Create Visuals</h2>
            <span className="text-2xl">✦</span>
          </div>
          <ul className="text-[#888] text-sm space-y-1 mb-5">
            <li>• Select a photoshoot template</li>
            <li>• Upload your jewellery photo</li>
            <li>• Get stunning AI-generated results</li>
          </ul>
          <Link
            href="/dashboard/create"
            className="block w-full py-3 rounded-xl text-center font-bold text-sm text-[#0a0a0a] bg-gradient-to-r from-[#D4AF37] to-[#f0c040] hover:brightness-105 transition-all"
          >
            Create Visuals
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-white font-bold text-base">Recent Activity</h2>
            <span className="text-2xl">🕐</span>
          </div>
          <p className="text-[#D4AF37] text-3xl font-extrabold mb-1">
            {loading ? "—" : thisMonth.length}
          </p>
          <p className="text-[#888] text-sm mb-1">
            Generations in last <strong className="text-white">30</strong> days
          </p>
          <p className="text-[#666] text-xs mb-5">
            Total generations: {loading ? "—" : jobs.length}
          </p>
          <Link
            href="/dashboard/history"
            className="block w-full py-3 rounded-xl text-center font-bold text-sm text-[#0a0a0a] bg-gradient-to-r from-[#D4AF37] to-[#f0c040] hover:brightness-105 transition-all"
          >
            View History
          </Link>
        </div>
      </div>

      {/* Current Month stats */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-base">Current Month</h2>
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-[#D4AF37] text-3xl font-extrabold">{loading ? "—" : tokensUsed}</p>
        <p className="text-[#888] text-sm mt-1">Tokens Used This Month</p>
        <p className="text-[#666] text-xs mt-0.5">Total Generations: {thisMonth.length}</p>
      </div>

      {/* Generation Status */}
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-base">Generation Status</h2>
          <button onClick={loadJobs} className="text-[#D4AF37] text-lg hover:rotate-180 transition-transform duration-300">↻</button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/5">
            <span className="text-[#3B82F6] font-semibold text-sm">Processing</span>
            <span className="text-[#3B82F6] font-bold">{loading ? "—" : processing}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5">
            <span className="text-[#22C55E] font-semibold text-sm">Completed</span>
            <span className="text-[#22C55E] font-bold">{loading ? "—" : completed}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5">
            <span className="text-[#EF4444] font-semibold text-sm">Failed</span>
            <span className="text-[#EF4444] font-bold">{loading ? "—" : failed}</span>
          </div>
        </div>
      </div>

      {/* Recent Generations */}
      {!loading && recent.length > 0 && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-2xl p-5">
          <h2 className="text-white font-bold text-base mb-4">Recent Generations</h2>
          <div className="space-y-3">
            {recent.map((job) => (
              <div key={job.id} className="flex items-center gap-4 bg-[#1a1a1a] rounded-xl p-3">
                {/* Thumbnail */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#222]">
                  {job.model_image_url ? (
                    <Image src={job.model_image_url} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-[#444] text-lg">◆</div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {job.jewellery_description ?? "Jewellery shoot"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        color: STATUS_COLORS[job.status] ?? "#888",
                        backgroundColor: (STATUS_COLORS[job.status] ?? "#888") + "22",
                      }}
                    >
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                    {job.status === "completed" && (
                      <span className="text-[#D4AF37] text-xs">450 tokens</span>
                    )}
                  </div>
                  <p className="text-[#555] text-xs mt-0.5">
                    {new Date(job.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                {/* Download */}
                {job.model_image_url && (
                  <button
                    onClick={() => handleDownload(job.model_image_url!, job.id)}
                    className="w-9 h-9 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors shrink-0"
                  >
                    ⬇
                  </button>
                )}
              </div>
            ))}
          </div>
          {jobs.length > 5 && (
            <Link
              href="/dashboard/history"
              className="block text-center text-[#D4AF37] text-sm mt-4 hover:underline"
            >
              View all {jobs.length} generations →
            </Link>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && jobs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">◆</div>
          <h3 className="text-white font-bold text-lg mb-2">No shoots yet</h3>
          <p className="text-[#666] text-sm mb-6">Create your first AI jewellery photoshoot</p>
          <Link
            href="/dashboard/create"
            className="inline-block px-6 py-3 bg-[#D4AF37] text-[#0a0a0a] font-bold rounded-xl hover:brightness-110 transition-all"
          >
            ✦ Start Creating
          </Link>
        </div>
      )}
    </div>
  );
}
