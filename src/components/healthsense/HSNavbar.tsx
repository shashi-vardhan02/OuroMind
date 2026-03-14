import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HSNavbar = () => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-hsBg/80 backdrop-blur-xl border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <span className="text-hsTeal">HealthSense</span>
          <span className="text-white font-light">AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-hsTextSecondary font-medium">
          <a href="#modules" className="hover:text-hsTeal transition-colors">Platform</a>
          <a href="#how-it-works" className="hover:text-hsTeal transition-colors">How It Works</a>
          <a href="#modules" className="hover:text-hsTeal transition-colors">Modules</a>
          <a href="#footer" className="hover:text-hsTeal transition-colors">About</a>
        </div>

        <Link
          to="/platform"
          className="bg-hsTeal hover:bg-hsTealHover text-hsBg text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-[0_0_20px_rgba(0,201,167,0.3)] hover:shadow-[0_0_30px_rgba(0,201,167,0.5)]"
        >
          Launch Platform →
        </Link>
      </div>
    </motion.nav>
  );
};

export default HSNavbar;
