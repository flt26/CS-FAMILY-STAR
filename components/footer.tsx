import Link from 'next/link';
import { Barcode } from './marks';

export function Footer() {
  return (
    <footer className="foot" id="about">
      <div className="stub paper torn-b shadowed">
        <p className="label">Served by</p>
        <p className="stub__names cond">
          Youssef Ahmed
          <br />
          <span>&amp;</span> Ahmed Abdelwahab
        </p>
        <p className="label stub__school">Computer Science · Future University in Egypt</p>
        <div className="rule-dash" />
        <Barcode code="cs-family-star" />
        <small>csfs v2 · opinions are non-refundable</small>
      </div>
      <div>
        <p className="foot__ar dot" lang="ar" dir="rtl">
          بالهنا <em>والشفا</em>
        </p>
        <p className="foot__about">
          A student project by the CS family, for anyone hungry at the end of 90th Street. Scores are plain
          averages of what students post; rankings weigh each score by how many people backed it, so one lucky 5
          can’t beat forty solid 4s. Not an official FUE service. No logins, no student IDs, no sponsored spots.
        </p>
        <nav className="foot__links" aria-label="Footer">
          <a href="/api/restaurants">JSON API</a>
          <Link href="/#menu">The menu</Link>
        </nav>
      </div>
    </footer>
  );
}
