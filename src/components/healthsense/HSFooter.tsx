const HSFooter = () => {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-hsTeal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span className="font-bold text-white">Health<span className="text-hsTeal">Sense</span> AI</span>
          </div>
          <div className="text-center md:text-right space-y-1">
            <p className="text-xs text-hsTextSecondary">
              Built for <span className="text-hsTeal font-semibold">NeuraX 2.0 Hackathon</span> — HealthTech & MedAI Track
            </p>
            <p className="text-[11px] text-hsTextSecondary/50">
              Solving healthcare access for 3.5B underserved people · Powered by NVIDIA NIM
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HSFooter;
