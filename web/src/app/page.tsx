"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const GOLD = "#D4AF37";
const BG = "#0a0a0a";
const CARD = "#141414";
const MUTED = "#888888";

export default function Home() {
  const navRef = useRef<HTMLElement>(null);
  const heroHeadlineRef = useRef<HTMLDivElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroCTARef = useRef<HTMLDivElement>(null);
  const heroLineRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const problemLeftRef = useRef<HTMLDivElement>(null);
  const problemRightRef = useRef<HTMLDivElement>(null);
  const howStepsRef = useRef<HTMLDivElement>(null);
  const whatGridRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const ctaSectionRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // --- NAV: transparent → blur on scroll ---
    const nav = navRef.current;
    if (nav) {
      ScrollTrigger.create({
        start: "top -80",
        onUpdate: (self) => {
          if (self.progress > 0) {
            nav.style.background = "rgba(10,10,10,0.85)";
            nav.style.backdropFilter = "blur(12px)";
            nav.style.borderBottom = `1px solid rgba(212,175,55,0.15)`;
          } else {
            nav.style.background = "transparent";
            nav.style.backdropFilter = "none";
            nav.style.borderBottom = "1px solid transparent";
          }
        },
      });
    }

    // --- HERO: stagger chars on headline ---
    const headline = heroHeadlineRef.current;
    if (headline) {
      const spans = headline.querySelectorAll(".char");
      gsap.fromTo(
        spans,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.03,
          ease: "power3.out",
          delay: 0.3,
        }
      );
    }

    // hero sub + CTA fade in
    gsap.fromTo(
      [heroSubRef.current, heroCTARef.current, heroLineRef.current],
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: "power2.out", delay: 1.2 }
    );

    // scroll hint bounce
    if (scrollHintRef.current) {
      gsap.to(scrollHintRef.current, {
        y: 8,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    // --- STATS: count-up on scroll ---
    const statsSection = statsRef.current;
    if (statsSection) {
      const counters = statsSection.querySelectorAll<HTMLElement>("[data-count]");
      counters.forEach((el) => {
        const attr = el.getAttribute("data-count") || "0";
        const isRupee = attr.includes("50,000");
        const isMin = attr.includes("15");

        ScrollTrigger.create({
          trigger: statsSection,
          start: "top 80%",
          once: true,
          onEnter: () => {
            if (isRupee) {
              const obj = { val: 0 };
              gsap.to(obj, {
                val: 50000,
                duration: 2,
                ease: "power2.out",
                onUpdate: () => {
                  el.textContent = "₹" + Math.round(obj.val).toLocaleString("en-IN") + "+";
                },
              });
            } else if (isMin) {
              const obj = { val: 0 };
              gsap.to(obj, {
                val: 15,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => {
                  el.textContent = Math.round(obj.val) + " min";
                },
              });
            } else {
              // millions
              const obj = { val: 0 };
              gsap.to(obj, {
                val: 5,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => {
                  el.textContent = Math.round(obj.val) + "M+";
                },
              });
            }
          },
        });
      });
    }

    // --- PROBLEM: slide in from sides ---
    if (problemLeftRef.current) {
      gsap.fromTo(
        problemLeftRef.current,
        { x: -100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: problemLeftRef.current, start: "top 80%", once: true },
        }
      );
    }
    if (problemRightRef.current) {
      gsap.fromTo(
        problemRightRef.current,
        { x: 100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: problemRightRef.current, start: "top 80%", once: true },
        }
      );
    }

    // --- HOW IT WORKS: stagger from bottom ---
    if (howStepsRef.current) {
      const steps = howStepsRef.current.querySelectorAll(".how-step");
      gsap.fromTo(
        steps,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: howStepsRef.current, start: "top 80%", once: true },
        }
      );
    }

    // --- WHAT YOU GET: fade + scale ---
    if (whatGridRef.current) {
      const cards = whatGridRef.current.querySelectorAll(".what-card");
      gsap.fromTo(
        cards,
        { scale: 0.92, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: whatGridRef.current, start: "top 80%", once: true },
        }
      );
    }

    // --- PRICING: fade in ---
    if (pricingRef.current) {
      const cards = pricingRef.current.querySelectorAll(".pricing-card");
      gsap.fromTo(
        cards,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: pricingRef.current, start: "top 80%", once: true },
        }
      );
    }

    // --- TRUST: fade in ---
    if (trustRef.current) {
      const cols = trustRef.current.querySelectorAll(".trust-col");
      gsap.fromTo(
        cols,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: trustRef.current, start: "top 80%", once: true },
        }
      );
    }

    // --- CTA SECTION: scale in ---
    if (ctaSectionRef.current) {
      const inner = ctaSectionRef.current.querySelector(".cta-inner");
      if (inner) {
        gsap.fromTo(
          inner,
          { scale: 0.8, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: ctaSectionRef.current, start: "top 75%", once: true },
          }
        );
      }
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // Helper: split text into char spans
  function SplitChars({ text, className }: { text: string; className?: string }) {
    return (
      <span className={className}>
        {text.split("").map((ch, i) => (
          <span key={i} className="char inline-block" style={{ whiteSpace: ch === " " ? "pre" : undefined }}>
            {ch === " " ? "\u00A0" : ch}
          </span>
        ))}
      </span>
    );
  }

  const WA_LINK = "https://wa.me/919901542387?text=Hi%2C%20I%27m%20interested%20in%20Ornalens%20AI%20jewellery%20photography.%20Can%20you%20help%20me%20get%20started%3F";

  return (
    <div style={{ background: BG, color: "#fff", overflowX: "hidden" }}>
      {/* ── NAV ── */}
      <nav
        ref={navRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 2rem",
          height: "64px",
          background: "transparent",
          borderBottom: "1px solid transparent",
          transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s",
        }}
      >
        <span style={{ color: GOLD, fontWeight: 700, fontSize: "1.25rem", letterSpacing: "0.02em" }}>
          ◆ Ornalens
        </span>
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            border: `1px solid ${GOLD}`,
            color: GOLD,
            padding: "0.45rem 1.25rem",
            borderRadius: "6px",
            fontSize: "0.9rem",
            fontWeight: 600,
            textDecoration: "none",
            transition: "background 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = GOLD;
            (e.currentTarget as HTMLAnchorElement).style.color = "#000";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            (e.currentTarget as HTMLAnchorElement).style.color = GOLD;
          }}
        >
          Get Started →
        </a>
      </nav>

      {/* ── HERO ── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* radial glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "700px",
            height: "700px",
            background: `radial-gradient(ellipse at center, rgba(212,175,55,0.12) 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        <div ref={heroHeadlineRef} style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ margin: 0, lineHeight: 1.1 }}>
            <div
              style={{
                fontSize: "clamp(3rem, 8vw, 6.5rem)",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              <SplitChars text="One Upload." />
            </div>
            <div
              style={{
                fontSize: "clamp(3rem, 8vw, 6.5rem)",
                fontWeight: 800,
                color: GOLD,
                letterSpacing: "-0.02em",
              }}
            >
              <SplitChars text="Zero Photographers." />
            </div>
          </h1>
        </div>

        <p
          ref={heroSubRef}
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: "1.5rem",
            fontSize: "clamp(1rem, 2.5vw, 1.35rem)",
            color: MUTED,
            maxWidth: "600px",
            lineHeight: 1.6,
            opacity: 0,
          }}
        >
          A <span style={{ color: "#fff", fontWeight: 600 }}>₹1,00,000 photo & video shoot</span> for{" "}
          <span style={{ color: GOLD, fontWeight: 700 }}>₹1,299</span>. In 15 minutes.
          <br />
          <span style={{ fontSize: "0.9em" }}>
            Upload your jewellery photo → AI places it on a model → 5 professional angle shots → 5 cinematic videos → final edited reel.
            <br />
            No studio. No model. No videographer. No crew.
          </span>
        </p>

        <div
          ref={heroCTARef}
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: "2.5rem",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
            opacity: 0,
          }}
        >
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: GOLD,
              color: "#000",
              fontWeight: 700,
              padding: "0.85rem 2rem",
              borderRadius: "8px",
              fontSize: "1rem",
              textDecoration: "none",
              transition: "opacity 0.2s, transform 0.2s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
          >
            Start Shooting →
          </a>
          <a
            href="#how"
            style={{
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              fontWeight: 600,
              padding: "0.85rem 2rem",
              borderRadius: "8px",
              fontSize: "1rem",
              textDecoration: "none",
              transition: "border-color 0.2s, background 0.2s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = GOLD;
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(212,175,55,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.25)";
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            }}
          >
            See How It Works
          </a>
        </div>

        {/* gold line */}
        <div
          ref={heroLineRef}
          style={{
            position: "relative",
            zIndex: 1,
            marginTop: "2.5rem",
            width: "120px",
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            opacity: 0,
          }}
        />

        {/* scroll hint */}
        <div
          ref={scrollHintRef}
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            color: MUTED,
            fontSize: "0.85rem",
            letterSpacing: "0.1em",
          }}
        >
          ↓ scroll
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div
        ref={statsRef}
        style={{
          background: CARD,
          borderTop: `1px solid rgba(212,175,55,0.15)`,
          borderBottom: `1px solid rgba(212,175,55,0.15)`,
          padding: "3rem 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0",
          }}
        >
          {[
            { countAttr: "5M+", display: "5M+", label: "Indian Jewellers" },
            { countAttr: "₹50,000+", display: "₹50,000+", label: "Saved Per Photo + Video Shoot" },
            { countAttr: "15", display: "15 min", label: "From Upload to Video" },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                flex: "1 1 200px",
                textAlign: "center",
                padding: "1rem 2rem",
                borderRight: i < 2 ? `1px solid rgba(212,175,55,0.25)` : "none",
                position: "relative",
              }}
            >
              <div
                data-count={stat.countAttr}
                style={{
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  fontWeight: 800,
                  color: GOLD,
                  lineHeight: 1,
                  marginBottom: "0.5rem",
                }}
              >
                {stat.display}
              </div>
              <div style={{ color: MUTED, fontSize: "0.95rem", letterSpacing: "0.03em" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── THE PROBLEM ── */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 800,
              marginBottom: "3rem",
              letterSpacing: "-0.02em",
            }}
          >
            Still paying lakhs for a photo & video shoot?
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {/* OLD WAY */}
            <div
              ref={problemLeftRef}
              style={{
                background: "rgba(180,30,30,0.08)",
                border: "1px solid rgba(180,30,30,0.25)",
                borderRadius: "12px",
                padding: "2rem",
                opacity: 0,
              }}
            >
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e05555", marginBottom: "1.25rem" }}>
                ❌ The Old Way
              </div>
              {[
                "₹50,000–₹2,00,000 per shoot",
                "3–5 days for photos. Extra days for video editing",
                "Photographer + Studio + Model + Videographer + Editor",
                "Poor visuals = lost sales online",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.9rem", color: MUTED, lineHeight: 1.5 }}>
                  <span style={{ color: "#e05555", flexShrink: 0 }}>✗</span>
                  {item}
                </div>
              ))}
            </div>

            {/* ORNAL WAY */}
            <div
              ref={problemRightRef}
              style={{
                background: "rgba(212,175,55,0.06)",
                border: `1px solid rgba(212,175,55,0.3)`,
                borderRadius: "12px",
                padding: "2rem",
                opacity: 0,
              }}
            >
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: GOLD, marginBottom: "1.25rem" }}>
                ✦ The Ornalens Way
              </div>
              {[
                "₹1,299 — photos + videos included",
                "15 minutes, start to finish",
                "Just your phone to upload",
                "5 angle photos + 5 videos + final reel",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.9rem", color: "#ddd", lineHeight: 1.5 }}>
                  <span style={{ color: GOLD, flexShrink: 0 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: "6rem 1.5rem", background: CARD }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 800,
              marginBottom: "0.75rem",
              letterSpacing: "-0.02em",
            }}
          >
            How It Works
          </h2>
          <p style={{ textAlign: "center", color: MUTED, marginBottom: "3.5rem", fontSize: "1rem" }}>
            From one photo to a full photo + video shoot in 4 steps
          </p>
          <div
            ref={howStepsRef}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0",
              alignItems: "start",
              position: "relative",
            }}
          >
            {[
              { icon: "📤", title: "Upload", desc: "Take a photo of your jewellery piece" },
              { icon: "🤖", title: "Image AI", desc: "AI places it on a professional Indian model" },
              { icon: "📸", title: "5 Angle Shots", desc: "Front, side, close-up, editorial — auto-generated" },
              { icon: "🎬", title: "Video AI", desc: "5 cinematic clips stitched into final video" },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
                <div
                  className="how-step"
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "2rem 1rem",
                    opacity: 0,
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{step.icon}</div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: `2px solid ${GOLD}`,
                      color: GOLD,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      marginBottom: "0.75rem",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.5rem" }}>{step.title}</div>
                  <div style={{ color: MUTED, fontSize: "0.9rem", lineHeight: 1.5 }}>{step.desc}</div>
                </div>
                {i < 3 && (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      paddingTop: "3.5rem",
                      color: GOLD,
                      fontSize: "1.5rem",
                      opacity: 0.6,
                      flexShrink: 0,
                    }}
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ── */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 800,
              marginBottom: "0.75rem",
              letterSpacing: "-0.02em",
            }}
          >
            What You Get From 1 Credit
          </h2>
          <p style={{ textAlign: "center", color: MUTED, marginBottom: "3rem", fontSize: "1rem" }}>
            A complete photo shoot AND video shoot — delivered in under 15 minutes
          </p>
          <div
            ref={whatGridRef}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {[
              { icon: "🖼", title: "Model Portrait", desc: "Indian model wearing your exact jewellery" },
              { icon: "📸", title: "5 Angle Shots", desc: "Front, 3/4, close-up, side, overhead" },
              { icon: "🎬", title: "5 Video Clips", desc: "Cinematic 5-second clips per angle" },
              { icon: "🎞", title: "Final Video", desc: "All clips stitched into one edited reel" },
              { icon: "⬇", title: "Downloads", desc: "HD images and MP4 video files" },
              { icon: "📤", title: "Share Ready", desc: "Send directly to clients or post on Instagram" },
            ].map((item, i) => (
              <div
                key={i}
                className="what-card"
                style={{
                  background: CARD,
                  border: `1px solid rgba(212,175,55,0.12)`,
                  borderRadius: "10px",
                  padding: "1.75rem",
                  opacity: 0,
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(212,175,55,0.4)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(212,175,55,0.12)`;
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{item.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: "0.4rem", fontSize: "1rem" }}>{item.title}</div>
                <div style={{ color: MUTED, fontSize: "0.875rem", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "6rem 1.5rem", background: CARD }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 800,
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Simple Credit Pricing
          </h2>
          <p style={{ textAlign: "center", color: MUTED, marginBottom: "3rem", fontSize: "1rem" }}>
            Pay only when you shoot. No subscriptions.
          </p>
          <div
            ref={pricingRef}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2.5rem",
            }}
          >
            {[
              {
                credits: "1 Credit",
                price: "₹1,299",
                sub: "per shoot",
                badge: null,
                cta: "Try it out",
                highlight: false,
                features: ["1 model portrait", "5 angle shots", "5 video clips", "Final edited video"],
              },
              {
                credits: "⭐ 10 Credits",
                price: "₹10,999",
                sub: "₹1,099/shoot • Save ₹1,990",
                badge: "Most Popular",
                cta: "Most Popular",
                highlight: true,
                features: ["10 model portraits", "50 angle shots", "50 video clips", "10 final videos"],
              },
              {
                credits: "25 Credits",
                price: "₹26,999",
                sub: "₹1,079/shoot • Save ₹5,476",
                badge: "Best Value",
                cta: "Best Value",
                highlight: false,
                features: ["25 model portraits", "125 angle shots", "125 video clips", "25 final videos"],
              },
            ].map((plan, i) => (
              <div
                key={i}
                className="pricing-card"
                style={{
                  background: BG,
                  border: plan.highlight ? `2px solid ${GOLD}` : `1px solid rgba(255,255,255,0.1)`,
                  borderRadius: "12px",
                  padding: "2rem",
                  position: "relative",
                  opacity: 0,
                }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-14px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: GOLD,
                      color: "#000",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      padding: "0.25rem 1rem",
                      borderRadius: "20px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Most Popular
                  </div>
                )}
                {plan.badge && !plan.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-14px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(255,255,255,0.1)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      padding: "0.25rem 1rem",
                      borderRadius: "20px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {plan.badge}
                  </div>
                )}
                <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", color: plan.highlight ? GOLD : "#fff" }}>
                  {plan.credits}
                </div>
                <div style={{ fontSize: "clamp(2rem, 5vw, 2.5rem)", fontWeight: 800, lineHeight: 1, marginBottom: "0.4rem" }}>
                  {plan.price}
                </div>
                <div style={{ color: MUTED, fontSize: "0.85rem", marginBottom: "1.5rem" }}>{plan.sub}</div>
                <div style={{ borderTop: `1px solid rgba(255,255,255,0.08)`, paddingTop: "1.25rem", marginBottom: "1.5rem" }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem", fontSize: "0.875rem", color: "#ccc" }}>
                      <span style={{ color: GOLD }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    textAlign: "center",
                    background: plan.highlight ? GOLD : "transparent",
                    border: plan.highlight ? "none" : `1px solid rgba(255,255,255,0.2)`,
                    color: plan.highlight ? "#000" : "#fff",
                    fontWeight: 700,
                    padding: "0.75rem",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.8"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
                >
                  Get Started →
                </a>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: GOLD,
                color: "#000",
                fontWeight: 700,
                padding: "1rem 2.5rem",
                borderRadius: "8px",
                fontSize: "1rem",
                textDecoration: "none",
                display: "inline-block",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
            >
              Start with 1 Credit — No commitment
            </a>
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
              fontWeight: 800,
              marginBottom: "3rem",
              letterSpacing: "-0.02em",
            }}
          >
            Why Ornalens?
          </h2>
          <div
            ref={trustRef}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                icon: "🇮🇳",
                title: "Built for India",
                desc: "Understands Indian skin tones, ethnic attire, and traditional jewellery types",
              },
              {
                icon: "🔒",
                title: "Your Design, Protected",
                desc: "Jewellery design copied with pixel-perfect accuracy. Never altered.",
              },
              {
                icon: "⚡",
                title: "15 Minutes, Not 3 Days",
                desc: "Full photo shoot + video shoot delivered while you wait. No back and forth.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="trust-col"
                style={{
                  textAlign: "center",
                  padding: "2rem 1.5rem",
                  background: CARD,
                  borderRadius: "12px",
                  border: `1px solid rgba(212,175,55,0.1)`,
                  opacity: 0,
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.6rem" }}>{item.title}</div>
                <div style={{ color: MUTED, fontSize: "0.9rem", lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        ref={ctaSectionRef}
        style={{
          padding: "7rem 1.5rem",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* gold glow bg */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center, rgba(212,175,55,0.1) 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />
        <div className="cta-inner" style={{ position: "relative", zIndex: 1, opacity: 0 }}>
          <h2
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "1rem",
              lineHeight: 1.15,
            }}
          >
            Transform Your Jewellery
            <br />
            <span style={{ color: GOLD }}>Business Today</span>
          </h2>
          <p style={{ color: MUTED, fontSize: "1.05rem", marginBottom: "2.5rem", maxWidth: "500px", margin: "0 auto 2.5rem" }}>
            Join thousands of Indian jewellers upgrading their marketing with AI
          </p>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: GOLD,
              color: "#000",
              fontWeight: 700,
              padding: "1rem 2.5rem",
              borderRadius: "8px",
              fontSize: "1.05rem",
              textDecoration: "none",
              display: "inline-block",
              transition: "opacity 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.opacity = "0.85";
              el.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.opacity = "1";
              el.style.transform = "translateY(0)";
            }}
          >
            Get Started — Photos + Video for ₹1,299 →
          </a>
          <div style={{ marginTop: "1.5rem", color: MUTED, fontSize: "0.875rem" }}>ornalens.com</div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        ref={footerRef}
        style={{
          borderTop: `1px solid rgba(212,175,55,0.2)`,
          padding: "2rem 2rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          background: CARD,
        }}
      >
        <span style={{ color: GOLD, fontWeight: 700, fontSize: "1rem" }}>◆ Ornalens</span>
        <span style={{ color: MUTED, fontSize: "0.85rem", textAlign: "center" }}>
          © 2026 Ornalens. All rights reserved.
        </span>
        <span style={{ color: MUTED, fontSize: "0.85rem" }}>ornalens.com</span>
      </footer>
    </div>
  );
}
