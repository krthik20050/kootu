import { HomeAccount } from "@/components/home-account";
import { ArrowDown, ArrowUpRight, CarFront, Luggage, PlaneLanding } from "lucide-react";
import Link from "next/link";
import styles from "./home.module.css";

const passengerHref = "/onboarding?role=PASSENGER";
const driverHref = "/onboarding?role=DRIVER";

export default function Home() {
  return <div className={styles.home}>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className={styles.header}>
      <Link href="/" className={styles.logo} aria-label="kootu home">kootu<span /></Link>
      <nav className={styles.nav} aria-label="Main navigation"><Link href="/dashboard">Passenger portal</Link><Link href="/driver">Driver portal</Link><a href="#how-it-works">How it works</a></nav>
      <div className={styles.account}>{process.env.NEXT_PUBLIC_AUTH_ENABLED === "true" ? <HomeAccount /> : <Link href="/onboarding">Get started <ArrowUpRight size={16} aria-hidden="true" /></Link>}</div>
    </header>
    <main id="main">
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span /> A LITTLE COMPANY. A BETTER JOURNEY.</p>
          <h1 id="hero-title">Your flight ends.<br />The company<br /><span>doesn’t have to.</span></h1>
          <p className={styles.intro}>Find people landing around the same time, heading your way. Share the next leg from the airport.</p>
          <Link className={styles.primary} href={passengerHref}>Register as a passenger <ArrowUpRight size={19} aria-hidden="true" /></Link>
          <p className={styles.driverEntry}>Already a passenger? <Link href="/dashboard">Open passenger dashboard <span aria-hidden="true">↗</span></Link></p>
          <p className={styles.driverEntry}>Behind the wheel? <Link href={driverHref}>Register as a driver <span aria-hidden="true">↗</span></Link></p>
        </div>
        <figure className={styles.routeFigure}>
          <div className={styles.routeHeading}><span>ONE AIRPORT. SHARED DIRECTION.</span><PlaneLanding size={24} aria-hidden="true" /></div>
          <div className={styles.routeArt}>
            <svg viewBox="0 0 480 360" role="img" aria-labelledby="route-title route-description">
              <title id="route-title">A shared journey from Kochi airport</title>
              <desc id="route-description">An illustrative route joins passengers at the airport and branches toward nearby destinations. This is not live availability.</desc>
              <g className={styles.roads} fill="none" strokeWidth="16"><path d="M-30 95 510 255M-20 280 510 100M80-20 185 390M320-20 380 390" /><path d="M-10 195 490 350M160-20 480 280" /></g>
              <path className={styles.river} d="M440-20C390 80 460 150 400 205S240 280 280 400" fill="none" strokeWidth="30" />
              <path className={styles.route} d="M110 288C105 221 207 254 228 192S236 106 324 76" fill="none" strokeWidth="5" strokeLinecap="round" />
              <path className={styles.branch} d="M228 192C255 173 290 194 337 167" fill="none" strokeWidth="3" strokeDasharray="5 7" />
              <circle className={styles.originHalo} cx="110" cy="288" r="25" /><circle className={styles.origin} cx="110" cy="288" r="10" />
              <circle className={styles.destination} cx="324" cy="76" r="10" /><circle className={styles.destination} cx="337" cy="167" r="8" />
            </svg>
            <span className={styles.airportLabel}>COK<span>Kochi Airport</span></span>
            <span className={styles.destinationLabel}>A shared direction<span>Nearby destinations</span></span>
            <div className={styles.car}><CarFront size={28} aria-hidden="true" /></div>
          </div>
          <div className={styles.routeBottom}><Luggage size={22} aria-hidden="true" /><p>Different journeys.<br /><strong>A little common ground.</strong></p><span className={styles.routeMark} aria-hidden="true">↗</span></div>
          <figcaption>Illustration only. Matches depend on compatible passengers and approved, available drivers.</figcaption>
        </figure>
      </section>
      <section className={styles.how} id="how-it-works" aria-labelledby="how-title">
        <div className={styles.sectionIntro}><p className={styles.eyebrow}>FROM ARRIVALS TO ON YOUR WAY</p><h2 id="how-title">Less figuring it out.<br />More heading home.</h2><ArrowDown size={30} aria-hidden="true" /></div>
        <ol className={styles.steps}>
          <li><span>01</span><div><h3>Tell us when you land</h3><p>Enter your flight and destination, or upload a ticket to help fill in the details. You review everything before submitting.</p></div></li>
          <li><span>02</span><div><h3>Find your common ground</h3><p>Arrival times, nearby destinations, seats, luggage and travel preferences help shape a compatible group.</p></div></li>
          <li><span>03</span><div><h3>Keep the next step in sight</h3><p>Follow your request and assigned ride in your passenger dashboard. A match is confirmed only when a driver accepts.</p></div></li>
        </ol>
      </section>
      <section className={styles.drive} id="drive" aria-labelledby="drive-title">
        <div><p className={styles.eyebrow}>FOR THE PEOPLE BEHIND THE WHEEL</p><h2 id="drive-title">Your road.<br />Your driver workspace.</h2></div>
        <div className={styles.driveCopy}><p>Register your profile and vehicle. Once approved, manage availability, review ride offers and guide each trip from pickup to completion.</p><Link className={styles.driverButton} href={driverHref}>Register as a driver <ArrowUpRight size={19} aria-hidden="true" /></Link><p className={styles.fineprint}>Driver and vehicle approval is required before receiving offers.</p></div>
      </section>
    </main>
    <footer className={styles.footer}><Link className={styles.logo} href="/" aria-label="kootu home">kootu<span /></Link><p>Land together. Leave together.</p><a href="#main">Back to top ↑</a></footer>
  </div>;
}
