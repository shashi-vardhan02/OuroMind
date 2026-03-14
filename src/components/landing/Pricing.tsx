import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import clsx from 'clsx';

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Basic simulation for students and beginners.",
    features: [
      "10 simulated sessions/month",
      "Standard patient profiles",
      "Basic session transcripts",
      "Community support"
    ],
    highlight: false,
    cta: "Start Free"
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    description: "Advanced simulation for practicing professionals.",
    features: [
      "Unlimited sessions",
      "Custom patient profiles",
      "Detailed 'What Worked' reports",
      "Resistance control dialing",
      "Priority email support"
    ],
    highlight: true,
    cta: "Get Pro"
  },
  {
    name: "Clinic",
    price: "$199",
    period: "/mo",
    description: "Team management and organization tools.",
    features: [
      "Everything in Pro",
      "Up to 10 team seats",
      "Centralized analytics",
      "Custom integration API",
      "24/7 dedicated support"
    ],
    highlight: false,
    cta: "Contact Sales"
  }
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Simple, transparent <span className="text-orangePrimary">pricing</span>
          </motion.h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose the plan that fits your practice and scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className={clsx(
                "rounded-3xl p-8 flex flex-col relative",
                tier.highlight 
                  ? "bg-gradient-to-b from-[#1a0f05] to-cardDark border-2 border-orangePrimary shadow-[0_0_40px_rgba(255,85,0,0.15)] md:-translate-y-4" 
                  : "bg-cardDark border border-white/10"
              )}
            >
              {tier.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-orangePrimary text-white text-xs font-bold rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-gray-400 text-sm h-10">{tier.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-black">{tier.price}</span>
                  {tier.period && <span className="text-gray-500 font-medium">{tier.period}</span>}
                </div>
              </div>
              
              <div className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <Check size={20} className={tier.highlight ? "text-orangePrimary" : "text-gray-500"} />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <button className={clsx(
                "w-full py-4 rounded-xl font-bold transition-all",
                tier.highlight
                  ? "bg-orangePrimary hover:bg-orangeHover text-white shadow-lg shadow-orangePrimary/25"
                  : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
              )}>
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
