import Link from 'next/link';
import { Asterisk } from './marks';

export function Masthead() {
  return (
    <header className="mast">
      <Link className="brand" href="/" aria-label="CS Family Star, home">
        <Asterisk className="brand__mark" />
        <span className="brand__word cond">
          CS Family <span>Star</span>
        </span>
      </Link>
      <nav className="mast__nav" aria-label="Primary">
        <Link className="only-wide" href="/#rail">
          On the rail
        </Link>
        <Link href="/#menu-lines">The menu</Link>
        <Link className="only-wide" href="/#feed">
          Just printed
        </Link>
        <Link className="only-wide" href="#about">
          About
        </Link>
      </nav>
    </header>
  );
}
