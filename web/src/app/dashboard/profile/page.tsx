"use client";

import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="max-w-md mx-auto">
      <div className="flex flex-col items-center py-10">
        <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 border-2 border-[#D4AF37] flex items-center justify-center mb-4">
          <span className="text-[#D4AF37] text-3xl font-extrabold">?</span>
        </div>
        <h1 className="text-white text-xl font-bold">Guest User</h1>
        <p className="text-[#666] text-sm">Not signed in</p>
      </div>
      <div className="bg-[#141414] rounded-2xl border border-[#1f1f1f] px-5 mb-6">
        <div className="flex items-center justify-between py-4">
          <span className="text-[#888] text-sm">Authentication</span>
          <span className="text-[#D4AF37] text-sm font-semibold">Coming soon</span>
        </div>
      </div>
      <Link href="/sign-in" className="block w-full py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#f0c040] text-[#0a0a0a] font-bold text-center">
        Sign In
      </Link>
      <p className="text-[#333] text-xs text-center mt-8">Ornalens v1.0.1</p>
    </div>
  );
}
