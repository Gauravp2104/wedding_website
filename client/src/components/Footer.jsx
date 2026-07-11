// Family contacts (full international form, with country code).
const CONTACTS = [
  { name: 'Uma', tel: '+919606647106' },
  { name: 'Prakash', tel: '+919900824684' },
  { name: 'Priya', tel: '+919619304464' },
  { name: 'Srinivasan', tel: '+919820964810' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__lamp">🪔</div>
      <div className="footer__names">Gautam &amp; Sandhya</div>
      <p>10 &amp; 11 February 2027 · With love and blessings</p>

      <p className="footer__contact-intro">Questions about the wedding?</p>
      <div className="footer__contacts">
        {CONTACTS.map((c) => (
          <span className="footer__person" key={c.name}>
            <span className="footer__person-name">{c.name}:</span>
            <a href={`tel:${c.tel}`}>📞 Call</a>
            <span className="footer__dot" aria-hidden="true">·</span>
            <a
              href={`https://wa.me/${c.tel.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 WhatsApp
            </a>
          </span>
        ))}
      </div>

      <p className="footer__small">
        சுபமங்களம் · Made with love for our families and friends
      </p>
    </footer>
  );
}
