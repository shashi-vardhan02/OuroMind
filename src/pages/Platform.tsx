import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────
interface DiagResult { primaryDiagnosis: string; confidence: number; riskLevel: string; riskScore: number; triageClass: string; keyIndicators: string[]; explanation: string; recommendedActions: string[]; followUpRequired: boolean; patientData?: Record<string, string>; }
interface TriageResult { triageLevel: string; triageColor: string; timeToSee: string; reasoning: string; vitalsFlag: string[]; suggestedDepartment: string; }
interface WorkflowResult { bedUtilization: string; recommendations: string[]; priorityActions: string[]; estimatedWaitTime: string; resourceAlert: string; }
interface DatasetSummary { totalPatients: number; emergencyCount: number; urgentCount: number; routineCount: number; highRiskCount: number; avgRiskScore: number; results: DiagResult[]; note?: string; }
interface ColMap { [k: string]: string; }

// ── CSV Parser ────────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
    return headers.reduce((o, h, i) => ({ ...o, [h]: vals[i] || '' }), {} as Record<string, string>);
  });
}

// ── Fuzzy Column Mapping ──────────────────────────────────────
const FM: Record<string, string[]> = {
  age: ['age', 'patient_age', 'years'], gender: ['gender', 'sex', 'patient_gender'],
  symptoms: ['symptoms', 'complaint', 'chief_complaint', 'presenting_complaint', 'symptom'],
  bloodPressure: ['bp', 'blood_pressure', 'systolic', 'systolic_bp'],
  glucose: ['glucose', 'blood_glucose', 'sugar', 'blood_sugar'],
  bmi: ['bmi', 'body_mass', 'body_mass_index'],
  diagnosis: ['diagnosis', 'condition', 'disease', 'primary_diagnosis', 'outcome'],
};

function autoMap(headers: string[]): ColMap {
  const m: ColMap = {};
  for (const h of headers) {
    const l = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [f, a] of Object.entries(FM)) { if (a.some(x => l.includes(x.replace(/[^a-z0-9]/g, '')))) { m[h] = f; break; } }
    if (!m[h]) m[h] = h;
  }
  return m;
}

function applyMap(recs: Record<string, string>[], map: ColMap): Record<string, string>[] {
  return recs.map(row => {
    const mapped: Record<string, string> = {}; const extra: string[] = [];
    for (const [c, v] of Object.entries(row)) {
      const t = map[c];
      if (t && Object.keys(FM).includes(t)) mapped[t] = v; else extra.push(`${c}: ${v}`);
    }
    if (extra.length) mapped.additionalData = extra.join('; ');
    return mapped;
  });
}

// ── Helpers ───────────────────────────────────────────────────
const tabs = [
  { id: 'overview', icon: '🏠', label: 'Overview' },
  { id: 'diagnose', icon: '🔬', label: 'Diagnose Patient' },
  { id: 'analytics', icon: '📊', label: 'Risk Analytics' },
  { id: 'triage', icon: '🚑', label: 'Triage Center' },
  { id: 'workflow', icon: '⚙️', label: 'Workflow AI' },
];

function tc(level: string) {
  const l = level?.toLowerCase();
  if (l === 'emergency') return { bg: 'bg-hsDanger', glow: 'pulse-danger', border: 'border-hsDanger/30', text: 'text-hsDanger' };
  if (l === 'urgent') return { bg: 'bg-hsWarning', glow: 'pulse-warning', border: 'border-hsWarning/30', text: 'text-hsWarning' };
  return { bg: 'bg-hsSafe', glow: '', border: 'border-hsSafe/30', text: 'text-hsSafe' };
}

function rc(level: string) {
  const l = level?.toLowerCase();
  if (l === 'critical') return 'text-hsDanger'; if (l === 'high') return 'text-hsWarning'; if (l === 'medium') return 'text-yellow-400'; return 'text-hsSafe';
}

