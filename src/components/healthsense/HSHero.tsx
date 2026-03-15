import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const HSHero = () => {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-hsTeal/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hsTeal/10 border border-hsTeal/20 text-hsTeal text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-4 duration-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hsTeal opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-hsTeal" />
              </span>
              Hackathon Ready: HealthTech & MedAI
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-white animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Intelligent Healthcare for <span className="text-transparent bg-clip-text bg-gradient-to-r from-hsTeal via-hsSky to-hsTeal bg-[length:200%_auto] animate-gradient-shift">Rural Communities.</span>
            </h1>
            
            <p className="text-lg text-hsTextSecondary leading-relaxed max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              Building a secure, intelligent telehealth ecosystem specifically targeting rural and underserved populations with AI-powered diagnostics and automated routing.
            </p>

            <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Link to="/platform" className="px-8 py-4 bg-hsTeal hover:bg-hsTealHover text-hsBg font-black rounded-2xl transition-all shadow-[0_0_30px_rgba(0,201,167,0.3)] hover:scale-105">
                Launch Platform →
              </Link>
              <button 
                onClick={() => document.getElementById('about-mission')?.scrollIntoView({ behavior: 'smooth' })} 
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all backdrop-blur-md"
              >
                View Mission Brief
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <div>
                <div className="text-3xl font-black text-white">98%</div>
                <div className="text-[10px] text-hsTextSecondary uppercase tracking-widest font-bold">Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-black text-hsTeal">&lt;2s</div>
                <div className="text-[10px] text-hsTextSecondary uppercase tracking-widest font-bold">Latency</div>
              </div>
              <div>
                <div className="text-3xl font-black text-white">2.4k</div>
                <div className="text-[10px] text-hsTextSecondary uppercase tracking-widest font-bold">Matched</div>
              </div>
            </div>
          </div>

          {/* Right Content: Problem Statement Card */}
          <div className="relative group animate-in fade-in slide-in-from-right-8 duration-1000 delay-300" id="about-mission">
             <div className="absolute -inset-0.5 bg-gradient-to-r from-hsTeal to-hsSky rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
             <div className="relative bg-hsBg border border-white/10 p-8 rounded-[2rem]">
                <div className="flex border-b border-white/5 pb-6 mb-6">
                   <div className="w-12 h-12 rounded-xl bg-hsTeal/10 flex items-center justify-center text-2xl mr-4 shadow-inner">🏥</div>
                   <div>
                      <h2 className="text-xl font-black text-white">HealthTech & MedAI</h2>
                      <p className="text-[10px] text-hsTeal uppercase tracking-widest font-black">Hackathon Module Alignment</p>
                   </div>
                   <div className="ml-auto flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#FF5F57]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#FFBD2E]"></div>
                      <div className="w-2 h-2 rounded-full bg-[#27C93F]"></div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div>
                      <label className="text-[10px] text-hsTeal uppercase font-black mb-2 block">🔥 Problem Statement</label>
                      <p className="text-xs text-hsTextSecondary leading-relaxed italic">
                        "Design and develop an AI-powered remote healthcare platform that enables early diagnosis, predictive risk monitoring, and automated hospital workflow optimization."
                      </p>
                   </div>

                   <div>
                      <label className="text-[10px] text-hsSky uppercase font-black mb-2 block">🎯 Core Objectives</label>
                      <ul className="grid grid-cols-1 gap-3">
                        {[
                          'Collect patient data remotely (Symptoms/Vitals)',
                          'Predict health risk using AI models',
                          'Automated hospital resource allocation',
                          'Secure telehealth ecosystem architecture'
                        ].map((obj, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-white/90">
                            <span className="w-4 h-4 rounded-full bg-hsTeal/20 flex items-center justify-center text-[8px] text-hsTeal font-bold shrink-0">{i+1}</span>
                            {obj}
                          </li>
                        ))}
                      </ul>
                   </div>

                   <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2">
                     {['AI Diagnostic', 'Remote Care', 'Privacy Vault', 'Workflow AI'].map(mod => (
                       <span key={mod} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-hsTextSecondary">{mod}</span>
                     ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HSHero;
