"use client";

import { useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { TEMPLATES, type AspectRatio } from "@/data/templates";
import { uploadImage, generatePhotoshoot } from "@/lib/api-client";

const ASPECT_RATIOS: AspectRatio[] = ["1:1", "4:5", "3:2", "16:9", "9:16"];
const QUALITY_OPTIONS = ["Standard", "High"] as const;

export default function PhotoshootPage() {
  const params = useParams();
  const router = useRouter();
  const getToken = async () => null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const template = TEMPLATES.find((t) => t.id === params.templateId);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    template?.defaultAspectRatio ?? "1:1",
  );
  const [quality, setQuality] = useState<"Standard" | "High">("Standard");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreview(url);
    },
    [],
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleGenerate = async () => {
    if (!file || !template) return;

    setLoading(true);
    try {
      setLoadingStep("Uploading image...");
      const imageUrl = await uploadImage(file, getToken);

      setLoadingStep("Generating photoshoot... This may take 1-2 minutes");
      const result = await generatePhotoshoot(
        {
          jewellery_image_url: imageUrl,
          template_id: template.id,
          prompt: template.prompt,
          additional_notes: additionalNotes.trim() || undefined,
          aspect_ratio: aspectRatio,
          quality,
        },
        getToken,
      );

      // Navigate to result page with data in query params
      const resultParams = new URLSearchParams({
        image_url: result.image_url,
        title: template.title,
        job_id: result.job_id ?? "",
      });
      router.push(`/dashboard/result?${resultParams.toString()}`);
    } catch (err: unknown) {
      alert((err as Error).message ?? "Something went wrong");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  if (!template) {
    return (
      <div className="text-center py-20">
        <p className="text-[#888]">Template not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-[#888] text-sm mb-6 hover:text-white transition-colors"
      >
        ← Back to Templates
      </button>

      {/* Template Preview */}
      <div className="flex items-center gap-4 bg-[#141414] rounded-2xl border border-[#D4AF37]/25 p-4 mb-8">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
          <Image
            src={template.thumbnail}
            alt={template.title}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="text-white text-lg font-bold">{template.title}</h1>
          <span className="text-[#D4AF37] text-xs font-semibold">
            {template.category}
          </span>
        </div>
      </div>

      {/* 1. Upload Your Jewellery */}
      <h2 className="text-white text-lg font-bold mb-3">
        1. Upload Your Jewellery
      </h2>
      
      {/* Gallery / Camera Buttons */}
      <div className="flex gap-3 mb-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-[#141414] border-2 border-dashed border-[#2a2a2a] rounded-xl py-5 flex flex-col items-center gap-2 hover:border-[#D4AF37]/40 transition-colors"
        >
          <span className="text-2xl">🖼</span>
          <span className="text-[#888] text-sm font-semibold">Gallery</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-[#141414] border-2 border-dashed border-[#2a2a2a] rounded-xl py-5 flex flex-col items-center gap-2 hover:border-[#D4AF37]/40 transition-colors"
        >
          <span className="text-2xl">📷</span>
          <span className="text-[#888] text-sm font-semibold">Camera</span>
        </button>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#2a2a2a] rounded-2xl p-6 text-center cursor-pointer hover:border-[#D4AF37]/40 transition-colors bg-[#141414] mb-4"
      >
        {preview ? (
          <div className="relative w-full aspect-video max-h-[280px] rounded-xl overflow-hidden mx-auto">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <>
            <div className="text-3xl mb-2">📸</div>
            <p className="text-white font-semibold text-sm">
              Drop your jewellery photo here
            </p>
            <p className="text-[#666] text-xs mt-1">
              or click to browse • JPG, PNG, WEBP up to 10MB
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          capture="environment"
        />
      </div>

      {/* 2. Additional Notes */}
      <h2 className="text-white text-lg font-bold mt-8 mb-2">
        2. Additional Notes
      </h2>
      <p className="text-[#666] text-xs mb-3">
        Optional — add any specific requirements for your photoshoot
      </p>
      <textarea
        value={additionalNotes}
        onChange={(e) => setAdditionalNotes(e.target.value)}
        placeholder="e.g. Focus on the center diamond, show the side profile, warmer lighting..."
        rows={3}
        className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#D4AF37]/50 resize-none transition-colors"
      />
      <div className="flex items-start gap-2 mt-3 bg-[#D4AF37]/5 rounded-xl px-4 py-3">
        <span className="text-[#D4AF37] text-sm">✦</span>
        <p className="text-[#D4AF37] text-xs leading-relaxed">
          Our AI uses a premium studio prompt tailored for this template. Your
          notes will fine-tune the result.
        </p>
      </div>

      {/* 3. Image Options */}
      <h2 className="text-white text-lg font-bold mt-8 mb-4">
        3. Image Options
      </h2>

      <label className="text-[#666] text-[11px] font-bold tracking-widest mb-2 block">
        ASPECT RATIO
      </label>
      <div className="flex flex-wrap gap-2 mb-5">
        {ASPECT_RATIOS.map((ar) => (
          <button
            key={ar}
            onClick={() => setAspectRatio(ar)}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
              aspectRatio === ar
                ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/8"
                : "border-[#2a2a2a] text-[#888] bg-[#141414] hover:border-[#444]"
            }`}
          >
            {ar}
          </button>
        ))}
      </div>

      <label className="text-[#666] text-[11px] font-bold tracking-widest mb-2 block">
        IMAGE QUALITY
      </label>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {QUALITY_OPTIONS.map((q) => (
          <button
            key={q}
            onClick={() => setQuality(q)}
            className={`py-3 rounded-lg text-sm font-bold border text-center transition-colors ${
              quality === q
                ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/8"
                : "border-[#2a2a2a] text-[#888] bg-[#141414] hover:border-[#444]"
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !file}
        className={`w-full py-4 rounded-2xl text-base font-extrabold transition-all flex items-center justify-center gap-2 ${
          loading || !file
            ? "bg-[#D4AF37]/30 text-[#0a0a0a]/50 cursor-not-allowed"
            : "bg-[#D4AF37] text-[#0a0a0a] hover:brightness-110 active:scale-[0.99]"
        }`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {loadingStep}
          </>
        ) : (
          <>✦ Generate Photoshoot</>
        )}
      </button>

      <div className="h-8" />
    </div>
  );
}
