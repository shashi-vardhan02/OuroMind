import { motion } from 'framer-motion';

const steps = [
  { step: '01', icon: '📝', title: 'Patient Registers', desc: 'Hospital staff enters the patient\'s symptoms, vitals, and condition into the system.', bg: 'bg-hsSky/10 border-hsSky/20' },
  { step: '02', icon: '🔬', title: 'AI Analyzes', desc: 'HealthSense determines which specialist doctors, medications, and equipment are needed.', bg: 'bg-hsTeal/10 border-hsTeal/20' },
  { step: '03', icon: '🏥', title: 'System Checks Inventory', desc: 'Real-time scan of the hospital\'s doctors, pharmacy stock, and equipment availability.', bg: 'bg-hsWarning/10 border-hsWarning/20' },
  { step: '04', icon: '✅', title: 'Smart Routing', desc: 'All available? Treat here. Something missing? Instantly find the nearest branch that has it.', bg: 'bg-hsSafe/10 border-hsSafe/20' },
];

const HSHowItWorks = () => (
  <section id="how-it-works" className="py-20 relative">
    <div className="max-w-6xl mx-auto px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
        <div className="text-xs uppercase tracking-[0.2em] text-hsTeal font-bold mb-3">How It Works</div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">From Symptoms to <span className="text-hsTeal">Treatment Plan</span></h2>
        <p className="text-hsTextSecondary text-sm max-w-md mx-auto">Every patient gets the right care at the right place — in seconds, not hours.</p>
      </motion.div>

      <div className="relative space-y-4 max-w-3xl mx-auto">
        <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-hsSky via-hsTeal to-hsSafe hidden md:block" />
        {steps.map((s, i) => (
          <motion.div key={s.step} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className={`relative flex items-start gap-5 p-5 rounded-xl border ${s.bg} backdrop-blur-sm`}>
            <div className="w-16 h-16 rounded-xl bg-hsBg flex items-center justify-center text-3xl shrink-0 border border-white/5">{s.icon}</div>
            <div>
              <div className="text-hsTeal text-[10px] font-bold uppercase tracking-[0.15em] mb-1">Step {s.step}</div>
              <h3 className="text-white font-bold text-lg mb-1">{s.title}</h3>
              <p className="text-hsTextSecondary text-sm leading-relaxed">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Three Outcomes */}
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16">
        <h3 className="text-center text-2xl font-bold mb-6">Three Possible <span className="text-hsTeal">Outcomes</span></h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { icon: '✅', title: 'All Available', desc: 'Assign resources, generate treatment plan, admit patient.', color: 'hsSafe', border: 'border-hsSafe/20 bg-hsSafe/5' },
            { icon: '⚠️', title: 'Partially Available', desc: 'Show what\'s available and what\'s missing. Option to proceed or transfer.', color: 'hsWarning', border: 'border-hsWarning/20 bg-hsWarning/5' },
            { icon: '❌', title: 'Not Available', desc: 'Find the nearest branch with all resources. Generate referral letter.', color: 'hsDanger', border: 'border-hsDanger/20 bg-hsDanger/5' },
          ].map(o => (
            <div key={o.title} className={`p-5 rounded-xl border ${o.border}`}>
              <div className="text-3xl mb-2">{o.icon}</div>
              <h4 className={`font-bold text-${o.color} mb-1`}>{o.title}</h4>
              <p className="text-xs text-hsTextSecondary leading-relaxed">{o.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default HSHowItWorks;
