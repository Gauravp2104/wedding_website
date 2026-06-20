import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PaisleyDivider } from './Ornaments';
import { events, buildIcs } from '../data/events';
import { listAlbum, indexByNumber } from '../lib/album';

// One tap → downloads an .ics with all six ceremonies (both days), which the
// phone/computer offers to add straight into the calendar.
function addAllToCalendar() {
  const blob = new Blob([buildIcs(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gautam-sandhya-wedding.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Story() {
  // Couple portraits: image4 → Gautam, image2 → Sandhya. Sourced from the same
  // album listing (Vercel Blob in prod, local /images in dev) since the image
  // files are git-ignored and aren't part of the production build.
  const [photos, setPhotos] = useState({});

  useEffect(() => {
    listAlbum()
      .then((all) => {
        const byNum = indexByNumber(all);
        setPhotos({ gautam: byNum.get(4)?.url, sandhya: byNum.get(2)?.url });
      })
      .catch(() => {});
  }, []);

  return (
    <section className="section story" id="story">
      <motion.div
        className="story__inner"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9 }}
      >
        <h2 className="story__title">The Couple</h2>
        <p className="story__text">
          Two families, one celebration. With the blessings of our elders and the warmth of
          tradition, we seek your gracious presence on our special day as Gautam and
          Sandhya begin their journey together.
        </p>
        <PaisleyDivider style={{ color: 'var(--gold-bright)', margin: '0 auto' }} />

        <div className="story__couple">
          <div className="story__person">
            <div className="story__avatar">
              {photos.gautam ? <img src={photos.gautam} alt="Gautam" /> : '🤵🏽'}
            </div>
            <h3>Gautam</h3>
            <p>s/o Mr. Prakash Raman<br />&amp; Mrs. Uma Prakash</p>
          </div>
          <div className="story__knot">🪷</div>
          <div className="story__person">
            <div className="story__avatar">
              {photos.sandhya ? <img src={photos.sandhya} alt="Sandhya" /> : '👰🏽'}
            </div>
            <h3>Sandhya</h3>
            <p>d/o Mr. L. Srinivasan<br />&amp; Mrs. Priya Srinivasan</p>
          </div>
        </div>

        <button type="button" className="story__cal" onClick={addAllToCalendar}>
          📅 Add all events to your calendar
        </button>
      </motion.div>
    </section>
  );
}
