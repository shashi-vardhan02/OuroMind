import { motion } from 'framer-motion';

const story = [
  { step: '01', icon: '📝', title: 'Health worker describes symptoms', desc: '"Ravi, 67, has sudden chest pain. BP is 195/110. He\'s sweating and dizzy."', bg: 'bg-hsSky/10 border-hsSky/20' },
  { step: '02', icon: '🧠', title: 'HealthSense AI analyzes in seconds', desc: 'Pattern matching across 10,000+ medical conditions. Cross-referencing vitals, age, symptoms.', bg: 'bg-hsTeal/10 border-hsTeal/20' },
  { step: '03', icon: '🚨', title: 'EMERGENCY — Hypertensive Crisis', desc: '"Call ambulance now. Risk score: 94/100. Do NOT give food. Monitor BP every 5 min."', bg: 'bg-hsDanger/10 border-hsDanger/20' },
  { step: '04', icon: '🏥', title: 'Ravi gets to hospital in time', desc: 'The ambulance arrives in 22 minutes. Ravi survives. The AI caught what a guess would have missed.', bg: 'bg-hsSafe/10 border-hsSafe/20' },
];

const comparison = [
  { without: 'Nearest doctor 50km away', with: 'AI diagnosis in 8 seconds' },
  { without: 'Health worker guesses triage', with: 'Color-coded Emergency / Urgent / Routine' },
  { without: 'Patient data on paper', with: 'Secure digital records' },
  { without: 'No follow-up system', with: 'Automated workflow alerts' },
];

const HSHowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Story Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-4">
          <div className="text-xs uppercase tracking-[0.2em] text-hsTeal font-bold mb-3">Real-World Impact</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            How HealthSense <span className="text-hsTeal">Saves Lives</span>
          </h2>
          <p className="text-hsTextSecondary max-w-lg mx-auto text-sm">The story of Ravi, 67, a farmer in rural Telangana</p>
        </motion.div>

        {/* Story Steps */}
        <div className="relative mt-12 space-y-4 max-w-3xl mx-auto">
          <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-hsSky via-hsTeal to-hsSafe hidden md:block" />
          {story.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative flex items-start gap-5 p-5 rounded-xl border ${s.bg} backdrop-blur-sm`}
            >
              <div className="w-16 h-16 rounded-xl bg-hsBg flex items-center justify-center text-3xl shrink-0 border border-white/5">{s.icon}</div>
              <div>
                <div className="text-hsTeal text-[10px] font-bold uppercase tracking-[0.15em] mb-1">Step {s.step}</div>
                <h3 className="text-white font-bold text-lg mb-1">{s.title}</h3>
                <p className="text-hsTextSecondary text-sm leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20">
          <h3 className="text-center text-2xl font-bold mb-8">
            <span className="text-hsDanger">Without</span> vs <span className="text-hsTeal">With</span> HealthSense
          </h3>
          <div className="max-w-3xl mx-auto bg-hsCard/40 border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-2 text-xs uppercase tracking-widest font-bold border-b border-white/5">
              <div className="px-6 py-3 text-hsDanger/70">❌ Without HealthSense</div>
              <div className="px-6 py-3 text-hsTeal/70">✅ With HealthSense</div>
            </div>
            {comparison.map((c, i) => (
              <div key={i} className="grid grid-cols-2 border-b border-white/5 last:border-0">
                <div className="px-6 py-4 text-sm text-hsTextSecondary/70">{c.without}</div>
                <div className="px-6 py-4 text-sm text-white font-medium bg-hsTeal/5">{c.with}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HSHowItWorks;
