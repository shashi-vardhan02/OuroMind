import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    icon: '📤',
    title: 'Upload Dataset',
    desc: 'Upload patient health data (CSV/JSON) — any format, any columns. Our AI auto-maps fields.',
  },
  {
    num: '02',
    icon: '🧠',
    title: 'AI Analysis',
    desc: 'Platform runs diagnostics, risk prediction, and triage classification on every record.',
  },
  {
    num: '03',
    icon: '⚡',
    title: 'Take Action',
    desc: 'Get triage classifications, workflow recommendations, and export reports instantly.',
  },
];

const HSHowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-0 bg-hs-grid opacity-30 pointer-events-none" />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            How It <span className="text-hsTeal">Works</span>
          </h2>
          <p className="text-hsTextSecondary text-lg max-w-xl mx-auto">
            Three simple steps to AI-powered healthcare intelligence
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative group"
            >
              <div className="bg-hsCard/60 backdrop-blur-sm border border-white/5 rounded-2xl p-8 h-full hover:border-hsTeal/30 transition-all duration-300">
                <div className="text-5xl mb-4">{step.icon}</div>
                <div className="text-hsTeal text-xs font-bold uppercase tracking-widest mb-2">Step {step.num}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-hsTextSecondary text-sm leading-relaxed">{step.desc}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-hsTeal/30 text-2xl">→</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HSHowItWorks;
