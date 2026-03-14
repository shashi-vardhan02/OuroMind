import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  const [typedText, setTypedText] = useState('');
  const fullText = "Counsel Better.";
  
  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <div className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orangePrimary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-orangePrimary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orangePrimary/10 border border-orangePrimary/20 text-orangePrimary text-sm font-medium mb-8"
          >
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orangePrimary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orangePrimary"></span>
            </span>
            ✦ The next-generation simulator
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-center max-w-5xl leading-[1.1] mb-6"
          >
            Train Smarter.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5500] to-[#ff8800]">
              {typedText}<span className="animate-pulse">|</span>
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 text-center max-w-2xl mb-12 font-light"
          >
            AI-powered patient simulator for psychiatrists to practice 
            complex cases risk-free.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
          >
            <button className="px-8 py-4 bg-orangePrimary hover:bg-orangeHover text-white rounded-full font-bold text-lg transition-all flex items-center justify-center group shadow-[0_0_20px_rgba(255,85,0,0.3)] hover:shadow-[0_0_30px_rgba(255,85,0,0.5)]">
              Get Started
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <a 
              href="#demo"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold text-lg transition-all flex items-center justify-center backdrop-blur-sm"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Social Proof / Stats */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-20 flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500"
          >
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-white">3x</span>
              <span className="text-xs uppercase tracking-widest text-gray-500 mt-2">Better session outcomes</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-white">500+</span>
              <span className="text-xs uppercase tracking-widest text-gray-500 mt-2">Professionals trained</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
