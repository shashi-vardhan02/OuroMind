import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const modules = [
  {
    title: 'AI Diagnostic Module',
    desc: 'Instant condition analysis, triage classification, and medical resource determination.',
    icon: '🔬',
    color: 'from-hsTeal to-hsSky',
    badge: 'Core'
  },
  {
    title: 'Predictive Analytics',
    desc: 'Real-time risk monitoring and predictive load balancing across hospital branches.',
    icon: '📈',
    color: 'from-hsSky to-blue-500',
    badge: 'AI Powered'
  },
  {
    title: 'Remote Care Module',
    desc: 'IoT-enabled telehealth ecosystem for remote patient monitoring in rural areas.',
    icon: '📶',
    color: 'from-purple-500 to-pink-500',
    badge: 'v2.0'
  },
  {
    title: 'Privacy & Security Layer',
    desc: 'End-to-end encryption and Zero Trust access control for secure patient data.',
    icon: '🛡️',
    color: 'from-blue-600 to-hsTeal',
    badge: 'Encrypted'
  },
  {
    title: 'Workflow Automation',
    desc: 'Automated hospital resource allocation for beds, doctors, and medications.',
    icon: '⚙️',
    color: 'from-hsTeal to-hsSafe',
    badge: 'Live'
  },
  {
    title: 'OuroMind Extension',
    desc: 'The advanced patient simulation suite for training and stress-testing diagnostics.',
    icon: '🧠',
    color: 'from-orange-500 to-red-500',
    badge: 'Integrated',
    isExtension: true
  }
];

const HSModules = () => {
  return (
    <section className="py-24 px-6 bg-hsBgAlt/30 border-y border-white/5" id="modules">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl lg:text-5xl font-black text-white">Required <span className="text-hsTeal">Modules.</span></h2>
          <p className="text-hsTextSecondary max-w-2xl mx-auto italic font-medium">Aligning with the HealthTech & MedAI Hackathon ecosystem requirements.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`hs-card p-8 rounded-2xl group relative overflow-hidden flex flex-col h-full bg-hsCard/40 border border-white/5 hover:border-hsTeal/20 transition-all duration-300 ${m.isExtension ? 'border-orange-500/20' : ''}`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${m.color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`} />
              
              <div className="flex justify-between items-start mb-6 relative">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                  {m.icon}
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${m.isExtension ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-hsTeal/10 border-hsTeal/20 text-hsTeal'}`}>
                  {m.badge}
                </span>
              </div>

              <h3 className="text-xl font-black text-white mb-3 group-hover:text-hsTeal transition-colors">{m.title}</h3>
              <p className="text-sm text-hsTextSecondary leading-relaxed mb-8 flex-grow">{m.desc}</p>
              
              <div className="pt-6 border-t border-white/5 mt-auto">
                {m.isExtension ? (
                  <Link to="/app" className="inline-flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase tracking-widest hover:translate-x-1 transition-all">
                    Launch Extension suites →
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 text-hsTeal text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-hsTeal animate-pulse" /> Live Module
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HSModules;
