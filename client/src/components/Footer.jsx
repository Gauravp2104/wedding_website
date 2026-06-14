// ✏️ EDIT THIS: family contact number in full international form (with country
// code, no spaces) — used for the tap-to-call and WhatsApp links below.
const CONTACT_TEL = '+910000000000';

export default function Footer() {
  const waNumber = CONTACT_TEL.replace(/\D/g, '');
  return (
    <footer className="footer">
      <div className="footer__lamp">🪔</div>
      <div className="footer__names">Gautam &amp; Sandhya</div>
      <p>10 &amp; 11 February 2027 · With love and blessings</p>

      <p className="footer__contact">
        Questions about the wedding?{' '}
        <a href={`tel:${CONTACT_TEL}`}>📞 Call us</a>
        <span aria-hidden="true"> · </span>
        <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
          💬 WhatsApp
        </a>
      </p>

      <p className="footer__small">
        சுபமங்களம் · Made with love for our families and friends
      </p>
    </footer>
  );
}
