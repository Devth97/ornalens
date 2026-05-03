import Link from "next/link";

const GOLD_TEXT = "#9A6F0A";
const BG        = "#FAF7F2";
const CARD      = "#FFFFFF";
const CARD_ALT  = "#F5F0E8";
const MUTED     = "#7A6550";
const BORDER    = "#E8DDD0";
const TEXT      = "#1C1209";

export const metadata = {
  title: "Terms & Conditions — Ornalens",
  description: "Ornalens Terms and Conditions. Rules governing use of our AI jewellery photography platform.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: TEXT, marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${BORDER}` }}>{title}</h2>
      <div style={{ color: MUTED, lineHeight: 1.8, fontSize: "0.95rem" }}>{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "var(--font-geist-sans)" }}>

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", height: "64px", borderBottom: `1px solid ${BORDER}`, background: CARD }}>
        <Link href="/" style={{ color: GOLD_TEXT, fontWeight: 800, fontSize: "1.15rem", textDecoration: "none" }}>◆ Ornalens</Link>
        <Link href="/contact" style={{ color: MUTED, fontSize: "0.9rem", textDecoration: "none" }}>Contact Us</Link>
      </nav>

      <section style={{ padding: "4rem 1.5rem 2.5rem", textAlign: "center", background: CARD_ALT, borderBottom: `1px solid ${BORDER}` }}>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, marginBottom: "0.75rem" }}>Terms &amp; Conditions</h1>
        <p style={{ color: MUTED, fontSize: "0.95rem" }}>Last updated: 3 May 2026</p>
      </section>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3.5rem 1.5rem" }}>

        <Section title="1. Acceptance of Terms">
          <p>By accessing or using Ornalens (&ldquo;the Service&rdquo;) at ornalens.vercel.app, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Service. These Terms apply to all users, visitors, and others who access or use the Service.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>Ornalens provides an AI-powered platform that enables jewellers to generate professional model photographs and cinematic video reels of their jewellery products. The service is operated by Growplus Creative Agency, India.</p>
          <p style={{ marginTop: "0.75rem" }}>The Service requires purchasing token credits. Each credit corresponds to one complete photoshoot generation (model portrait + 5 angle shots + 5 video clips + final edited reel).</p>
        </Section>

        <Section title="3. User Accounts">
          <ul style={{ paddingLeft: "1.25rem" }}>
            <li style={{ marginBottom: "0.5rem" }}>You must create an account to use the Service. You are responsible for maintaining the confidentiality of your credentials.</li>
            <li style={{ marginBottom: "0.5rem" }}>You must be at least 18 years old to create an account and make purchases.</li>
            <li style={{ marginBottom: "0.5rem" }}>You are responsible for all activities that occur under your account.</li>
            <li style={{ marginBottom: "0.5rem" }}>We reserve the right to terminate accounts that violate these Terms.</li>
          </ul>
        </Section>

        <Section title="4. Payments and Credits">
          <ul style={{ paddingLeft: "1.25rem" }}>
            <li style={{ marginBottom: "0.5rem" }}>All payments are processed securely by Razorpay. We do not store card or bank account details.</li>
            <li style={{ marginBottom: "0.5rem" }}>Credits are non-transferable and tied to your account.</li>
            <li style={{ marginBottom: "0.5rem" }}>Credits do not expire for a period of 12 months from the date of purchase.</li>
            <li style={{ marginBottom: "0.5rem" }}>Prices are in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.</li>
            <li style={{ marginBottom: "0.5rem" }}>We reserve the right to change pricing with reasonable notice.</li>
          </ul>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to:</p>
          <ul style={{ paddingLeft: "1.25rem", marginTop: "0.75rem" }}>
            <li style={{ marginBottom: "0.5rem" }}>Upload images that are illegal, obscene, or infringe third-party intellectual property rights</li>
            <li style={{ marginBottom: "0.5rem" }}>Attempt to reverse-engineer, copy, or replicate the AI models or platform</li>
            <li style={{ marginBottom: "0.5rem" }}>Use the Service for any commercial purpose other than your own jewellery marketing</li>
            <li style={{ marginBottom: "0.5rem" }}>Upload images that do not belong to you or for which you do not have rights</li>
            <li style={{ marginBottom: "0.5rem" }}>Attempt to circumvent payment or abuse the Starter free credit</li>
          </ul>
        </Section>

        <Section title="6. Intellectual Property">
          <p><strong style={{ color: TEXT }}>Your content:</strong> You retain ownership of the jewellery images you upload. By uploading, you grant us a limited licence to process them for the purpose of generating your photoshoot.</p>
          <p style={{ marginTop: "0.75rem" }}><strong style={{ color: TEXT }}>Generated content:</strong> The AI-generated images and videos created from your uploads are owned by you. You may use them freely for commercial purposes including social media, e-commerce, and advertising.</p>
          <p style={{ marginTop: "0.75rem" }}><strong style={{ color: TEXT }}>Platform:</strong> All platform code, branding, and AI systems are the intellectual property of Ornalens / Growplus Creative Agency.</p>
        </Section>

        <Section title="7. Disclaimers">
          <p>The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind. We do not guarantee that:</p>
          <ul style={{ paddingLeft: "1.25rem", marginTop: "0.75rem" }}>
            <li style={{ marginBottom: "0.5rem" }}>AI-generated images will perfectly represent every jewellery piece in every case</li>
            <li style={{ marginBottom: "0.5rem" }}>The Service will be uninterrupted or error-free at all times</li>
          </ul>
          <p style={{ marginTop: "0.75rem" }}>We will make every reasonable effort to deliver high-quality results and to resolve any quality issues.</p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>To the maximum extent permitted by law, Ornalens and Growplus Creative Agency shall not be liable for any indirect, incidental, or consequential damages arising from use of the Service. Our total liability for any claim shall not exceed the amount you paid for the specific generation in question.</p>
        </Section>

        <Section title="9. Refunds">
          <p>Please refer to our <Link href="/refund" style={{ color: GOLD_TEXT, textDecoration: "none" }}>Refund Policy</Link> for full details on eligibility and process.</p>
        </Section>

        <Section title="10. Termination">
          <p>We reserve the right to suspend or terminate your account if you violate these Terms. Upon termination, unused credits may be refunded at our discretion. You may delete your account at any time by contacting us.</p>
        </Section>

        <Section title="11. Governing Law">
          <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in India.</p>
        </Section>

        <Section title="12. Contact">
          <p>For questions about these Terms, contact us at:</p>
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
            { label: "Contact", href: "/contact" }, { label: "Privacy Policy", href: "/privacy" },
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
