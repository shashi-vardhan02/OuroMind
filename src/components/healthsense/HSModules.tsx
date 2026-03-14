import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const modules = [
  {
    icon: '🔬',
    title: 'AI Diagnostic Module',
    desc: 'Upload symptoms & vitals for instant AI-powered diagnosis with explainable reasoning',
    accent: 'hsTeal',
  },
  {
    icon: '📊',
    title: 'Predictive Analytics',
    desc: 'Risk scoring and health trend prediction for early intervention',
    accent: 'hsSky',
  },
  {
    icon: '🏥',
    title: 'Remote Care Module',
    desc: 'Telehealth triage: Emergency / Urgent / Routine classification for rural patients',
    accent: 'hsTeal',
  },
  {
    icon: '🔒',
    title: 'Privacy & Security',
    desc: 'End-to-end encryption and decentralized patient data architecture',
    accent: 'hsSky',
  },
  {
    icon: '⚙️',
    title: 'Workflow Automation',
    desc: 'Smart hospital resource allocation: appointments, beds, doctor load balancing',
    accent: 'hsTeal',
  },
];

const HSModules = () => {
  return (
    <section id="modules" className="py-24 relative">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Platform <span className="text-hsTeal">Modules</span>
          </h2>
          <p className="text-hsTextSecondary text-lg max-w-xl mx-auto">
            A comprehensive suite of AI-powered healthcare tools
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-hsCard/50 backdrop-blur-sm border border-white/5 rounded-2xl p-7 hover:border-hsTeal/30 transition-all duration-300 group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{mod.icon}</div>
              <h3 className="text-lg font-bold mb-2">{mod.title}</h3>
              <p className="text-hsTextSecondary text-sm leading-relaxed">{mod.desc}</p>
            </motion.div>
          ))}

          {/* OuroMind Extension — highlighted orange */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Link
              to="/app"
              className="block bg-gradient-to-br from-[#ff5500]/10 to-[#ff8800]/5 border border-[#ff5500]/30 rounded-2xl p-7 hover:border-[#ff5500]/60 transition-all duration-300 group h-full"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🧠</div>
              <h3 className="text-lg font-bold mb-2 text-[#ff5500]">OuroMind Extension</h3>
              <p className="text-hsTextSecondary text-sm leading-relaxed">
                AI psychiatric patient simulator for doctor training — practice before the real session
              </p>
              <div className="mt-3 text-xs text-[#ff5500]/70 font-medium uppercase tracking-wider">Launch Simulator →</div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HSModules;
