import { useState } from 'react';
import Logo from './Logo';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className="nav">
      <a className="nav__brand" href="#top" aria-label="Home" onClick={close}>
        <Logo size={60} />
      </a>

      <button
        type="button"
        className={`nav__toggle ${open ? 'is-open' : ''}`}
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`nav__links ${open ? 'nav__links--open' : ''}`}>
        <a href="#story" onClick={close}>The Couple</a>
        <a href="#events" onClick={close}>Events</a>
        <a href="#album" onClick={close}>Album</a>
        <a href="#rsvp" onClick={close}>RSVP</a>
      </div>
    </nav>
  );
}
