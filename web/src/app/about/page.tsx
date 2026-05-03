import Link from "next/link";

const GOLD_TEXT = "#9A6F0A";
const BG        = "#FAF7F2";
const CARD      = "#FFFFFF";
const CARD_ALT  = "#F5F0E8";
const MUTED     = "#7A6550";
const BORDER    = "#E8DDD0";
const TEXT      = "#1C1209";

export const metadata = {
  title: "About Us — Ornalens",
  description: "Ornalens is an AI-powered jewellery photography platform built for Indian jewellers. Learn our story, mission, and team.",
};

export default function AboutPage() {
  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "var(--font-geist-sans)" }}>

      {/* ── NAV ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", height: "64px", borderBottom: `1px solid ${BORDER}`, background: CARD }}>
        <Link href="/" style={{ color: GOLD_TEXT, fontWeight: 800, fontSize: "1.15rem", textDecoration: "none" }}>◆ Ornalens</Link>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Link href="/contact" style={{ color: MUTED, fontSize: "0.9rem", textDecoration: "none" }}>Contact</Link>
          <Link href="/dashboard" style={{ background: GOLD_TEXT, color: "#fff", padding: "0.4rem 1.1rem", borderRadius: "6px", fontSize: "0.9rem", fontWeight: 700, textDecoration: "none" }}>Get Started →</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "5rem 1.5rem 3rem", textAlign: "center", background: CARD_ALT, borderBottom: `1px solid ${BORDER}` }}>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 800, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
          About <span style={{ color: GOLD_TEXT }}>Ornalens</span>
        </h1>
        <p style={{ color: MUTED, fontSize: "1.1rem", maxWidth: "620px", margin: "0 auto", lineHeight: 1.7 }}>
          AI-powered jewellery photography built specifically for Indian jewellers — from small family stores to large brands.
        </p>
      </section>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "4rem 1.5rem" }}>

        {/* Mission */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem", color: TEXT }}>Our Mission</h2>
          <p style={{ color: MUTED, lineHeight: 1.8, fontSize: "1.05rem" }}>
            India has over 5 million jewellers. Yet the overwhelming majority cannot afford professional photography for every piece they create.
            A single studio shoot costs ₹50,000–₹2,00,000 and takes 3–5 days. The result is that beautiful, handcrafted jewellery is presented in blurry phone photos and loses sales it deserves.
          </p>
          <p style={{ color: MUTED, lineHeight: 1.8, fontSize: "1.05rem", marginTop: "1rem" }}>
            Ornalens exists to change that. We use artificial intelligence to give every jeweller — regardless of budget — access to
            studio-quality model photography and cinematic videos. One upload, 15 minutes, from ₹1,299.
          </p>
        </section>

        {/* What We Do */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1.5rem", color: TEXT }}>What We Do</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {[
              { icon: "🤖", title: "AI Model Photography", desc: "Upload one product photo and AI places your jewellery on a professional model with accurate skin tone, attire, and lighting." },
              { icon: "📸", title: "5 Angle Shots", desc: "Front, side, 3/4 view, close-up, and editorial — all generated automatically from a single source image." },
              { icon: "🎬", title: "Cinematic Video", desc: "5 short video clips per angle stitched into one final edited reel — ready for Instagram, WhatsApp, and your website." },
              { icon: "🇮🇳", title: "Built for India", desc: "Our AI is trained to understand Indian skin tones, traditional jewellery types, and ethnic fashion styles." },
            ].map((item) => (
              <div key={item.title} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1.5rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{item.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: "1rem" }}>{item.title}</div>
                <div style={{ color: MUTED, fontSize: "0.9rem", lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Company Details */}
        <section style={{ marginBottom: "3.5rem", background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "1.25rem", color: TEXT }}>Company Information</h2>
          {[
            { label: "Brand Name", value: "Ornalens" },
            { label: "Service", value: "AI Jewellery Photography — photos, angle shots & cinematic video reels" },
            { label: "Operated By", value: "Growplus Creative Agency" },
            { label: "Country", value: "India" },
            { label: "Website", value: "ornalens.vercel.app" },
            { label: "Contact Email", value: "hello@ornalens.com" },
            { label: "Contact Phone", value: "+91 99015 42387" },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", gap: "1rem", padding: "0.65rem 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontWeight: 600, minWidth: "160px", color: TEXT, fontSize: "0.9rem" }}>{row.label}</span>
              <span style={{ color: MUTED, fontSize: "0.9rem" }}>{row.value}</span>
            </div>
          ))}
        </section>

        {/* Powered By */}
        <section style={{ marginBottom: "3.5rem" }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem", color: TEXT }}>Powered By Growplus</h2>
          <p style={{ color: MUTED, lineHeight: 1.8, fontSize: "1.05rem" }}>
            Ornalens is a product by{" "}
            <a href="https://growplus.site" target="_blank" rel="noopener noreferrer" style={{ color: GOLD_TEXT, fontWeight: 600, textDecoration: "none" }}>Growplus</a>,
            an AI-first creative agency based in India. Growplus helps brands scale through AI automation, content creation, and premium digital products.
            Ornalens is our flagship product for the jewellery industry — built from real conversations with Indian jewellers about what they need most.
          </p>
        </section>

        {/* CTA */}
        <div style={{ textAlign: "center", background: CARD_ALT, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "2.5rem" }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>Ready to try it?</h3>
          <p style={{ color: MUTED, marginBottom: "1.5rem" }}>Get your first shoot done in under 15 minutes.</p>
          <Link href="/dashboard" style={{ background: "#D4AF37", color: TEXT, fontWeight: 700, padding: "0.85rem 2rem", borderRadius: "8px", fontSize: "1rem", textDecoration: "none" }}>
            Start for ₹1,299 →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "2rem", background: CARD_ALT, textAlign: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.25rem", marginBottom: "1rem" }}>
          {[
            { label: "Home", href: "/" }, { label: "Contact", href: "/contact" },
            { label: "Privacy Policy", href: "/privacy" }, { label: "Terms", href: "/terms" },
            { label: "Refund Policy", href: "/refund" },
          ].map((l) => (
            <Link key={l.label} href={l.href} style={{ color: MUTED, fontSize: "0.85rem", textDecoration: "none" }}>{l.label}</Link>
          ))}
        </div>
        <span style={{ color: MUTED, fontSize: "0.8rem" }}>© 2026 Ornalens. All rights reserved.</span>
      </footer>
    </div>
  );
}
