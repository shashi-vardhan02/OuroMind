import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import Features from '../components/landing/Features';
import DemoSection from '../components/landing/DemoSection';
import FAQ from '../components/landing/FAQ';
import Footer from '../components/landing/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-darkBg text-white relative">
      <div className="bg-grid-pattern absolute inset-0 z-0 opacity-50 pointer-events-none"></div>
      
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <HowItWorks />
        <Features />
        <DemoSection />
        <FAQ />
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
