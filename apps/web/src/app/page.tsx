import { AuthControls } from "@/components/auth-controls";
import Link from "next/link";

const principles = [
  ["01", "Your arrival, in sync", "Matching will prefer passengers on the same flight, with nearby arrivals considered when timing works."],
  ["02", "One small destination cluster", "Thrissur with Thrissur. Guruvayur with Guruvayur. Shared cabs should mean fewer detours."],
  ["03", "Comfort comes with you", "Seat and luggage capacity, waiting limits and women-only preferences will shape each group."],
];

export default function Home() {
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="kootu home">kootu<span className="brand-dot" /></Link>
      <span className="header-note">A little company. A better journey.</span>
      {process.env.NEXT_PUBLIC_AUTH_ENABLED === "true" ? <AuthControls /> : <span className="stage-badge">Hackathon foundation</span>}
    </header>
    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span /> AIRPORT ARRIVALS, BETTER TOGETHER</p>
          <h1 id="hero-title">Land together.<br />Leave <em>together.</em></h1>
          <p className="intro">Same airport. Similar arrival. Somewhere close.<br />A shared cab for the part of the journey that comes next.</p>
          <a className="primary-link" href="#how-it-works">Meet the idea <span aria-hidden="true">↗</span></a>
          <p className="availability">Foundation preview. Ride booking and matching are coming next.</p>
        </div>
        <div className="journey-card" aria-label="Concept: Kochi Airport to a small Thrissur destination cluster">
          <div className="journey-top"><span>THE NEXT LEG</span><span className="concept-tag">CONCEPT</span></div>
          <div className="route-art" aria-hidden="true">
            <svg viewBox="0 0 420 280" fill="none"><path className="map-road" d="M-20 230L440 40M40-20L310 300M-20 80L440 180M140-20L90 300M300-20L390 300" /><path className="route-line" d="M90 210C90 160 180 185 190 125S300 135 325 65" /><circle cx="90" cy="210" r="14" fill="currentColor" /><circle cx="90" cy="210" r="5" fill="#fff" /><circle cx="325" cy="65" r="15" fill="#254b40" /><circle cx="325" cy="65" r="5" fill="#e7eecc" /></svg>
            <span className="map-label airport">COK <span>ARRIVALS</span></span><span className="map-label destination">Thrissur <span>DESTINATION CLUSTER</span></span>
          </div>
          <div className="journey-bottom"><div><span className="label">FROM</span><strong>Kochi Airport</strong></div><span aria-hidden="true">↗</span><div><span className="label">TO</span><strong>Closer destinations</strong></div></div>
          <p className="card-caption">Illustrative route. No live map or ride availability.</p>
        </div>
      </section>
      <section id="how-it-works" className="principles" aria-labelledby="principles-title">
        <div className="section-heading"><p className="eyebrow">THE PRODUCT WE ARE BUILDING</p><h2 id="principles-title">Share the cab.<br />Keep your direction.</h2></div>
        <div className="principle-grid">{principles.map(([number, title, description]) => <article key={number}><span className="number">{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>
    </main>
    <footer><Link href="/" className="footer-brand">kootu</Link><p>Airport → destination cluster → shared cab</p><span>Built in Kochi · 2026</span></footer>
  </>;
}
