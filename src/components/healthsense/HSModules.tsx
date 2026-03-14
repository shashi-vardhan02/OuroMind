import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const modules = [
  { icon: '🔬', title: 'AI Diagnostics', desc: 'Describe symptoms → get diagnosis with explainable reasoning', demo: true },
  { icon: '📊', title: 'Predictive Risk Engine', desc: 'Catch high-risk patients before crisis — not after', demo: true },
  { icon: '🚑', title: 'Smart Triage', desc: 'Emergency. Urgent. Routine. Color-coded. Instant.', demo: true },
  { icon: '🔒', title: 'Zero-Trust Security', desc: 'Patient data encrypted end-to-end. HIPAA-ready architecture.', demo: false },
  { icon: '⚙️', title: 'Hospital Autopilot', desc: 'AI allocates beds, balances doctor load, schedules appointments', demo: true },
];

const HSModules = () => {
  return (
    <section id="modules" className="py-20 relative">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-hsTeal font-bold mb-3">Platform Capabilities</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            6 Modules. <span className="text-hsTeal">One Platform.</span>
          </h2>
          <p className="text-hsTextSecondary text-sm max-w-lg mx-auto">Every tool a rural health worker needs, powered by NVIDIA NIM</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group bg-hsCard/30 border border-white/5 rounded-2xl p-6 hover:border-hsTeal/30 hover:shadow-[0_0_30px_rgba(0,201,167,0.06)] transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl group-hover:scale-110 transition-transform">{m.icon}</span>
                {m.demo && (
                  <span className="flex items-center gap-1 text-[10px] text-hsTeal font-bold uppercase tracking-wider bg-hsTeal/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-hsTeal" /> Live
                  </span>
                )}
              </div>
              <h3 className="text-white font-bold text-lg mb-1.5">{m.title}</h3>
              <p className="text-hsTextSecondary text-sm leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}

          {/* OuroMind — orange highlight */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
            <Link to="/app" className="block h-full group bg-gradient-to-br from-[#ff5500]/8 to-[#ff8800]/4 border border-[#ff5500]/20 rounded-2xl p-6 hover:border-[#ff5500]/50 hover:shadow-[0_0_30px_rgba(255,85,0,0.08)] transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl group-hover:scale-110 transition-transform">🧠</span>
                <span className="flex items-center gap-1 text-[10px] text-[#ff5500] font-bold uppercase tracking-wider bg-[#ff5500]/10 px-2 py-0.5 rounded-full">
                  Extension
                </span>
              </div>
              <h3 className="text-[#ff5500] font-bold text-lg mb-1.5">OuroMind Extension</h3>
              <p className="text-hsTextSecondary text-sm leading-relaxed">Train doctors on AI patient simulations before real sessions</p>
              <div className="mt-3 text-xs text-[#ff5500]/60 font-semibold">Launch Simulator →</div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HSModules;
