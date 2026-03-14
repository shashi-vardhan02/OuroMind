import HSNavbar from '../components/healthsense/HSNavbar';
import HSHero from '../components/healthsense/HSHero';
import HSHowItWorks from '../components/healthsense/HSHowItWorks';
import HSModules from '../components/healthsense/HSModules';
import HSFooter from '../components/healthsense/HSFooter';

const HSLandingPage = () => {
  return (
    <div className="min-h-screen bg-hsBg text-white relative">
      <div className="bg-hs-grid absolute inset-0 z-0 opacity-40 pointer-events-none" />
      <div className="relative z-10">
        <HSNavbar />
        <HSHero />
        <HSHowItWorks />
        <HSModules />
        <HSFooter />
      </div>
    </div>
  );
};

export default HSLandingPage;
