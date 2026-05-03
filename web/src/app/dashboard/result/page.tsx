"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const imageUrl = searchParams.get("image_url");
  const title = searchParams.get("title") ?? "Photoshoot";
  const jobId = searchParams.get("job_id");

  if (!imageUrl) {
    return (
      <div className="text-center py-20">
        <p className="text-[#888]">No result to display</p>
        <Link
          href="/dashboard"
          className="text-[#D4AF37] text-sm mt-4 inline-block hover:underline"
        >
          ← Back to Templates
        </Link>
      </div>
    );
  }

  const handleDownload = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ornalens-${jobId ?? "photo"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Ornalens - ${title}`,
          text: "Check out this AI jewellery photoshoot!",
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (e) {
      console.error("Share failed:", e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.push("/dashboard")}
        className="text-[#888] text-sm mb-6 hover:text-white transition-colors"
      >
        ← Back to Templates
      </button>

      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-[#D4AF37] text-xl font-bold">{title}</h1>
        <p className="text-[#888] text-sm mt-1">Your photoshoot is ready!</p>
      </div>

      {/* Image */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-[#222] bg-[#141414] mb-6">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-contain"
          unoptimized
        />
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleDownload}
          className="w-full py-4 rounded-2xl bg-[#D4AF37] text-[#0a0a0a] text-base font-extrabold hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          ⬇ Download Image
        </button>

        <button
          onClick={handleShare}
          className="w-full py-4 rounded-2xl bg-[#141414] border border-[#2a2a2a] text-[#D4AF37] font-bold hover:border-[#D4AF37]/40 transition-colors flex items-center justify-center gap-2"
        >
          ↗ Share with Client
        </button>

        <Link
          href="/dashboard"
          className="block w-full py-4 rounded-2xl border border-[#2a2a2a] text-white text-base font-bold text-center hover:border-[#D4AF37]/40 transition-colors"
        >
          ✦ Create Another
        </Link>
      </div>

      <div className="h-8" />
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20 text-[#888]">Loading...</div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
