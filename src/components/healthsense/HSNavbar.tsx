import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HSNavbar = () => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-hsBg/80 backdrop-blur-xl border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-hsTeal/20 rounded-lg animate-ping" style={{ animationDuration: '2s' }} />
            <svg className="w-5 h-5 text-hsTeal relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">Health<span className="text-hsTeal">Sense</span> AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-hsTeal/10 border border-hsTeal/20 text-hsTeal text-xs font-semibold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute h-full w-full rounded-full bg-hsTeal opacity-75" />
              <span className="relative rounded-full h-1.5 w-1.5 bg-hsTeal" />
            </span>
            For Rural Healthcare
          </div>
          <Link
            to="/platform"
            className="bg-hsTeal hover:bg-hsTealHover text-hsBg text-sm font-bold px-5 py-2 rounded-full transition-all shadow-[0_0_20px_rgba(0,201,167,0.25)] hover:shadow-[0_0_30px_rgba(0,201,167,0.45)]"
          >
            Open Platform →
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default HSNavbar;
