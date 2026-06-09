import Logo from './Logo';

export default function Nav() {
  return (
    <nav className="nav">
      <a className="nav__brand" href="#top" aria-label="Home">
        <Logo size={60} />
      </a>
      <div className="nav__links">
        <a href="#story">The Couple</a>
        <a href="#events">Events</a>
        <a href="#album">Album</a>
        <a href="#rsvp">RSVP</a>
      </div>
    </nav>
  );
}
