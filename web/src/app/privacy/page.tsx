import Link from "next/link";

const GOLD_TEXT = "#9A6F0A";
const BG        = "#FAF7F2";
const CARD      = "#FFFFFF";
const CARD_ALT  = "#F5F0E8";
const MUTED     = "#7A6550";
const BORDER    = "#E8DDD0";
const TEXT      = "#1C1209";

export const metadata = {
  title: "Privacy Policy — Ornalens",
  description: "Ornalens Privacy Policy. How we collect, use, and protect your data.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: TEXT, marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${BORDER}` }}>{title}</h2>
      <div style={{ color: MUTED, lineHeight: 1.8, fontSize: "0.95rem" }}>{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "var(--font-geist-sans)" }}>

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", height: "64px", borderBottom: `1px solid ${BORDER}`, background: CARD }}>
        <Link href="/" style={{ color: GOLD_TEXT, fontWeight: 800, fontSize: "1.15rem", textDecoration: "none" }}>◆ Ornalens</Link>
        <Link href="/contact" style={{ color: MUTED, fontSize: "0.9rem", textDecoration: "none" }}>Contact Us</Link>
      </nav>

      <section style={{ padding: "4rem 1.5rem 2.5rem", textAlign: "center", background: CARD_ALT, borderBottom: `1px solid ${BORDER}` }}>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, marginBottom: "0.75rem" }}>Privacy Policy</h1>
        <p style={{ color: MUTED, fontSize: "0.95rem" }}>Last updated: 3 May 2026</p>
      </section>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3.5rem 1.5rem" }}>

        <Section title="1. Introduction">
          <p>Ornalens (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is operated by Growplus Creative Agency. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services at ornalens.vercel.app.</p>
          <p style={{ marginTop: "0.75rem" }}>By using our services, you agree to the collection and use of information in accordance with this policy.</p>
        </Section>

        <Section title="2. Information We Collect">
          <p><strong style={{ color: TEXT }}>Account Information:</strong> Your name, email address, and profile data collected via Clerk authentication (Google/email sign-in).</p>
          <p style={{ marginTop: "0.75rem" }}><strong style={{ color: TEXT }}>Jewellery Images:</strong> Photos you upload for AI processing. These are stored securely in Supabase cloud storage and are used solely to generate your photoshoot output.</p>
          <p style={{ marginTop: "0.75rem" }}><strong style={{ color: TEXT }}>Payment Information:</strong> Payment is processed by Razorpay. We do not store your card details. We receive confirmation of payment (order ID, amount, status) only.</p>
          <p style={{ marginTop: "0.75rem" }}><strong style={{ color: TEXT }}>Usage Data:</strong> Job history, token usage, and platform interactions — used to provide and improve our service.</p>
        </Section>

        <Section title="3. How We Use Your Information">
          <ul style={{ paddingLeft: "1.25rem" }}>
            <li style={{ marginBottom: "0.5rem" }}>To process and deliver your AI jewellery photoshoots</li>
            <li style={{ marginBottom: "0.5rem" }}>To manage your account, token balance, and subscription</li>
            <li style={{ marginBottom: "0.5rem" }}>To process payments via Razorpay</li>
            <li style={{ marginBottom: "0.5rem" }}>To send you service-related communications (job completions, support responses)</li>
            <li style={{ marginBottom: "0.5rem" }}>To improve our AI models and platform performance</li>
          </ul>
        </Section>

        <Section title="4. Data Sharing">
          <p>We do not sell, trade, or rent your personal information to third parties. We share data only with:</p>
          <ul style={{ paddingLeft: "1.25rem", marginTop: "0.75rem" }}>
            <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: TEXT }}>Clerk</strong> — authentication and identity management</li>
            <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: TEXT }}>Supabase</strong> — database and image storage</li>
            <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: TEXT }}>Razorpay</strong> — payment processing</li>
            <li style={{ marginBottom: "0.5rem" }}><strong style={{ color: TEXT }}>AI Processing APIs</strong> — for generating model images and videos (your jewellery image is processed but not stored by these providers)</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>We retain your account data and generated images for as long as your account is active. You may request deletion of your data at any time by contacting us at hello@ornalens.com.</p>
        </Section>

        <Section title="6. Security">
          <p>We implement industry-standard security measures including encrypted transmission (HTTPS), secure cloud storage, and row-level security on our database. No method of transmission over the internet is 100% secure, but we take all reasonable precautions.</p>
        </Section>

        <Section title="7. Cookies">
          <p>We use cookies and similar technologies for authentication (session cookies) and basic analytics. You may disable cookies in your browser settings, but this may affect certain functionality.</p>
        </Section>

        <Section title="8. Your Rights">
          <p>You have the right to: access the personal data we hold about you; request correction or deletion of your data; withdraw consent at any time; and lodge a complaint with a relevant data protection authority.</p>
          <p style={{ marginTop: "0.75rem" }}>To exercise these rights, contact us at <a href="mailto:hello@ornalens.com" style={{ color: GOLD_TEXT }}>hello@ornalens.com</a>.</p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>Our service is not directed to children under 13. We do not knowingly collect personal information from children.</p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page with an updated date.</p>
        </Section>

        <Section title="11. Contact">
          <p>For privacy-related questions, contact us at:</p>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "1.25rem", marginTop: "0.75rem" }}>
            <div style={{ marginBottom: "0.4rem" }}><strong style={{ color: TEXT }}>Email:</strong> hello@ornalens.com</div>
            <div style={{ marginBottom: "0.4rem" }}><strong style={{ color: TEXT }}>WhatsApp:</strong> +91 99015 42387</div>
            <div><strong style={{ color: TEXT }}>Business:</strong> Ornalens by Growplus Creative Agency, India</div>
          </div>
        </Section>
      </div>

      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "2rem", background: CARD_ALT, textAlign: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.25rem", marginBottom: "1rem" }}>
          {[
            { label: "Home", href: "/" }, { label: "About Us", href: "/about" },
            { label: "Contact", href: "/contact" }, { label: "Terms", href: "/terms" },
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
