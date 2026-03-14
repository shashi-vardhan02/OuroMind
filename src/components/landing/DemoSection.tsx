import { motion } from 'framer-motion';

const DemoSection = () => {
  return (
    <section id="demo" className="py-24 relative bg-darkAccent border-y border-white/5 overflow-hidden">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Experience the <span className="text-orangePrimary">Simulation</span>
          </motion.h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Design your patient scenario and start the dialog immediately.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col lg:flex-row gap-8 items-stretch"
        >
          {/* Left Form Mockup */}
          <div className="w-full lg:w-1/3 bg-cardDark/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orangePrimary"></div>
              Patient Profile
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Patient Name/Alias</label>
                <div className="h-10 w-full bg-black/40 border border-white/5 rounded-lg px-3 flex items-center text-sm text-gray-300">
                  Alex Thorne
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Presenting Problem</label>
                <div className="h-24 w-full bg-black/40 border border-white/5 rounded-lg p-3 text-sm text-gray-300 leading-relaxed">
                  Severe social anxiety limiting occupational function. High resistance to exposure therapy interventions.
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Age</label>
                  <div className="h-10 w-full bg-black/40 border border-white/5 rounded-lg px-3 flex items-center text-sm text-gray-300">28</div>
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Resistance</label>
                  <div className="h-10 w-full bg-black/40 border border-orangePrimary/20 rounded-lg px-3 flex items-center text-sm text-orangePrimary font-medium">High</div>
                </div>
              </div>
              
              <button className="w-full h-10 mt-4 rounded-lg bg-orangePrimary/10 text-orangePrimary border border-orangePrimary/20 hover:bg-orangePrimary hover:text-white transition-colors font-medium text-sm">
                Begin Session
              </button>
            </div>
          </div>

          {/* Right Chat Mockup */}
          <div className="w-full lg:w-2/3 bg-cardDarker rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden relative">
            <div className="h-14 border-b border-white/5 bg-cardDark flex items-center px-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-bold text-xs border border-white/10">AT</div>
                <div>
                  <div className="text-sm font-bold">Alex Thorne</div>
                  <div className="text-xs text-green-500 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Connected
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              <div className="flex gap-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-orangePrimary/20 text-orangePrimary flex shrink-0 items-center justify-center font-bold text-xs border border-orangePrimary/30">Dr.</div>
                <div className="bg-[#1a0f05] border border-orangePrimary/20 rounded-2xl rounded-tl-none p-4 text-sm text-gray-200">
                  Hi Alex. Thanks for logging in today. How have things been going since we last spoke about your manager?
                </div>
              </div>
              
              <div className="flex gap-4 flex-row-reverse mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex shrink-0 items-center justify-center font-bold text-xs border border-white/10">AT</div>
                <div className="bg-white/5 rounded-2xl rounded-tr-none p-4 text-sm text-gray-300">
                  (Sighs) Fine. Whatever. I really don't see why we need to talk about it again. I told you, I'm just going to keep to myself. It's safer that way.
                </div>
              </div>
              
               <div className="flex gap-4 mb-4 opacity-50">
                <div className="w-8 h-8 rounded-full bg-orangePrimary/20 text-orangePrimary flex shrink-0 items-center justify-center font-bold text-xs border border-orangePrimary/30">Dr.</div>
                <div className="bg-transparent text-gray-500 text-sm flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  Typing response...
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-cardDark border-t border-white/5">
              <div className="h-12 w-full bg-black/40 rounded-full border border-white/10 px-4 flex items-center text-sm text-gray-500">
                Type your therapeutic response here...
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoSection;
