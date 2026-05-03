"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard",         label: "Dashboard", icon: "⊞" },
  { href: "/dashboard/create",  label: "Create",    icon: "✦" },
  { href: "/dashboard/gallery", label: "Gallery",   icon: "🖼" },
  { href: "/dashboard/history", label: "History",   icon: "🕐" },
  { href: "/dashboard/tokens",  label: "Tokens",    icon: "◈" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-[#D4AF37] text-xl font-bold">◆ Ornalens</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[#D4AF37] bg-[#D4AF37]/10"
                      : "text-[#888] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <a href="/sign-in" className="text-sm text-[#888] hover:text-white transition-colors">Sign In</a>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex border-t border-[#1a1a1a]">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
                  isActive
                    ? "text-[#D4AF37] border-b-2 border-[#D4AF37]"
                    : "text-[#888]"
                }`}
              >
                <span className="block text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
