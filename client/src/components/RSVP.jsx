import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { orderedCountries } from '../data/countries';

const { top: topCountries, rest: restCountries } = orderedCountries();

// We remember a guest's full response (with a stable id) so it survives a
// refresh and a re-submit edits the same entry instead of adding a new one.
const RSVP_KEY = 'gs_rsvp';

function genId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `r-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

// Keep digits only (max 15 per E.164) and group them for easy reading.
function formatPhone(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 15);
  if (d.length <= 5) return d;
  if (d.length <= 10) return `${d.slice(0, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 5)} ${d.slice(5, 10)} ${d.slice(10)}`;
}

// Which ceremonies a guest can RSVP to.
const CEREMONY_CHOICES = [
  { id: 'reception', label: '🌅 Reception', meta: 'Day 1 · 10 Feb 2027', events: ['Reception (Day 1, 10 Feb 2027)'] },
  { id: 'muhurtham', label: '🔥 Muhurtham', meta: 'Day 2 · 11 Feb 2027', events: ['Muhurtham (Day 2, 11 Feb 2027)'] },
  {
    id: 'both',
    label: '🪔 Both days',
    meta: '10 & 11 Feb 2027',
    events: ['Reception (Day 1, 10 Feb 2027)', 'Muhurtham (Day 2, 11 Feb 2027)'],
  },
];

const initial = {
  id: '',
  name: '',
  email: '',
  dialCode: '+91',
  phone: '',
  attending: 'yes',
  guests: 1,
  attendChoice: 'both',
  accommodation: 'no',
  message: '',
};

export default function RSVP() {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [errorMsg, setErrorMsg] = useState('');

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Restore a previously submitted response (this device) and show the
  // thank-you. The guest can edit it; the saved form pre-fills the fields.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RSVP_KEY) || 'null');
      if (saved && saved.name) {
        setForm({ ...initial, ...saved });
        setStatus('done');
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg('Please tell us your name.');
      setStatus('error');
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setErrorMsg('Please leave an email or phone number so we can reach you.');
      setStatus('error');
      return;
    }
    setStatus('sending');
    setErrorMsg('');

    const id = form.id || genId();
    const chosen = CEREMONY_CHOICES.find((c) => c.id === form.attendChoice);
    const payload = {
      id,
      name: form.name,
      email: form.email,
      phone: form.phone ? `${form.dialCode} ${form.phone}`.trim() : '',
      attending: form.attending,
      guests: form.guests,
      events: form.attending === 'yes' ? chosen?.events ?? [] : [],
      accommodation: form.attending === 'yes' ? form.accommodation : 'no',
      message: form.message,
    };

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong.');
      const saved = { ...form, id };
      try {
        localStorage.setItem(RSVP_KEY, JSON.stringify(saved));
      } catch {
        /* ignore */
      }
      setForm(saved);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message || 'Could not submit. Please try again.');
      setStatus('error');
    }
  }

  return (
    <section className="section rsvp" id="rsvp">
      <motion.div
        className="rsvp__card"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
      >
        {status === 'done' ? (
          <div className="rsvp__success">
            <div className="big">🪔🎉</div>
            <h3>Thank you, {form.name.split(' ')[0]}!</h3>
            <p style={{ opacity: 0.85 }}>
              {form.attending === 'yes'
                ? 'Your RSVP is in — we can’t wait to celebrate with you.'
                : 'We’ll miss you, but thank you for letting us know. 💛'}
            </p>
            <button
              type="button"
              className="rsvp__edit-btn"
              onClick={() => {
                setErrorMsg('');
                setStatus('idle');
              }}
            >
              ✎ Edit my response
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <p className="eyebrow" style={{ textAlign: 'center', color: 'var(--gold-bright)' }}>
              Will you join us?
            </p>
            <h2 className="rsvp__title">RSVP</h2>
            <p className="rsvp__sub">Kindly respond so we can plan accordingly.</p>

            {status === 'error' && <div className="toast toast--err">{errorMsg}</div>}

            <div className="field">
              <label htmlFor="name">Full name *</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="phone">Phone</label>
              <div className="phone-row">
                <select
                  className="phone-code"
                  aria-label="Country code"
                  value={form.dialCode}
                  onChange={(e) => set('dialCode', e.target.value)}
                >
                  <optgroup label="Frequently used">
                    {topCountries.map((c) => (
                      <option key={`top-${c.code}`} value={c.dial}>
                        {c.flag} {c.dial} · {c.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All countries">
                    {restCountries.map((c) => (
                      <option key={c.code} value={c.dial}>
                        {c.flag} {c.dial} · {c.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) => set('phone', formatPhone(e.target.value))}
                  placeholder="98765 43210"
                  autoComplete="tel-national"
                />
              </div>
              <p className="field__hint">
                Please give us your email <strong>or</strong> phone so we can reach you.
              </p>
            </div>

            <div className="field">
              <label>Will you attend?</label>
              <div className="attend-toggle">
                <button
                  type="button"
                  className={form.attending === 'yes' ? 'on' : ''}
                  onClick={() => set('attending', 'yes')}
                >
                  Joyfully accept
                </button>
                <button
                  type="button"
                  className={form.attending === 'no' ? 'on' : ''}
                  onClick={() => set('attending', 'no')}
                >
                  Can’t make it
                </button>
              </div>
            </div>

            {form.attending === 'yes' && (
              <>
                <div className="field">
                  <label>Which will you attend?</label>
                  <div className="choice-grid">
                    {CEREMONY_CHOICES.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        className={`choice ${form.attendChoice === c.id ? 'on' : ''}`}
                        onClick={() => set('attendChoice', c.id)}
                      >
                        <span className="choice__label">{c.label}</span>
                        <span className="choice__meta">{c.meta}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="guests">Number of guests (incl. you)</label>
                  <select
                    id="guests"
                    value={form.guests}
                    onChange={(e) => set('guests', Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Do you need accommodation?</label>
                  <div className="attend-toggle">
                    <button
                      type="button"
                      className={form.accommodation === 'yes' ? 'on' : ''}
                      onClick={() => set('accommodation', 'yes')}
                    >
                      Yes, please
                    </button>
                    <button
                      type="button"
                      className={form.accommodation === 'no' ? 'on' : ''}
                      onClick={() => set('accommodation', 'no')}
                    >
                      No, thanks
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="field">
              <label htmlFor="message">A note for the couple (optional)</label>
              <textarea
                id="message"
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                placeholder={
                  form.attending === 'no'
                    ? 'Leave the couple your blessings and kind words of wisdom…'
                    : 'Blessings and kind words of wisdom for the couple…'
                }
              />
            </div>

            <button className="submit-btn" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send RSVP'}
            </button>
            <p className="form-note">
              We’ll only use your details to coordinate the wedding. 💌
            </p>
          </form>
        )}
      </motion.div>
    </section>
  );
}