// ══════════════════════════════════════════════════════════════
const Platform = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [ds, setDs] = useState<DatasetSummary | null>(null);
  const [rawRecs, setRawRecs] = useState<Record<string, string>[]>([]);
  const [colMap, setColMap] = useState<ColMap>({});
  const [showMap, setShowMap] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState('');
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Quick triage on overview
  const [quickInput, setQuickInput] = useState('');
  const [quickResult, setQuickResult] = useState<TriageResult | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);

  // Diagnose
  const [df, setDf] = useState({ age: '', gender: 'Male', symptoms: '', bp: '', hr: '', temp: '', glucose: '', bmi: '', notes: '' });
  const [diagResult, setDiagResult] = useState<DiagResult | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  // Triage
  const [triInput, setTriInput] = useState('');
  const [triLoading, setTriLoading] = useState(false);
  const [triQueue, setTriQueue] = useState<(TriageResult & { input: string })[]>([]);

  // Workflow
  const [wf, setWf] = useState({ totalBeds: 100, occupiedBeds: 67, availableDoctors: 12, pendingAppointments: 45, emergencyCases: 8 });
  const [wfr, setWfr] = useState<WorkflowResult | null>(null);
  const [wfLoading, setWfLoading] = useState(false);

  // Analytics
  const [sortKey, setSortKey] = useState<'riskScore' | 'triageClass'>('riskScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterText, setFilterText] = useState('');

  // ── Handlers ───────────────────────────────────────────────
  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let recs: Record<string, string>[];
        if (file.name.endsWith('.json')) { const p = JSON.parse(text); recs = Array.isArray(p) ? p : p.data || p.patients || p.records || [p]; }
        else recs = parseCSV(text);
        setRawRecs(recs);
        setColMap(autoMap(Object.keys(recs[0] || {})));
        setShowMap(true);
      } catch { alert('Failed to parse file.'); }
    };
    reader.readAsText(file);
  };

  const runAnalysis = async () => {
    setAnalyzing(true); setShowMap(false);
    const mapped = applyMap(rawRecs, colMap);
    const total = Math.min(mapped.length, 20);
    setAnalyzeProgress(`Analyzing patient 1 of ${total}...`);
    try {
      const res = await fetch('/api/analyze-dataset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patients: mapped }) });
      const data = await res.json();
      setDs(data);
      setAnalyzeProgress('');
      setActiveTab('analytics');
    } catch { alert('Analysis failed.'); }
    setAnalyzing(false);
  };

  const runQuickTriage = async () => {
    setQuickLoading(true);
    try { const r = await fetch('/api/triage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientData: quickInput }) }); setQuickResult(await r.json()); }
    catch { alert('Triage failed.'); }
    setQuickLoading(false);
  };

  const runDiag = async () => {
    setDiagLoading(true);
    try {
      const r = await fetch('/api/diagnose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patient: { age: df.age, gender: df.gender, symptoms: df.symptoms, vitals: `BP:${df.bp},HR:${df.hr},Temp:${df.temp}`, bloodPressure: df.bp, glucose: df.glucose, bmi: df.bmi, additionalData: df.notes } }) });
      setDiagResult(await r.json());
    } catch { alert('Diagnosis failed.'); }
    setDiagLoading(false);
  };

  const runTri = async () => {
    setTriLoading(true);
    try { const r = await fetch('/api/triage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientData: triInput }) }); const d: TriageResult = await r.json(); setTriQueue(p => [{ ...d, input: triInput }, ...p]); setTriInput(''); }
    catch { alert('Triage failed.'); }
    setTriLoading(false);
  };

  const runWf = async () => {
    setWfLoading(true);
    try { const r = await fetch('/api/workflow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(wf) }); setWfr(await r.json()); }
    catch { alert('Workflow failed.'); }
    setWfLoading(false);
  };

  const sorted = ds?.results?.slice().filter(r => !filterText || JSON.stringify(r).toLowerCase().includes(filterText.toLowerCase())).sort((a, b) => {
    if (sortKey === 'riskScore') return sortDir === 'desc' ? (b.riskScore||0)-(a.riskScore||0) : (a.riskScore||0)-(b.riskScore||0);
    const o: Record<string,number> = { Emergency: 3, Urgent: 2, Routine: 1 };
    return sortDir === 'desc' ? (o[b.triageClass]||0)-(o[a.triageClass]||0) : (o[a.triageClass]||0)-(o[b.triageClass]||0);
  }) || [];

  const toggleSort = (k: 'riskScore'|'triageClass') => { if (sortKey===k) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortKey(k); setSortDir('desc'); } };

  return (
    <div className="flex h-screen bg-hsBg text-white overflow-hidden">
      {/* ── SIDEBAR ───────────────────────────────────────────── */}
      <aside className="w-60 bg-hsBgAlt border-r border-white/5 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-hsSafe opacity-75"/><span className="relative rounded-full h-2 w-2 bg-hsSafe"/></span>
            <span className="text-[10px] font-bold text-hsSafe uppercase tracking-wider">System Live</span>
          </div>
          <Link to="/" className="flex items-center gap-2 text-sm font-bold">
            <svg className="w-4 h-4 text-hsTeal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <span className="text-white">Health<span className="text-hsTeal">Sense</span> AI</span>
          </Link>
          <div className="mt-2 text-[10px] text-hsTextSecondary">Analyzed today: <span className="text-hsTeal font-bold">{ds?.totalPatients || 0}</span></div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === t.id ? 'bg-hsTeal/10 text-hsTeal border border-hsTeal/20' : 'text-hsTextSecondary hover:bg-white/5 hover:text-white border border-transparent'}`}>
              <span className="text-base">{t.icon}</span>{t.label}
            </button>
          ))}
          <Link to="/app" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-hsTextSecondary hover:bg-[#ff5500]/10 hover:text-[#ff5500] border border-transparent transition-all">
            <span className="text-base">🧠</span>OuroMind <span className="text-[9px] ml-auto opacity-50">↗</span>
          </Link>
        </nav>

        <div className="p-3 border-t border-white/5 text-center space-y-0.5">
          <div className="text-[9px] text-hsTextSecondary/50">Powered by NVIDIA NIM</div>
          <div className="text-[9px] text-hsTextSecondary/30">Llama 3.1 70B Medical AI</div>
        </div>
      </aside>

      {/* ── MAIN ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-hs-grid">

        {/* ════════ OVERVIEW ════════ */}
        {activeTab === 'overview' && (
          <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-black mb-6">Command Center</h1>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { icon: '👥', label: 'Patients Today', val: ds?.totalPatients || 0, color: 'hsTeal', live: true },
                { icon: '⚠️', label: 'High Risk', val: ds?.highRiskCount || 0, color: 'hsWarning', live: true, pulse: (ds?.highRiskCount || 0) > 0 },
                { icon: '🚨', label: 'Emergencies', val: ds?.emergencyCount || 0, color: 'hsDanger', live: true, pulse: (ds?.emergencyCount || 0) > 0 },
                { icon: '📊', label: 'Avg Risk Score', val: `${ds?.avgRiskScore || 0}%`, color: 'hsSky', live: true },
              ].map((m, i) => (
                <div key={i} className={`hs-card p-4 ${m.pulse ? (m.color === 'hsDanger' ? 'pulse-danger !border-hsDanger/30' : 'pulse-warning !border-hsWarning/30') : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{m.icon}</span>
                    {m.live && <span className={`flex items-center gap-1 text-[9px] font-bold text-${m.color} uppercase tracking-wider`}><span className={`w-1.5 h-1.5 rounded-full bg-${m.color} ${m.pulse ? 'animate-ping' : ''}`}/> Live</span>}
                  </div>
                  <div className={`text-3xl font-black text-${m.color}`}>{m.val}</div>
                  <div className="text-[10px] text-hsTextSecondary mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Two Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Quick Triage */}
              <div className="hs-card p-5">
                <h2 className="text-sm font-bold mb-3 flex items-center gap-2">⚡ Quick Triage</h2>
                <textarea value={quickInput} onChange={e => setQuickInput(e.target.value)}
                  className="w-full bg-hsBg border border-white/10 rounded-xl px-4 py-3 text-sm h-28 resize-none focus:border-hsTeal/40 focus:outline-none transition-colors"
                  placeholder="Type patient symptoms here...&#10;e.g. '45M, severe chest pain, BP 180/120, sweating, nausea'" />
                <button onClick={runQuickTriage} disabled={quickLoading || !quickInput.trim()}
                  className="mt-3 w-full bg-hsTeal hover:bg-hsTealHover text-hsBg font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40 shadow-[0_0_15px_rgba(0,201,167,0.15)]">
                  {quickLoading ? <span className="scan-anim inline-block w-full">🔬 Analyzing patient data...</span> : '⚡ Instant Triage'}
                </button>
                {quickResult && (
                  <div className={`mt-3 p-4 rounded-xl border ${tc(quickResult.triageLevel).border} ${tc(quickResult.triageLevel).bg}/10`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`${tc(quickResult.triageLevel).bg} text-white text-xs font-black px-3 py-1 rounded-full uppercase ${tc(quickResult.triageLevel).glow}`}>{quickResult.triageLevel}</span>
                      <span className="text-xs text-hsTextSecondary">{quickResult.timeToSee}</span>
                    </div>
                    <p className="text-sm text-hsTextSecondary">{quickResult.reasoning}</p>
                    <p className="text-xs text-hsTextSecondary/60 mt-2">Dept: <span className="text-hsTeal">{quickResult.suggestedDepartment}</span></p>
                  </div>
                )}
              </div>

              {/* Upload Dataset */}
              <div className="hs-card p-5">
                <h2 className="text-sm font-bold mb-3">📁 Upload Dataset</h2>
                <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <div onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }}
                  className="border-2 border-dashed border-hsTeal/20 rounded-xl p-8 text-center cursor-pointer hover:border-hsTeal/50 hover:bg-hsTeal/3 transition-all">
                  <div className="text-3xl mb-2">📁</div>
                  <p className="text-hsTeal text-sm font-semibold">Drop CSV / JSON here or click to browse</p>
                  <p className="text-[10px] text-hsTextSecondary mt-1">Supports any health dataset format</p>
                </div>

                {showMap && rawRecs.length > 0 && (
                  <div className="mt-4 bg-hsBg/60 rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-hsSafe font-bold mb-3">✅ {fileName} — {rawRecs.length} rows detected</p>
                    <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto">
                      {Object.entries(colMap).map(([col, target]) => (
                        <div key={col} className="flex items-center gap-2 text-[11px]">
                          <span className="text-hsTextSecondary w-28 truncate">{col}</span>
                          <span className="text-hsTeal">→</span>
                          <select value={target} onChange={e => setColMap(p => ({ ...p, [col]: e.target.value }))} className="bg-hsCard border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white flex-1">
                            <option value={col}>{col} (raw)</option>
                            {Object.keys(FM).map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                          <span className="text-hsSafe text-[10px]">{Object.keys(FM).includes(target) ? '✅' : '📎'}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={runAnalysis} disabled={analyzing} className="w-full bg-hsTeal hover:bg-hsTealHover text-hsBg font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40">
                      {analyzing ? <span className="scan-anim inline-block w-full">{analyzeProgress || '🔬 Analyzing...'}</span> : `🔬 Analyze ${rawRecs.length} patients`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════ DIAGNOSE ════════ */}
        {activeTab === 'diagnose' && (
          <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-black mb-6">🔬 Diagnose Patient</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="hs-card p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] text-hsTextSecondary block mb-1">Age</label><input value={df.age} onChange={e=>setDf(f=>({...f,age:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-hsTeal/40 focus:outline-none" placeholder="e.g. 45"/></div>
                  <div><label className="text-[10px] text-hsTextSecondary block mb-1">Gender</label><select value={df.gender} onChange={e=>setDf(f=>({...f,gender:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm"><option>Male</option><option>Female</option><option>Other</option></select></div>
                </div>
                <div><label className="text-[10px] text-hsTextSecondary block mb-1">Primary Symptoms</label><textarea value={df.symptoms} onChange={e=>setDf(f=>({...f,symptoms:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm h-24 resize-none focus:border-hsTeal/40 focus:outline-none" placeholder="Describe symptoms in detail..."/></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-[10px] text-hsTextSecondary block mb-1">Blood Pressure</label><input value={df.bp} onChange={e=>setDf(f=>({...f,bp:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="120/80"/></div>
                  <div><label className="text-[10px] text-hsTextSecondary block mb-1">Heart Rate</label><input value={df.hr} onChange={e=>setDf(f=>({...f,hr:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="72 bpm"/></div>
                  <div><label className="text-[10px] text-hsTextSecondary block mb-1">Temperature</label><input value={df.temp} onChange={e=>setDf(f=>({...f,temp:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="98.6°F"/></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] text-hsTextSecondary block mb-1">Blood Glucose</label><input value={df.glucose} onChange={e=>setDf(f=>({...f,glucose:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="110 mg/dL"/></div>
                  <div><label className="text-[10px] text-hsTextSecondary block mb-1">BMI</label><input value={df.bmi} onChange={e=>setDf(f=>({...f,bmi:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="24.5"/></div>
                </div>
                <div><label className="text-[10px] text-hsTextSecondary block mb-1">Additional Notes</label><textarea value={df.notes} onChange={e=>setDf(f=>({...f,notes:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm h-14 resize-none" placeholder="Any other relevant info..."/></div>
                <button onClick={runDiag} disabled={diagLoading||!df.symptoms} className="w-full bg-hsTeal hover:bg-hsTealHover text-hsBg font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-40 shadow-[0_0_15px_rgba(0,201,167,0.15)]">
                  {diagLoading ? <span className="scan-anim inline-block w-full">🔬 Running AI diagnosis...</span> : '🔬 Run AI Diagnosis'}
                </button>
              </div>

              {/* Results */}
              <div>
                {diagResult ? (
                  <div className="space-y-4">
                    {/* Giant Triage Badge */}
                    <div className={`${tc(diagResult.triageClass).bg} rounded-2xl p-5 text-center ${tc(diagResult.triageClass).glow}`}>
                      <div className="text-2xl font-black uppercase tracking-wider">{diagResult.triageClass === 'Emergency' ? '🚨' : diagResult.triageClass === 'Urgent' ? '⚠️' : '✅'} {diagResult.triageClass}</div>
                      <div className="text-sm opacity-90 mt-1">{diagResult.triageClass === 'Emergency' ? 'Immediate medical attention needed' : diagResult.triageClass === 'Urgent' ? 'See doctor within 2 hours' : 'Schedule within 24 hours'}</div>
                    </div>

                    <div className="hs-card p-5">
                      {/* Diagnosis + Score */}
                      <div className="flex items-center gap-5 mb-5">
                        <div className="relative w-20 h-20 shrink-0">
                          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="7"/><circle cx="50" cy="50" r="42" fill="none" stroke={diagResult.riskScore>=70?'#ef4444':diagResult.riskScore>=40?'#f97316':'#22c55e'} strokeWidth="7" strokeDasharray={`${diagResult.riskScore*2.64} 264`} strokeLinecap="round"/></svg>
                          <div className="absolute inset-0 flex items-center justify-center text-lg font-black">{diagResult.riskScore}</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{diagResult.primaryDiagnosis}</div>
                          <div className="text-xs text-hsTextSecondary mt-0.5">Confidence: <span className="text-hsTeal font-bold">{diagResult.confidence}%</span></div>
                          <div className="w-full bg-hsBgAlt rounded-full h-2 mt-1.5"><div className="bg-hsTeal h-2 rounded-full transition-all" style={{width:`${diagResult.confidence}%`}}/></div>
                          <div className={`text-xs font-bold mt-1 ${rc(diagResult.riskLevel)}`}>Risk: {diagResult.riskLevel}</div>
                        </div>
                      </div>

                      {/* Key Indicators */}
                      <div className="mb-4">
                        <h4 className="text-[10px] uppercase tracking-widest text-hsTextSecondary mb-2">Key Indicators</h4>
                        <div className="flex flex-wrap gap-1.5">{diagResult.keyIndicators?.map((k,i) => <span key={i} className="bg-hsTeal/10 text-hsTeal text-[11px] px-2.5 py-0.5 rounded-full border border-hsTeal/20">{k}</span>)}</div>
                      </div>

                      {/* Explanation */}
                      <div className="mb-4 p-3 bg-hsTeal/5 border border-hsTeal/15 rounded-xl"><p className="text-sm text-hsTextSecondary leading-relaxed">{diagResult.explanation}</p></div>

                      {/* Actions */}
                      <div className="mb-4">
                        <h4 className="text-[10px] uppercase tracking-widest text-hsTextSecondary mb-2">Recommended Actions</h4>
                        <ul className="space-y-1.5">{diagResult.recommendedActions?.map((a,i) => <li key={i} className="flex items-start gap-2 text-sm"><span className="text-hsTeal mt-0.5">☐</span>{a}</li>)}</ul>
                      </div>

                      {/* Disclaimer */}
                      <div className="p-3 bg-hsWarning/5 border border-hsWarning/15 rounded-xl text-[11px] text-hsTextSecondary">⚠️ This AI diagnosis is for clinical decision support only. Final diagnosis must be confirmed by a licensed physician. Confidence: {diagResult.confidence}%.</div>
                    </div>
                  </div>
                ) : (
                  <div className="hs-card p-12 flex flex-col items-center justify-center text-center h-full"><div className="text-5xl mb-3 opacity-20">🔬</div><p className="text-hsTextSecondary text-sm">Fill in patient data and run AI diagnosis</p></div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════ ANALYTICS ════════ */}
        {activeTab === 'analytics' && (
          <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-black mb-6">📊 Risk Analytics</h1>
            {!ds ? (
              <div className="hs-card p-16 text-center"><div className="text-5xl mb-3 opacity-20">📈</div><p className="text-hsTextSecondary text-sm">Upload a dataset in Overview tab first</p></div>
            ) : (
              <div>
                {ds.note && <div className="mb-4 p-3 bg-hsWarning/10 border border-hsWarning/20 rounded-xl text-xs text-hsWarning">{ds.note}</div>}

                {/* Summary Boxes */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[{ l: 'Emergency', v: ds.emergencyCount, c: 'hsDanger', ic: '🔴' }, { l: 'Urgent', v: ds.urgentCount, c: 'hsWarning', ic: '🟠' }, { l: 'Routine', v: ds.routineCount, c: 'hsSafe', ic: '🟢' }].map(b => (
                    <div key={b.l} className={`hs-card p-4 border-l-4 border-l-${b.c}`}>
                      <div className="text-xs text-hsTextSecondary mb-1">{b.ic} {b.l}</div>
                      <div className={`text-3xl font-black text-${b.c}`}>{b.v}</div>
                      <div className="text-[10px] text-hsTextSecondary">patients</div>
                    </div>
                  ))}
                </div>

                {/* Risk Distribution Bars */}
                <div className="hs-card p-5 mb-6">
                  <h3 className="text-sm font-bold mb-4">Risk Distribution</h3>
                  {['Critical','High','Medium','Low'].map(level => {
                    const count = ds.results.filter(r=>r.riskLevel===level).length;
                    const pct = ds.totalPatients ? Math.round(count/ds.totalPatients*100) : 0;
                    return (
                      <div key={level} className="mb-3">
                        <div className="flex justify-between text-xs mb-1"><span className={rc(level)}>{level}</span><span className="text-hsTextSecondary">{count} ({pct}%)</span></div>
                        <div className="h-3 bg-hsBg rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${level==='Critical'?'bg-hsDanger':level==='High'?'bg-hsWarning':level==='Medium'?'bg-yellow-500':'bg-hsSafe'}`} style={{width:`${pct}%`}}/></div>
                      </div>
                    );
                  })}
                </div>

                {/* Table */}
                <div className="hs-card overflow-hidden">
                  <div className="p-4 flex items-center justify-between border-b border-white/5">
                    <input value={filterText} onChange={e=>setFilterText(e.target.value)} placeholder="🔍 Search patients..." className="bg-hsBg border border-white/10 rounded-lg px-3 py-1.5 text-xs w-60 focus:border-hsTeal/40 focus:outline-none"/>
                    <button onClick={()=>{const b=new Blob([JSON.stringify(ds,null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='healthsense-report.json';a.click();}} className="bg-hsTeal/10 text-hsTeal text-[10px] font-bold px-3 py-1.5 rounded-full hover:bg-hsTeal/20 transition-all">📥 Download Report</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-white/10 text-[10px] text-hsTextSecondary uppercase tracking-wider">
                        <th className="py-2.5 px-3 text-left">#</th><th className="py-2.5 px-3 text-left">Age</th><th className="py-2.5 px-3 text-left">Gender</th><th className="py-2.5 px-3 text-left">Key Symptoms</th><th className="py-2.5 px-3 text-left">Diagnosis</th>
                        <th className="py-2.5 px-3 text-left cursor-pointer hover:text-hsTeal" onClick={()=>toggleSort('riskScore')}>Risk {sortKey==='riskScore'&&(sortDir==='desc'?'↓':'↑')}</th>
                        <th className="py-2.5 px-3 text-left cursor-pointer hover:text-hsTeal" onClick={()=>toggleSort('triageClass')}>Triage {sortKey==='triageClass'&&(sortDir==='desc'?'↓':'↑')}</th>
                      </tr></thead>
                      <tbody>{sorted.map((r,i)=>(
                        <tr key={i} className={`border-b border-white/5 ${r.triageClass==='Emergency'?'bg-hsDanger/5':r.triageClass==='Urgent'?'bg-hsWarning/5':''}`}>
                          <td className="py-2.5 px-3 text-hsTextSecondary">{i+1}</td>
                          <td className="py-2.5 px-3">{r.patientData?.age||'—'}</td>
                          <td className="py-2.5 px-3">{r.patientData?.gender||'—'}</td>
                          <td className="py-2.5 px-3 max-w-[150px] truncate text-hsTextSecondary">{r.keyIndicators?.slice(0,2).join(', ')||'—'}</td>
                          <td className="py-2.5 px-3 max-w-[180px] truncate">{r.primaryDiagnosis}</td>
                          <td className="py-2.5 px-3 font-bold">{r.riskScore}</td>
                          <td className="py-2.5 px-3"><span className={`${tc(r.triageClass).bg} text-white text-[10px] px-2 py-0.5 rounded-full font-bold`}>{r.triageClass}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════ TRIAGE ════════ */}
        {activeTab === 'triage' && (
          <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-black mb-6">🚑 Triage Center</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="hs-card p-5">
                <h2 className="text-sm font-bold mb-3">🚑 Quick Triage Assessment</h2>
                <textarea value={triInput} onChange={e=>setTriInput(e.target.value)}
                  className="w-full bg-hsBg border border-white/10 rounded-xl px-4 py-3 text-sm h-36 resize-none focus:border-hsTeal/40 focus:outline-none"
                  placeholder={"Describe patient condition...\nExamples:\n• '78M, unconscious, BP 60/40, weak pulse'\n• '23F, mild fever 99.2°F, sore throat, fatigue'\n• '45M, chest pain radiating to left arm, sweating'"} />
                <button onClick={runTri} disabled={triLoading||!triInput.trim()} className="mt-3 w-full bg-hsTeal hover:bg-hsTealHover text-hsBg font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-40">
                  {triLoading ? <span className="scan-anim inline-block w-full">🔬 Classifying...</span> : '⚡ Classify Now'}
                </button>
                {triQueue[0] && (
                  <div className={`mt-4 p-4 rounded-xl border ${tc(triQueue[0].triageLevel).border} ${tc(triQueue[0].triageLevel).bg}/10`}>
                    <div className={`${tc(triQueue[0].triageLevel).bg} text-white text-sm font-black px-4 py-2 rounded-lg text-center mb-3 ${tc(triQueue[0].triageLevel).glow}`}>
                      {triQueue[0].triageLevel === 'Emergency' ? '🚨' : triQueue[0].triageLevel === 'Urgent' ? '⚠️' : '✅'} {triQueue[0].triageLevel} — {triQueue[0].timeToSee}
                    </div>
                    <p className="text-sm text-hsTextSecondary mb-2">{triQueue[0].reasoning}</p>
                    <div className="flex flex-wrap gap-1.5 mb-2">{triQueue[0].vitalsFlag?.map((v,i) => <span key={i} className="bg-hsDanger/10 text-hsDanger text-[10px] px-2 py-0.5 rounded-full border border-hsDanger/20">{v}</span>)}</div>
                    <p className="text-xs text-hsTextSecondary/60">Suggested: <span className="text-hsTeal font-semibold">{triQueue[0].suggestedDepartment}</span></p>
                  </div>
                )}
              </div>

              <div className="hs-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold">Active Queue ({triQueue.length})</h2>
                  {triQueue.length > 0 && <button onClick={()=>setTriQueue([])} className="text-[10px] text-hsDanger hover:text-hsDanger/80">Clear</button>}
                </div>
                {triQueue.length === 0 ? (
                  <div className="text-center py-16"><div className="text-4xl mb-2 opacity-20">🚑</div><p className="text-hsTextSecondary text-xs">No patients in queue</p></div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {triQueue.map((t,i) => (
                      <div key={i} className={`border-l-4 ${tc(t.triageLevel).border.replace('/30','')} bg-hsBg/40 rounded-lg p-3`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`${tc(t.triageLevel).bg} text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase`}>{t.triageLevel}</span>
                          <span className="text-[10px] text-hsTextSecondary">{t.timeToSee}</span>
                        </div>
                        <p className="text-xs text-hsTextSecondary truncate">{t.input}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════ WORKFLOW ════════ */}
        {activeTab === 'workflow' && (
          <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-black mb-1">⚙️ Workflow AI</h1>
            <p className="text-xs text-hsTextSecondary mb-6">AI-powered resource allocation for maximum patient throughput</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="hs-card p-5">
                <h2 className="text-sm font-bold mb-4">Hospital Resource Data</h2>
                <div className="space-y-4">
                  {[{k:'totalBeds',l:'🛏 Total Beds',max:500},{k:'occupiedBeds',l:'🛏 Occupied Beds',max:500},{k:'availableDoctors',l:'👨‍⚕️ Doctors Available',max:100},{k:'pendingAppointments',l:'📋 Pending Appointments',max:200},{k:'emergencyCases',l:'🚨 Emergency Cases',max:50}].map(s=>(
                    <div key={s.k}>
                      <div className="flex justify-between text-xs mb-1"><span className="text-hsTextSecondary">{s.l}</span><span className="font-bold text-hsTeal">{wf[s.k as keyof typeof wf]}</span></div>
                      <input type="range" min={0} max={s.max} value={wf[s.k as keyof typeof wf]} onChange={e=>setWf(f=>({...f,[s.k]:Number(e.target.value)}))}/>
                    </div>
                  ))}
                </div>
                <button onClick={runWf} disabled={wfLoading} className="mt-5 w-full bg-hsTeal hover:bg-hsTealHover text-hsBg font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-40">
                  {wfLoading ? <span className="scan-anim inline-block w-full">🤖 Optimizing...</span> : '🤖 Optimize Now'}
                </button>
              </div>

              <div>
                {wfr ? (
                  <div className="space-y-4">
                    {/* Alert Banner */}
                    <div className={`p-4 rounded-xl font-bold text-sm ${wfr.resourceAlert==='critical'?'bg-hsDanger/15 text-hsDanger border border-hsDanger/20 pulse-danger':wfr.resourceAlert==='warning'?'bg-hsWarning/15 text-hsWarning border border-hsWarning/20 pulse-warning':'bg-hsSafe/15 text-hsSafe border border-hsSafe/20'}`}>
                      {wfr.resourceAlert==='critical'?'🚨':wfr.resourceAlert==='warning'?'⚠️':'✅'} Resource Status: {wfr.resourceAlert?.toUpperCase()}
                    </div>

                    <div className="hs-card p-5">
                      <div className="flex items-center gap-6 mb-5">
                        <div className="relative w-24 h-24 shrink-0">
                          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="7"/><circle cx="50" cy="50" r="42" fill="none" stroke={parseInt(wfr.bedUtilization)>=85?'#ef4444':parseInt(wfr.bedUtilization)>=70?'#f97316':'#22c55e'} strokeWidth="7" strokeDasharray={`${(parseInt(wfr.bedUtilization)||0)*2.64} 264`} strokeLinecap="round"/></svg>
                          <div className="absolute inset-0 flex items-center justify-center text-sm font-black">{wfr.bedUtilization}</div>
                        </div>
                        <div>
                          <h3 className="font-bold">Bed Utilization</h3>
                          <p className="text-xs text-hsTextSecondary">Wait: {wfr.estimatedWaitTime}</p>
                        </div>
                      </div>

                      {wfr.priorityActions?.length > 0 && (
                        <div className="mb-4"><h4 className="text-[10px] uppercase tracking-widest text-hsDanger mb-2">Priority Actions</h4>
                          {wfr.priorityActions.map((a,i)=><div key={i} className="flex items-start gap-2 text-sm bg-hsDanger/8 border border-hsDanger/15 rounded-lg p-3 mb-2"><span className="text-hsDanger font-bold">🚨</span>{a}</div>)}
                        </div>
                      )}

                      <div><h4 className="text-[10px] uppercase tracking-widest text-hsTextSecondary mb-2">All Recommendations</h4>
                        <ul className="space-y-1.5">{wfr.recommendations?.map((r,i)=><li key={i} className="flex items-start gap-2 text-sm"><span className="text-hsTeal mt-0.5">✓</span>{r}</li>)}</ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="hs-card p-12 flex flex-col items-center justify-center text-center h-full"><div className="text-5xl mb-3 opacity-20">⚙️</div><p className="text-hsTextSecondary text-sm">Adjust hospital data and optimize</p></div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Platform;
