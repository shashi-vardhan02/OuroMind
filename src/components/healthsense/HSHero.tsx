import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const cycleWords = ['Right Treatment.', 'Right Hospital.', 'Right Now.'];

const terminalLines = [
  { text: '> Patient: Ravi, 67M, chest pain, BP 195/110', delay: 600 },
  { text: '> Analyzing condition...', delay: 1000 },
  { text: '> Required: Cardiologist + ECG + Amlodipine', delay: 800, color: 'text-hsTeal' },
  { text: '> Checking Central Hospital inventory...', delay: 800 },
  { text: '> ❌ Amlodipine: OUT OF STOCK', delay: 600, color: 'text-hsDanger' },
  { text: '> ❌ ECG: OCCUPIED', delay: 500, color: 'text-hsDanger' },
  { text: '> Searching branches...', delay: 800 },
  { text: '> ✅ North Branch has all required resources', delay: 600, color: 'text-hsSafe font-bold' },
  { text: '> → REFER TO: HealthSense North, Secunderabad', delay: 500, color: 'text-hsTeal font-bold' },
];

const HSHero = () => {
  const [wordIdx, setWordIdx] = useState(0);
  const [termIdx, setTermIdx] = useState(0);
  const [termLines, setTermLines] = useState<{ text: string; color?: string }[]>([]);

  useEffect(() => { const id = setInterval(() => setWordIdx(i => (i + 1) % cycleWords.length), 2500); return () => clearInterval(id); }, []);

  useEffect(() => {
    if (termIdx >= terminalLines.length) { const id = setTimeout(() => { setTermLines([]); setTermIdx(0); }, 3500); return () => clearTimeout(id); }
    const id = setTimeout(() => { setTermLines(prev => [...prev, terminalLines[termIdx]]); setTermIdx(i => i + 1); }, terminalLines[termIdx].delay);
    return () => clearTimeout(id);
  }, [termIdx]);

  return (
    <div className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-hsTeal/5 rounded-full blur-[160px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-hsDanger/5 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-hsTeal/10 border border-hsTeal/20 text-hsTeal text-xs font-bold mb-6">
              🏥 Hospital Resource Intelligence
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-[1.05] mb-6">
              The{' '}
              <span className="relative inline-block">
                <motion.span key={wordIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-transparent bg-clip-text bg-gradient-to-r from-hsTeal to-hsSky">
                  {cycleWords[wordIdx]}
                </motion.span>
              </span>
            </h1>

            <p className="text-base md:text-lg text-hsTextSecondary leading-relaxed max-w-xl mb-8">
              HealthSense AI checks if your hospital has the right <span className="text-hsTeal font-bold">doctors, medicines, and equipment</span> for every patient — and instantly finds the nearest branch that does if it doesn't.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/platform" className="px-7 py-3.5 bg-hsTeal hover:bg-hsTealHover text-hsBg rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,201,167,0.3)]">
                Open Platform →
              </Link>
              <a href="#how-it-works" className="px-7 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold text-sm transition-all flex items-center justify-center backdrop-blur-sm">
                How It Works
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="bg-[#0a1020] border border-hsTeal/20 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,201,167,0.08)]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#060d1a]">
                <div className="w-3 h-3 rounded-full bg-hsDanger/80" /><div className="w-3 h-3 rounded-full bg-hsWarning/80" /><div className="w-3 h-3 rounded-full bg-hsSafe/80" />
                <span className="text-xs text-hsTextSecondary ml-2 font-mono">healthsense — resource check</span>
                <div className="ml-auto flex items-center gap-1.5"><span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-hsSafe opacity-75"/><span className="relative rounded-full h-2 w-2 bg-hsSafe"/></span><span className="text-xs text-hsSafe font-mono">LIVE</span></div>
              </div>
              <div className="p-5 font-mono text-sm min-h-[260px] space-y-1.5">
                {termLines.map((line, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={line.color || 'text-hsTeal/80'}>{line.text}</motion.div>
                ))}
                {termIdx < terminalLines.length && <span className="inline-block w-2 h-4 bg-hsTeal animate-pulse" />}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Impact numbers */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { val: '8 sec', label: 'Resource check time', icon: '⚡' },
            { val: '3', label: 'Hospital branches', icon: '🏥' },
            { val: '100%', label: 'Inventory tracked', icon: '📊' },
            { val: 'AI', label: 'Powered routing', icon: '🧠' },
          ].map((s, i) => (
            <div key={i} className="bg-hsCard/30 border border-white/5 rounded-xl p-5 text-center hover:border-hsTeal/20 transition-all">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-3xl font-black text-hsTeal">{s.val}</div>
              <div className="text-xs text-hsTextSecondary mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default HSHero;
