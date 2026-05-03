"use client";

import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-md text-center">
        <span className="text-[#D4AF37] text-2xl font-bold">◆ Ornalens</span>
        <p className="text-[#888] text-sm mt-2 mb-8">AI Jewellery Photography</p>
        <p className="text-white mb-6">Registration coming soon.</p>
        <Link href="/dashboard" className="block w-full py-3 rounded-xl text-center font-bold text-sm text-[#0a0a0a] bg-gradient-to-r from-[#D4AF37] to-[#f0c040]">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
