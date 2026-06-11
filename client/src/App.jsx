import Nav from './components/Nav';
import Hero from './components/Hero';
import Story from './components/Story';
import Events from './components/Events';
import Album from './components/Album';
import RSVP from './components/RSVP';
import Footer from './components/Footer';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <div className="site">
      <Nav />
      <Hero />
      <Story />
      <Events />
      <Album />
      <RSVP />
      <Footer />
      <Analytics />
    </div>
  );
}
