import Nav from './components/Nav';
import Hero from './components/Hero';
import Story from './components/Story';
import Events from './components/Events';
import RSVP from './components/RSVP';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="site">
      <Nav />
      <Hero />
      <Story />
      <Events />
      <RSVP />
      <Footer />
    </div>
  );
}
