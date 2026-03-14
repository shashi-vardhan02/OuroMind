import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const stats = [
  { label: 'Diagnostic Accuracy', value: 94, suffix: '%' },
  { label: 'Faster Triage', value: 3, suffix: 'x' },
  { label: 'Patients Served', value: 10000, suffix: '+' },
];

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

const HSHero = () => {
  return (
    <div className="relative pt-28 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-hsTeal/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-[0%] right-[-10%] w-[500px] h-[500px] bg-hsSky/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-hsTeal/10 border border-hsTeal/20 text-hsTeal text-sm font-medium mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hsTeal opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-hsTeal" />
            </span>
            HealthTech & MedAI Solution
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter max-w-5xl leading-[1.05] mb-6"
          >
            AI-Powered Healthcare for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-hsTeal to-hsSky">
              Rural & Underserved
            </span>{' '}
            Communities
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-hsTextSecondary max-w-2xl mb-12 font-light leading-relaxed"
          >
            Early diagnosis. Predictive risk monitoring. Secure patient data.
            Automated workflows. Built for the communities that need it most.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              to="/platform"
              className="px-8 py-4 bg-hsTeal hover:bg-hsTealHover text-hsBg rounded-full font-bold text-lg transition-all flex items-center justify-center group shadow-[0_0_25px_rgba(0,201,167,0.3)] hover:shadow-[0_0_40px_rgba(0,201,167,0.5)]"
            >
              Launch Platform
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold text-lg transition-all flex items-center justify-center backdrop-blur-sm"
            >
              View Demo
            </a>
          </motion.div>

          {/* Animated Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-20 flex flex-wrap justify-center gap-12 md:gap-20"
          >
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <span className="text-4xl md:text-5xl font-black text-hsTeal">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </span>
                <span className="text-xs uppercase tracking-widest text-hsTextSecondary mt-2">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HSHero;
