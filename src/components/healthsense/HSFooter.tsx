const HSFooter = () => {
  return (
    <footer id="footer" className="border-t border-white/5 py-12 mt-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            <span className="text-hsTeal font-bold text-lg">HealthSense</span>
            <span className="text-white font-light text-lg">AI</span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-hsTextSecondary text-sm">
              Built for <span className="text-hsTeal font-semibold">NeuraX 2.0 Hackathon</span>
            </p>
            <p className="text-hsTextSecondary/60 text-xs mt-1">
              OuroMind Psychiatric Simulator is an integrated extension
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-hsTextSecondary/40">
          Powered by NVIDIA NIM · Llama 3.1 70B · © 2026 HealthSense AI
        </div>
      </div>
    </footer>
  );
};

export default HSFooter;
