"use client";

import { useState, useEffect, useCallback } from "react";
import { listJobs, getTokenBalance } from "@/lib/api-client";

const PACKAGES = [
  {
    name: "Starter",
    price: 0,
    label: "FREE",
    tokens: 2000,
    duration: "1 Month",
    current: true,
  },
  {
    name: "Basic",
    price: 10000,
    label: null,
    tokens: 10000,
    duration: "6 Months",
    current: false,
  },
  {
    name: "Standard",
    price: 50000,
    label: null,
    tokens: 60000,
    duration: "1 Year",
    current: false,
  },
];

type Job = { id: string; status: string; jewellery_description?: string; created_at: string };
type TokenInfo = { plan: string; tokens_granted: number; tokens_used: number; tokens_balance: number };

export default function TokensPage() {
  const getToken = async () => null;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"packages" | "history">("packages");

  const loadData = useCallback(async () => {
    try {
      const [data, tok] = await Promise.all([
        listJobs(getToken),
        getTokenBalance(getToken),
      ]);
      setJobs(data ?? []);
      setTokenInfo(tok);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tokensBalance  = tokenInfo?.tokens_balance  ?? 0;
  const tokensUsed     = tokenInfo?.tokens_used      ?? 0;
  const tokensRequested = tokenInfo?.tokens_granted  ?? 2000;
  const currentPlan    = tokenInfo?.plan             ?? "Starter";

  const handleRequest = (pkg: (typeof PACKAGES)[number]) => {
    if (pkg.current) return;
    const msg = encodeURIComponent(
      `Hi, I'd like to request the ${pkg.name} plan (₹${pkg.price.toLocaleString("en-IN")}, ${pkg.tokens.toLocaleString()} tokens, ${pkg.duration}) for Ornalens.`
    );
    window.open(`https://wa.me/919901542387?text=${msg}`, "_blank");
  };

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Stats */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between bg-[#141414] border border-[#1f1f1f] rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl bg-[#D4AF37]/10 w-10 h-10 rounded-full flex items-center justify-center">◈</span>
            <span className="text-white font-semibold text-sm">Tokens Balance</span>
          </div>
          <span className="text-[#D4AF37] font-extrabold text-2xl">
            {loading ? "—" : tokensBalance.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between bg-[#141414] border border-[#1f1f1f] rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl bg-[#3B82F6]/10 w-10 h-10 rounded-full flex items-center justify-center">⬇</span>
            <span className="text-white font-semibold text-sm">Total Tokens Requested</span>
          </div>
          <span className="text-[#3B82F6] font-extrabold text-2xl">
            {loading ? "—" : tokensRequested.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between bg-[#141414] border border-[#1f1f1f] rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl bg-[#22C55E]/10 w-10 h-10 rounded-full flex items-center justify-center">📊</span>
            <span className="text-white font-semibold text-sm">Total Tokens Used</span>
          </div>
          <span className="text-[#22C55E] font-extrabold text-2xl">
            {loading ? "—" : tokensUsed.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("packages")}
          className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${
            tab === "packages"
              ? "bg-[#D4AF37] text-[#0a0a0a] border-[#D4AF37]"
              : "bg-[#141414] text-[#888] border-[#222] hover:border-[#444]"
          }`}
        >
          Request Tokens
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${
            tab === "history"
              ? "bg-[#D4AF37] text-[#0a0a0a] border-[#D4AF37]"
              : "bg-[#141414] text-[#888] border-[#222] hover:border-[#444]"
          }`}
        >
          Transaction History
        </button>
      </div>

      {tab === "packages" ? (
        <div>
          <h2 className="text-white font-bold text-base mb-4">Tokens Packages</h2>
          <div className="space-y-4">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative bg-[#141414] rounded-2xl border-2 p-6 ${
                  pkg.name === currentPlan ? "border-[#D4AF37]" : "border-[#1f1f1f]"
                }`}
              >
                {pkg.name === currentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#D4AF37] text-[#0a0a0a] text-xs font-extrabold px-4 py-1 rounded-full">
                      ✓ CURRENT PLAN
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-white font-bold text-lg mb-2">{pkg.name}</p>
                  <p className="text-[#D4AF37] text-4xl font-extrabold mb-1">
                    {pkg.price === 0 ? (
                      <>₹0</>
                    ) : (
                      <>₹{pkg.price.toLocaleString("en-IN")}</>
                    )}
                  </p>
                  {pkg.label && (
                    <p className="text-[#D4AF37] text-sm font-bold mb-1">{pkg.label}</p>
                  )}
                  <p className="text-[#D4AF37] font-semibold text-sm">
                    {pkg.tokens.toLocaleString()} Tokens
                  </p>
                  <p className="text-[#666] text-sm mb-5">{pkg.duration}</p>
                  <button
                    onClick={() => handleRequest(pkg)}
                    disabled={pkg.name === currentPlan}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                      pkg.name === currentPlan
                        ? "bg-[#D4AF37]/20 text-[#D4AF37]/50 cursor-default"
                        : "bg-gradient-to-r from-[#D4AF37] to-[#f0c040] text-[#0a0a0a] hover:brightness-105 active:scale-[0.99]"
                    }`}
                  >
                    {pkg.name === currentPlan ? "Current Plan" : "Request Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-white font-bold text-base mb-4">Transaction History</h2>
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block h-6 w-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[#666] text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Grant entry */}
              <div className="flex items-center justify-between bg-[#141414] border border-[#1f1f1f] rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-semibold">{currentPlan} Plan — Token Grant</p>
                  <p className="text-[#666] text-xs mt-0.5">Free allocation</p>
                </div>
                <span className="text-[#22C55E] font-bold text-sm">+{tokensRequested.toLocaleString()}</span>
              </div>
              {/* One row per completed generation */}
              {jobs
                .filter((j) => j.status === "completed")
                .map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between bg-[#141414] border border-[#1f1f1f] rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {job.jewellery_description ?? "Image Generation"}
                      </p>
                      <p className="text-[#666] text-xs mt-0.5">
                        {new Date(job.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="text-[#EF4444] font-bold text-sm">-450</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
