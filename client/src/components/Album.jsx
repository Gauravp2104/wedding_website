import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaisleyDivider } from './Ornaments';
import { listAlbum } from '../lib/album';

export default function Album() {
  const [images, setImages] = useState([]);
  const [lightbox, setLightbox] = useState(null); // index | null

  useEffect(() => {
    listAlbum().then(setImages).catch(() => {});
  }, []);

  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (dir) => setLightbox((i) => (i === null ? i : (i + dir + images.length) % images.length)),
    [images.length]
  );

  // Keyboard controls while the lightbox is open.
  useEffect(() => {
    if (lightbox === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, close, step]);

  return (
    <section className="section album" id="album">
      <motion.div
        className="album__inner"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9 }}
      >
        <p className="eyebrow" style={{ color: 'var(--gold-bright)' }}>
          நினைவுகள்
        </p>
        <h2 className="album__title">Our Album</h2>
        <p className="album__text">
          Moments from our journey together — and from the celebration as it unfolds.
        </p>
        <PaisleyDivider style={{ color: 'var(--gold-bright)', margin: '0 auto 2rem' }} />

        {images.length === 0 ? (
          <p className="album__empty">
            No photos yet — they’ll appear here soon. 🪔
          </p>
        ) : (
          <div className="album__grid">
            {images.map((img, i) => (
              <motion.button
                key={img.url}
                type="button"
                className="album__thumb"
                whileHover={{ scale: 1.03 }}
                onClick={() => setLightbox(i)}
                aria-label={`Open photo ${i + 1}`}
              >
                <img src={img.url} alt="" loading="lazy" />
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {lightbox !== null && images[lightbox] && (
          <motion.div
            className="album__lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <button
              className="album__nav album__nav--prev"
              aria-label="Previous"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
            >
              ‹
            </button>
            <motion.img
              key={images[lightbox].url}
              src={images[lightbox].url}
              alt=""
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="album__nav album__nav--next"
              aria-label="Next"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
            >
              ›
            </button>
            <button
              className="album__close"
              aria-label="Close"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
