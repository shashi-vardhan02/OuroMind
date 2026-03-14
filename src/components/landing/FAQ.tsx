import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import clsx from 'clsx';

const faqs = [
  {
    question: "How accurate is the patient simulation?",
    answer: "Our models are trained on thousands of anonymized clinical encounters, making their resistance patterns, deflection techniques, and emotional responses highly realistic."
  },
  {
    question: "Can I use OuroMind for continuing education credits (CEUs)?",
    answer: "Yes, our Pro and Clinic tiers include certified modules that are approved for CEUs by major psychological associations."
  },
  {
    question: "What modalities does the 'What Worked' report cover?",
    answer: "Currently, our reports analyze your interventions through the lenses of CBT, DBT, ACT, and Psychodynamic therapy, tagging your approaches automatically."
  },
  {
    question: "Is my session data kept private?",
    answer: "Absolutely. All sessions are encrypted end-to-end and are never used to train our base AI models without explicit institutional consent."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 relative bg-darkBg">
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-4"
          >
            Frequently Asked Questions
          </motion.h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={clsx(
                  "border rounded-2xl overflow-hidden transition-colors duration-300",
                  isOpen ? "bg-cardDark border-orangePrimary/30" : "bg-cardDarker border-white/5 hover:border-white/20"
                )}
              >
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 shrink-0",
                    isOpen ? "bg-orangePrimary text-white" : "bg-white/5 text-gray-400"
                  )}>
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-gray-400">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
