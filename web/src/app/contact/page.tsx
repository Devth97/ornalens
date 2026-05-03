import Link from "next/link";

const GOLD_TEXT = "#9A6F0A";
const BG        = "#FAF7F2";
const CARD      = "#FFFFFF";
const CARD_ALT  = "#F5F0E8";
const MUTED     = "#7A6550";
const BORDER    = "#E8DDD0";
const TEXT      = "#1C1209";

export const metadata = {
  title: "Contact Us — Ornalens",
  description: "Get in touch with the Ornalens team. We are here to help with your AI jewellery photography needs.",
};

export default function ContactPage() {
  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "var(--font-geist-sans)" }}>

      {/* ── NAV ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", height: "64px", borderBottom: `1px solid ${BORDER}`, background: CARD }}>
        <Link href="/" style={{ color: GOLD_TEXT, fontWeight: 800, fontSize: "1.15rem", textDecoration: "none" }}>◆ Ornalens</Link>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Link href="/about" style={{ color: MUTED, fontSize: "0.9rem", textDecoration: "none" }}>About</Link>
          <Link href="/dashboard" style={{ background: GOLD_TEXT, color: "#fff", padding: "0.4rem 1.1rem", borderRadius: "6px", fontSize: "0.9rem", fontWeight: 700, textDecoration: "none" }}>Get Started →</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "5rem 1.5rem 3rem", textAlign: "center", background: CARD_ALT, borderBottom: `1px solid ${BORDER}` }}>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
          Contact <span style={{ color: GOLD_TEXT }}>Us</span>
        </h1>
        <p style={{ color: MUTED, fontSize: "1.05rem", maxWidth: "540px", margin: "0 auto", lineHeight: 1.7 }}>
          We typically respond within a few hours. Reach us on WhatsApp for the fastest reply.
        </p>
      </section>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "4rem 1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>

          {/* WhatsApp */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "2rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>💬</div>
            <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>WhatsApp (Fastest)</h3>
            <p style={{ color: MUTED, fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              For support, plan enquiries, and anything else — WhatsApp is the quickest way to reach us.
            </p>
            <a
              href="https://wa.me/919901542387"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-block", background: "#25D366", color: "#fff", fontWeight: 700, padding: "0.65rem 1.5rem", borderRadius: "8px", textDecoration: "none", fontSize: "0.95rem" }}
            >
              Chat on WhatsApp →
            </a>
          </div>

          {/* Email */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "2rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>✉️</div>
            <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>Email</h3>
            <p style={{ color: MUTED, fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              For billing, refund requests, and formal queries. We respond within 24 business hours.
            </p>
            <a
              href="mailto:hello@ornalens.com"
              style={{ display: "inline-block", background: GOLD_TEXT, color: "#fff", fontWeight: 700, padding: "0.65rem 1.5rem", borderRadius: "8px", textDecoration: "none", fontSize: "0.95rem" }}
            >
              hello@ornalens.com
            </a>
          </div>
        </div>

        {/* Contact Details Card */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "2rem", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "1.5rem" }}>Business Details</h2>
          {[
            { label: "Business Name", value: "Ornalens (by Growplus Creative Agency)" },
            { label: "Phone / WhatsApp", value: "+91 99015 42387" },
            { label: "Email", value: "hello@ornalens.com" },
            { label: "Website", value: "ornalens.vercel.app" },
            { label: "Country", value: "India" },
            { label: "Operating Hours", value: "Mon–Sat, 9 AM – 7 PM IST" },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem 1.5rem", padding: "0.7rem 0", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontWeight: 600, minWidth: "180px", color: TEXT, fontSize: "0.9rem" }}>{row.label}</span>
              <span style={{ color: MUTED, fontSize: "0.9rem" }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "1.5rem" }}>Common Questions</h2>
          {[
            { q: "How quickly do I get my photos and videos?", a: "Typically 10–20 minutes from the time you submit your jewellery photo. You will be notified in the app when it's ready." },
            { q: "What if I'm not satisfied with the result?", a: "Please reach out within 7 days of the shoot. We will review and, where applicable, process a refund as per our Refund Policy." },
            { q: "Can I upgrade my token plan?", a: "Yes, contact us on WhatsApp or email and we will upgrade your plan immediately." },
            { q: "Is my jewellery design safe?", a: "Yes. Your designs are never shared or used to train AI models. They are processed solely for your shoot and stored securely." },
          ].map((item) => (
            <div key={item.q} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "1.5rem", marginBottom: "1rem" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: "0.95rem" }}>{item.q}</div>
              <div style={{ color: MUTED, fontSize: "0.9rem", lineHeight: 1.6 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "2rem", background: CARD_ALT, textAlign: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.25rem", marginBottom: "1rem" }}>
          {[
            { label: "Home", href: "/" }, { label: "About Us", href: "/about" },
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
