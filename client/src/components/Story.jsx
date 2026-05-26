import { motion } from 'framer-motion';
import { PaisleyDivider } from './Ornaments';

export default function Story() {
  return (
    <section className="section story" id="story">
      <motion.div
        className="story__inner"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9 }}
      >
        <p className="eyebrow" style={{ color: 'var(--gold-bright)' }}>
          வாழ்க வளமுடன்
        </p>
        <h2 className="story__title">The Couple</h2>
        <p className="story__text">
          Two families, one celebration. With the blessings of our elders and the warmth of
          tradition, we invite you to share in two days of music, ritual and joy as Gautam and
          Sandhya begin their journey together.
        </p>
        <PaisleyDivider style={{ color: 'var(--gold-bright)', margin: '0 auto' }} />

        <div className="story__couple">
          <div className="story__person">
            <div className="story__avatar">🤵🏽</div>
            <h3>Gautam</h3>
            <p>s/o Mr. Prakash Raman<br />&amp; Mrs. Uma Prakash</p>
          </div>
          <div className="story__knot">🪷</div>
          <div className="story__person">
            <div className="story__avatar">👰🏽</div>
            <h3>Sandhya</h3>
            <p>d/o Mr. L. Srinivasan<br />&amp; Mrs. Priya Srinivasan</p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
