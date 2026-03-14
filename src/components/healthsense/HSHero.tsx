import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// ── Cycling Words ─────────────────────────────────────────────
const cycleWords = ['Unserved.', 'Forgotten.', 'Rural.', 'Vulnerable.'];

// ── Terminal Lines ────────────────────────────────────────────
const terminalLines = [
  { text: '> Patient: 67F, chest pain, BP 195/110, sweating', delay: 600 },
  { text: '> Analyzing symptoms...', delay: 1200 },
  { text: '> ⚠ TRIAGE: EMERGENCY', delay: 800, color: 'text-hsDanger' },
  { text: '> Diagnosis: Hypertensive Crisis (87% confidence)', delay: 700, color: 'text-hsWarning' },
  { text: '> Action: CALL AMBULANCE IMMEDIATELY', delay: 600, color: 'text-hsDanger font-bold' },
  { text: '> Risk Score: 94/100 🔴', delay: 500, color: 'text-hsDanger' },
];

// ── Animated Counter ──────────────────────────────────────────
function Counter({ target, suffix, prefix }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    let cur = 0;
    const step = target / 50;
    const id = setInterval(() => {
      cur += step;
      if (cur >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.floor(cur));
    }, 30);
    return () => clearInterval(id);
  }, [started, target]);
  return <div ref={ref}>{prefix}{count.toLocaleString()}{suffix}</div>;
}

const HSHero = () => {
  const [wordIdx, setWordIdx] = useState(0);
  const [termIdx, setTermIdx] = useState(0);
  const [termLines, setTermLines] = useState<{ text: string; color?: string }[]>([]);

  // Cycle headline words
  useEffect(() => {
    const id = setInterval(() => setWordIdx(i => (i + 1) % cycleWords.length), 2500);
    return () => clearInterval(id);
  }, []);

  // Terminal animation
  useEffect(() => {
    if (termIdx >= terminalLines.length) {
      const id = setTimeout(() => { setTermLines([]); setTermIdx(0); }, 3000);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setTermLines(prev => [...prev, terminalLines[termIdx]]);
      setTermIdx(i => i + 1);
    }, terminalLines[termIdx].delay);
    return () => clearTimeout(id);
  }, [termIdx]);

  return (
    <div className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-hsTeal/5 rounded-full blur-[160px]" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-hsDanger/5 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* LEFT — Copy */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-hsDanger/10 border border-hsDanger/20 text-hsDanger text-xs font-bold mb-6">
              🚨 3.5 Billion people lack healthcare access
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] mb-6">
              AI Diagnosis<br />for the{' '}
              <span className="relative inline-block">
                <motion.span
                  key={wordIdx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-hsTeal to-hsSky"
                >
                  {cycleWords[wordIdx]}
                </motion.span>
              </span>
            </h1>

            <p className="text-base md:text-lg text-hsTextSecondary leading-relaxed max-w-xl mb-8">
              A health worker in a remote village types symptoms into HealthSense. In <span className="text-hsTeal font-bold">8 seconds</span>, 
              AI tells them if it's an Emergency, what the diagnosis likely is, and what to do next. <span className="text-white font-semibold">No doctor required.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#how-it-works" className="px-7 py-3.5 bg-hsTeal hover:bg-hsTealHover text-hsBg rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,201,167,0.3)] hover:shadow-[0_0_40px_rgba(0,201,167,0.5)]">
                See It In Action →
              </a>
              <Link to="/platform" className="px-7 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold text-sm transition-all flex items-center justify-center backdrop-blur-sm">
                Upload Patient Data
              </Link>
            </div>
          </motion.div>

          {/* RIGHT — Animated Terminal */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="bg-[#0a1020] border border-hsTeal/20 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,201,167,0.08)]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#060d1a]">
                <div className="w-3 h-3 rounded-full bg-hsDanger/80" />
                <div className="w-3 h-3 rounded-full bg-hsWarning/80" />
                <div className="w-3 h-3 rounded-full bg-hsSafe/80" />
                <span className="text-xs text-hsTextSecondary ml-2 font-mono">healthsense-ai — live diagnosis</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-hsSafe opacity-75" /><span className="relative rounded-full h-2 w-2 bg-hsSafe" /></span>
                  <span className="text-xs text-hsSafe font-mono">LIVE</span>
                </div>
              </div>
              <div className="p-5 font-mono text-sm min-h-[220px] space-y-1.5">
                {termLines.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={line.color || 'text-hsTeal/80'}
                  >
                    {line.text}
                  </motion.div>
                ))}
                {termIdx < terminalLines.length && (
                  <span className="inline-block w-2 h-4 bg-hsTeal animate-pulse" />
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* IMPACT NUMBERS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { value: 8, suffix: ' sec', label: 'Average diagnosis time', icon: '⚡' },
            { value: 94, suffix: '%', label: 'Diagnostic accuracy', icon: '🎯' },
            { value: 3, suffix: ' Levels', label: 'Emergency / Urgent / Routine', icon: '🚑' },
            { value: 100, suffix: '%', label: 'Works with any health data', icon: '📁', prefix: '' },
          ].map((s, i) => (
            <div key={i} className="bg-hsCard/30 border border-white/5 rounded-xl p-5 text-center hover:border-hsTeal/20 transition-all">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-3xl font-black text-hsTeal">
                <Counter target={s.value} suffix={s.suffix} prefix={s.prefix} />
              </div>
              <div className="text-xs text-hsTextSecondary mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default HSHero;
