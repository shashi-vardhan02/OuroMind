import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4"
    >
      <div className="flex items-center justify-between px-6 py-3 rounded-full bg-cardDarker/60 backdrop-blur-md border border-white/5 shadow-xl">
        <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-orangePrimary shrink-0"></div>
          OuroMind
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-300 font-medium">
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>
        <Link 
          to="/app" 
          className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-5 py-2 rounded-full transition-all"
        >
          Login
        </Link>
      </div>
    </motion.nav>
  );
};

export default Navbar;
