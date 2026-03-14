import { motion } from 'framer-motion';
import { Users, Brain, Activity, ShieldAlert, History, Tags } from 'lucide-react';
import clsx from 'clsx';

const features = [
  {
    icon: <Users size={24} />,
    title: "Patient Profiling",
    description: "Create detailed, multifaceted patient personas with complex histories.",
    highlight: true
  },
  {
    icon: <Brain size={24} />,
    title: "AI Simulation",
    description: "Engage with an LLM trained on real clinical interaction patterns.",
    highlight: false
  },
  {
    icon: <Activity size={24} />,
    title: "What Worked Report",
    description: "Receive objective feedback on therapeutic interventions applied.",
    highlight: false
  },
  {
    icon: <ShieldAlert size={24} />,
    title: "Resistance Control",
    description: "Dial up or down patient resistance to test different modalities.",
    highlight: true
  },
  {
    icon: <History size={24} />,
    title: "Session History",
    description: "Revisit and branch from crucial moments in past simulations.",
    highlight: true
  },
  {
    icon: <Tags size={24} />,
    title: "Approach Tagging",
    description: "Auto-categorize your responses by modality (CBT, DBT, dynamic).",
    highlight: false
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Powerful Features for <br/> <span className="text-orangePrimary">Clinical Excellence</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.02,
                rotateX: 2,
                rotateY: 2,
                z: 10
              }}
              style={{ perspective: 1000 }}
              className={clsx(
                "p-8 rounded-2xl border transition-all duration-300 transform-gpu flex flex-col h-full",
                feature.highlight 
                  ? "bg-gradient-to-br from-[#1a0f05] to-[#2a1300] border-orangePrimary/30 shadow-[0_0_20px_rgba(255,85,0,0.1)] hover:shadow-[0_0_30px_rgba(255,85,0,0.2)]" 
                  : "bg-cardDark border-white/5 hover:border-white/20"
              )}
            >
              <div className={clsx(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-6",
                feature.highlight ? "bg-orangePrimary text-white shadow-lg" : "bg-white/5 text-gray-300"
              )}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className={feature.highlight ? "text-orangePrimary/70" : "text-gray-400"}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
