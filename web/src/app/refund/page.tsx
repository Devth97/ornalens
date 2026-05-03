import Link from "next/link";

const GOLD_TEXT = "#9A6F0A";
const BG        = "#FAF7F2";
const CARD      = "#FFFFFF";
const CARD_ALT  = "#F5F0E8";
const MUTED     = "#7A6550";
const BORDER    = "#E8DDD0";
const TEXT      = "#1C1209";

export const metadata = {
  title: "Refund & Cancellation Policy — Ornalens",
  description: "Ornalens Refund and Cancellation Policy. Understand when and how refunds are processed.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: TEXT, marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${BORDER}` }}>{title}</h2>
      <div style={{ color: MUTED, lineHeight: 1.8, fontSize: "0.95rem" }}>{children}</div>
    </section>
  );
}

export default function RefundPage() {
  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", fontFamily: "var(--font-geist-sans)" }}>

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", height: "64px", borderBottom: `1px solid ${BORDER}`, background: CARD }}>
        <Link href="/" style={{ color: GOLD_TEXT, fontWeight: 800, fontSize: "1.15rem", textDecoration: "none" }}>◆ Ornalens</Link>
        <Link href="/contact" style={{ color: MUTED, fontSize: "0.9rem", textDecoration: "none" }}>Contact Us</Link>
      </nav>

      <section style={{ padding: "4rem 1.5rem 2.5rem", textAlign: "center", background: CARD_ALT, borderBottom: `1px solid ${BORDER}` }}>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, marginBottom: "0.75rem" }}>Refund &amp; Cancellation Policy</h1>
        <p style={{ color: MUTED, fontSize: "0.95rem" }}>Last updated: 3 May 2026</p>
      </section>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3.5rem 1.5rem" }}>

        {/* Summary box */}
        <div style={{ background: "rgba(154,111,10,0.07)", border: `1px solid rgba(154,111,10,0.2)`, borderRadius: "12px", padding: "1.5rem", marginBottom: "2.5rem" }}>
          <div style={{ fontWeight: 700, color: GOLD_TEXT, marginBottom: "0.5rem", fontSize: "1rem" }}>Summary</div>
          <ul style={{ paddingLeft: "1.25rem", color: MUTED, fontSize: "0.95rem" }}>
            <li style={{ marginBottom: "0.4rem" }}>Refund requests must be raised within <strong style={{ color: TEXT }}>7 days</strong> of the transaction</li>
            <li style={{ marginBottom: "0.4rem" }}>Unused credits are fully refundable within 7 days</li>
            <li style={{ marginBottom: "0.4rem" }}>If your generation failed due to a platform error, credits are fully restored</li>
            <li style={{ marginBottom: "0.4rem" }}>Contact us at <a href="mailto:hello@ornalens.com" style={{ color: GOLD_TEXT, textDecoration: "none" }}>hello@ornalens.com</a> or WhatsApp <a href="https://wa.me/919901542387" style={{ color: GOLD_TEXT, textDecoration: "none" }}>+91 99015 42387</a></li>
          </ul>
        </div>

        <Section title="1. Overview">
          <p>At Ornalens, we want every jeweller to be satisfied with the results. This policy explains the conditions under which we offer refunds for credit purchases made on our platform.</p>
          <p style={{ marginTop: "0.75rem" }}>As our service delivers digital outputs (AI-generated images and videos), all refunds are evaluated on a case-by-case basis. We are committed to resolving genuine issues fairly and promptly.</p>
        </Section>

        <Section title="2. Eligible for Refund">
          <p>You are eligible for a full or partial refund in the following situations:</p>
          <ul style={{ paddingLeft: "1.25rem", marginTop: "0.75rem" }}>
            <li style={{ marginBottom: "0.6rem" }}><strong style={{ color: TEXT }}>Unused credits</strong> — If you purchased credits but have not used any of them, you may request a full refund within 7 days of purchase.</li>
            <li style={{ marginBottom: "0.6rem" }}><strong style={{ color: TEXT }}>Platform failure</strong> — If a generation fails due to a technical error on our end (e.g., the AI pipeline fails to complete), the consumed credit is automatically restored to your account. If restoration does not occur within 24 hours, contact us for a manual resolution.</li>
            <li style={{ marginBottom: "0.6rem" }}><strong style={{ color: TEXT }}>Duplicate payment</strong> — If you were charged twice for the same order, the duplicate payment will be refunded in full.</li>
            <li style={{ marginBottom: "0.6rem" }}><strong style={{ color: TEXT }}>Serious quality issue</strong> — If the generated result is substantially incorrect (e.g., jewellery design is unrecognisable), raise a request within 7 days with screenshots, and we will review and credit or refund accordingly.</li>
          </ul>
        </Section>

        <Section title="3. Not Eligible for Refund">
          <ul style={{ paddingLeft: "1.25rem" }}>
            <li style={{ marginBottom: "0.5rem" }}>Credits that have already been used to generate a photoshoot (where the generation completed successfully)</li>
            <li style={{ marginBottom: "0.5rem" }}>Refund requests raised more than 7 days after the transaction date</li>
            <li style={{ marginBottom: "0.5rem" }}>Dissatisfaction with the AI style, model appearance, or aesthetic — these are inherent to generative AI and are disclosed in our product description</li>
            <li style={{ marginBottom: "0.5rem" }}>Purchases of the free Starter plan (₹0)</li>
          </ul>
        </Section>

        <Section title="4. How to Request a Refund">
          <p>To raise a refund request:</p>
          <ol style={{ paddingLeft: "1.25rem", marginTop: "0.75rem" }}>
            <li style={{ marginBottom: "0.6rem" }}>Email us at <a href="mailto:hello@ornalens.com" style={{ color: GOLD_TEXT, textDecoration: "none" }}>hello@ornalens.com</a> or contact us on WhatsApp at +91 99015 42387</li>
            <li style={{ marginBottom: "0.6rem" }}>Provide your registered email, the Razorpay order/payment ID, and the reason for the refund</li>
            <li style={{ marginBottom: "0.6rem" }}>If the issue is quality-related, attach screenshots of the generated result</li>
          </ol>
          <p style={{ marginTop: "0.75rem" }}>We will acknowledge your request within 24 hours and aim to resolve it within 5–7 business days.</p>
        </Section>

        <Section title="5. Refund Processing">
          <ul style={{ paddingLeft: "1.25rem" }}>
            <li style={{ marginBottom: "0.5rem" }}>Approved refunds are processed back to the original payment method (UPI, card, net banking, etc.) via Razorpay</li>
            <li style={{ marginBottom: "0.5rem" }}>Refunds typically appear in your account within <strong style={{ color: TEXT }}>5–10 business days</strong> depending on your bank</li>
            <li style={{ marginBottom: "0.5rem" }}>In some cases, Razorpay fees (if any) may not be refunded</li>
          </ul>
        </Section>

        <Section title="6. Cancellations">
          <p>Ornalens does not offer subscription plans at this time — you pay only for credits you purchase. There is nothing to &ldquo;cancel&rdquo; in the traditional subscription sense.</p>
          <p style={{ marginTop: "0.75rem" }}>If you wish to stop using the platform, simply stop purchasing credits. Your account and any unused credits remain available. You may request account deletion by emailing us.</p>
        </Section>

        <Section title="7. Contact for Refunds">
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "1.25rem" }}>
            <div style={{ marginBottom: "0.5rem" }}><strong style={{ color: TEXT }}>Email:</strong>{" "}
              <a href="mailto:hello@ornalens.com" style={{ color: GOLD_TEXT, textDecoration: "none" }}>hello@ornalens.com</a>
            </div>
            <div style={{ marginBottom: "0.5rem" }}><strong style={{ color: TEXT }}>WhatsApp:</strong>{" "}
              <a href="https://wa.me/919901542387" style={{ color: GOLD_TEXT, textDecoration: "none" }}>+91 99015 42387</a>
            </div>
            <div><strong style={{ color: TEXT }}>Response time:</strong> Within 24 hours (Mon–Sat, 9 AM – 7 PM IST)</div>
          </div>
        </Section>
      </div>

      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: "2rem", background: CARD_ALT, textAlign: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1.25rem", marginBottom: "1rem" }}>
          {[
            { label: "Home", href: "/" }, { label: "About Us", href: "/about" },
            { label: "Contact", href: "/contact" }, { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
          ].map((l) => (
            <Link key={l.label} href={l.href} style={{ color: MUTED, fontSize: "0.85rem", textDecoration: "none" }}>{l.label}</Link>
          ))}
        </div>
        <span style={{ color: MUTED, fontSize: "0.8rem" }}>© 2026 Ornalens. All rights reserved.</span>
      </footer>
    </div>
  );
}
