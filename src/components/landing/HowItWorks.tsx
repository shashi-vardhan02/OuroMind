import { motion } from 'framer-motion';
import { FileText, Play, FileCheck } from 'lucide-react';

const steps = [
  {
    icon: <FileText size={32} className="text-orangePrimary" />,
    title: "Describe Patient",
    description: "Input patient demographics, presenting problems, and personality traits."
  },
  {
    icon: <Play size={32} className="text-orangePrimary" />,
    title: "Simulate Session",
    description: "Conduct a realistic text-based therapy session with the AI patient."
  },
  {
    icon: <FileCheck size={32} className="text-orangePrimary" />,
    title: "Get Report",
    description: "Review a detailed 'What Worked' summary analyzing your techniques."
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 relative bg-darkAccent/50">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Three simple steps to elevate your counselling skills.
          </motion.p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Dotted Line */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-white/20 -translate-y-1/2 z-0">
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute top-[-2px] left-0 right-0 h-[2px] border-t-2 border-dashed border-orangePrimary origin-left"
            ></motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-cardDark p-8 rounded-2xl border border-white/5 flex flex-col items-center text-center shadow-xl hover:border-orangePrimary/30 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-orangePrimary/10 flex items-center justify-center mb-6 border border-orangePrimary/20">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
