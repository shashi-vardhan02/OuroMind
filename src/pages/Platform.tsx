import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────
interface DiagnosisResult {
  primaryDiagnosis: string;
  confidence: number;
  riskLevel: string;
  riskScore: number;
  triageClass: string;
  keyIndicators: string[];
  explanation: string;
  recommendedActions: string[];
  followUpRequired: boolean;
  patientData?: Record<string, string>;
}

interface TriageResult {
  triageLevel: string;
  triageColor: string;
  timeToSee: string;
  reasoning: string;
  vitalsFlag: string[];
  suggestedDepartment: string;
}

interface WorkflowResult {
  bedUtilization: string;
  recommendations: string[];
  priorityActions: string[];
  estimatedWaitTime: string;
  resourceAlert: string;
}

interface DatasetSummary {
  totalPatients: number;
  emergencyCount: number;
  urgentCount: number;
  routineCount: number;
  highRiskCount: number;
  avgRiskScore: number;
  results: DiagnosisResult[];
  note?: string;
}

interface ColumnMapping {
  [key: string]: string;
}

// ── CSV Parser ────────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] || '' }), {} as Record<string, string>);
  });
}

// ── Fuzzy Column Mapping ──────────────────────────────────────
const FIELD_MAP: Record<string, string[]> = {
  age: ['age', 'patient_age', 'years'],
  gender: ['gender', 'sex', 'patient_gender'],
  symptoms: ['symptoms', 'complaint', 'chief_complaint', 'presenting_complaint', 'symptom'],
  bloodPressure: ['bp', 'blood_pressure', 'systolic', 'systolic_bp'],
  glucose: ['glucose', 'blood_glucose', 'sugar', 'blood_sugar'],
  bmi: ['bmi', 'body_mass', 'body_mass_index'],
  diagnosis: ['diagnosis', 'condition', 'disease', 'primary_diagnosis'],
};

function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const header of headers) {
    const lower = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [field, aliases] of Object.entries(FIELD_MAP)) {
      if (aliases.some(a => lower.includes(a.replace(/[^a-z0-9]/g, '')))) {
        mapping[header] = field;
        break;
      }
    }
    if (!mapping[header]) mapping[header] = header;
  }
  return mapping;
}

function applyMapping(records: Record<string, string>[], mapping: ColumnMapping): Record<string, string>[] {
  return records.map(row => {
    const mapped: Record<string, string> = {};
    const extra: string[] = [];
    for (const [col, val] of Object.entries(row)) {
      const target = mapping[col];
      if (target && Object.keys(FIELD_MAP).includes(target)) {
        mapped[target] = val;
      } else {
        extra.push(`${col}: ${val}`);
      }
    }
    if (extra.length) mapped.additionalData = extra.join('; ');
    return mapped;
  });
}

// ── Sidebar Tabs ──────────────────────────────────────────────
const tabs = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'diagnostics', icon: '🔬', label: 'AI Diagnostics' },
  { id: 'analytics', icon: '📈', label: 'Risk Analytics' },
  { id: 'triage', icon: '🚑', label: 'Triage Center' },
  { id: 'workflow', icon: '⚙️', label: 'Workflow Manager' },
];

// ── Triage color helper ───────────────────────────────────────
function triageColor(level: string) {
  const l = level?.toLowerCase();
  if (l === 'emergency') return { bg: 'bg-hsDanger', text: 'text-white', border: 'border-hsDanger/30' };
  if (l === 'urgent') return { bg: 'bg-hsWarning', text: 'text-white', border: 'border-hsWarning/30' };
  return { bg: 'bg-hsSafe', text: 'text-white', border: 'border-hsSafe/30' };
}

function riskColor(level: string) {
  const l = level?.toLowerCase();
  if (l === 'critical') return 'text-hsDanger';
  if (l === 'high') return 'text-hsWarning';
  if (l === 'medium') return 'text-yellow-400';
  return 'text-hsSafe';
}

// ══════════════════════════════════════════════════════════════
// MAIN PLATFORM COMPONENT
// ══════════════════════════════════════════════════════════════
const Platform = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard state
  const [datasetResults, setDatasetResults] = useState<DatasetSummary | null>(null);
  const [rawRecords, setRawRecords] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [showMapping, setShowMapping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Diagnostics state
  const [diagForm, setDiagForm] = useState({ age: '', gender: 'Male', symptoms: '', bp: '', heartRate: '', temperature: '', glucose: '', bmi: '', notes: '' });
  const [diagResult, setDiagResult] = useState<DiagnosisResult | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  // Triage state
  const [triageInput, setTriageInput] = useState('');
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageQueue, setTriageQueue] = useState<(TriageResult & { input: string })[]>([]);

  // Workflow state
  const [wfForm, setWfForm] = useState({ totalBeds: 100, occupiedBeds: 67, availableDoctors: 12, pendingAppointments: 45, emergencyCases: 8 });
  const [wfResult, setWfResult] = useState<WorkflowResult | null>(null);
  const [wfLoading, setWfLoading] = useState(false);

  // ── File Upload Handler ─────────────────────────────────────
  const handleFileUpload = (file: File) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let records: Record<string, string>[];
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          records = Array.isArray(parsed) ? parsed : parsed.data || parsed.patients || parsed.records || [parsed];
        } else {
          records = parseCSV(text);
        }
        setRawRecords(records);
        const headers = Object.keys(records[0] || {});
        const mapping = autoMapColumns(headers);
        setColumnMapping(mapping);
        setShowMapping(true);
      } catch {
        alert('Failed to parse file. Please check format.');
      }
      setUploading(false);
    };
    reader.readAsText(file);
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setShowMapping(false);
    const mapped = applyMapping(rawRecords, columnMapping);
    try {
      const res = await fetch('/api/analyze-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients: mapped }),
      });
      const data = await res.json();
      setDatasetResults(data);
      setActiveTab('analytics');
    } catch {
      alert('Analysis failed. Check server connection.');
    }
    setAnalyzing(false);
  };

  // ── Diagnose Handler ────────────────────────────────────────
  const runDiagnosis = async () => {
    setDiagLoading(true);
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: {
            age: diagForm.age,
            gender: diagForm.gender,
            symptoms: diagForm.symptoms,
            vitals: `BP: ${diagForm.bp}, HR: ${diagForm.heartRate}, Temp: ${diagForm.temperature}`,
            bloodPressure: diagForm.bp,
            glucose: diagForm.glucose,
            bmi: diagForm.bmi,
            additionalData: diagForm.notes,
          },
        }),
      });
      setDiagResult(await res.json());
    } catch {
      alert('Diagnosis failed. Check server connection.');
    }
    setDiagLoading(false);
  };

  // ── Triage Handler ──────────────────────────────────────────
  const runTriage = async () => {
    setTriageLoading(true);
    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientData: triageInput }),
      });
      const data: TriageResult = await res.json();
      setTriageQueue(prev => [{ ...data, input: triageInput }, ...prev]);
      setTriageInput('');
    } catch {
      alert('Triage failed.');
    }
    setTriageLoading(false);
  };

  // ── Workflow Handler ────────────────────────────────────────
  const runWorkflow = async () => {
    setWfLoading(true);
    try {
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wfForm),
      });
      setWfResult(await res.json());
    } catch {
      alert('Workflow analysis failed.');
    }
    setWfLoading(false);
  };

  // ── Analytics sort ──────────────────────────────────────────
  const [sortKey, setSortKey] = useState<'riskScore' | 'triageClass'>('riskScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const sortedResults = datasetResults?.results?.slice().sort((a, b) => {
    if (sortKey === 'riskScore') {
      return sortDir === 'desc' ? (b.riskScore || 0) - (a.riskScore || 0) : (a.riskScore || 0) - (b.riskScore || 0);
    }
    const order: Record<string, number> = { Emergency: 3, Urgent: 2, Routine: 1 };
    return sortDir === 'desc'
      ? (order[b.triageClass] || 0) - (order[a.triageClass] || 0)
      : (order[a.triageClass] || 0) - (order[b.triageClass] || 0);
  }) || [];

  const toggleSort = (key: 'riskScore' | 'triageClass') => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="flex h-screen bg-hsBg text-white overflow-hidden">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="w-64 bg-hsBgAlt border-r border-white/5 flex flex-col shrink-0">
        <div className="p-5 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="text-xl">🏥</span>
            <span className="text-hsTeal">HealthSense</span>
            <span className="font-light">AI</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === t.id
                  ? 'bg-hsTeal/10 text-hsTeal border border-hsTeal/20'
                  : 'text-hsTextSecondary hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
          <Link
            to="/app"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-hsTextSecondary hover:bg-[#ff5500]/10 hover:text-[#ff5500] border border-transparent transition-all"
          >
            <span className="text-lg">🧠</span>
            OuroMind
          </Link>
        </nav>
        <div className="p-4 border-t border-white/5 text-xs text-hsTextSecondary/50 text-center">
          Powered by NVIDIA NIM
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* ════════ DASHBOARD TAB ════════ */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-black mb-8">Dashboard</h1>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Patients Analyzed', value: datasetResults?.totalPatients || 0, icon: '👥', color: 'hsTeal' },
                { label: 'High Risk Patients', value: datasetResults?.highRiskCount || 0, icon: '⚠️', color: 'hsWarning' },
                { label: 'Emergency Triage', value: datasetResults?.emergencyCount || 0, icon: '🚨', color: 'hsDanger' },
                { label: 'Avg Risk Score', value: `${datasetResults?.avgRiskScore || 0}%`, icon: '📊', color: 'hsSky' },
              ].map(m => (
                <div key={m.label} className="bg-hsCard/60 border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{m.icon}</span>
                    <span className={`text-${m.color} text-xs font-bold uppercase tracking-wider`}>Live</span>
                  </div>
                  <div className="text-3xl font-black mb-1">{m.value}</div>
                  <div className="text-xs text-hsTextSecondary">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Upload Section */}
            <div className="bg-hsCard/40 border border-white/5 rounded-2xl p-8">
              <h2 className="text-xl font-bold mb-2">Upload Health Dataset</h2>
              <p className="text-sm text-hsTextSecondary mb-6">
                Upload any patient health dataset. Supported columns: age, gender, symptoms, vitals, blood_pressure, glucose, bmi, diagnosis, etc.
              </p>
              <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFileUpload(e.dataTransfer.files[0]); }}
                className="border-2 border-dashed border-hsTeal/30 rounded-xl p-12 text-center cursor-pointer hover:border-hsTeal/60 hover:bg-hsTeal/5 transition-all"
              >
                <div className="text-4xl mb-3">📁</div>
                <p className="text-hsTeal font-semibold mb-1">{uploading ? 'Parsing...' : 'Drop CSV / JSON here or click to browse'}</p>
                <p className="text-xs text-hsTextSecondary">Supports any health dataset format</p>
              </div>

              {/* Column Mapping Preview */}
              {showMapping && rawRecords.length > 0 && (
                <div className="mt-6 bg-hsBgAlt/60 rounded-xl p-6 border border-white/5">
                  <h3 className="font-bold mb-4 text-hsTeal">Column Mapping Preview</h3>
                  <p className="text-xs text-hsTextSecondary mb-4">We auto-detected {rawRecords.length} records. Confirm or adjust mappings:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {Object.entries(columnMapping).map(([col, target]) => (
                      <div key={col} className="flex items-center gap-2 text-sm">
                        <span className="text-hsTextSecondary truncate">{col}</span>
                        <span className="text-hsTeal">→</span>
                        <select
                          value={target}
                          onChange={e => setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))}
                          className="bg-hsCard border border-white/10 rounded px-2 py-1 text-xs text-white flex-1"
                        >
                          <option value={col}>{col} (raw)</option>
                          {Object.keys(FIELD_MAP).map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Preview table */}
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10">
                          {Object.keys(rawRecords[0]).map(h => <th key={h} className="py-2 px-3 text-left text-hsTextSecondary font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {rawRecords.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-white/5">
                            {Object.values(row).map((v, j) => <td key={j} className="py-2 px-3 truncate max-w-[150px]">{v}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="bg-hsTeal hover:bg-hsTealHover text-hsBg font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    {analyzing ? '⏳ Analyzing with AI...' : `🚀 Run AI Analysis on ${rawRecords.length} Records`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ DIAGNOSTICS TAB ════════ */}
        {activeTab === 'diagnostics' && (
          <div>
            <h1 className="text-3xl font-black mb-8">AI Diagnostics</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <div className="bg-hsCard/40 border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">Patient Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-hsTextSecondary block mb-1">Age</label>
                    <input value={diagForm.age} onChange={e => setDiagForm(f => ({ ...f, age: e.target.value }))} className="w-full bg-hsBgAlt border border-white/10 rounded-lg px-3 py-2.5 text-sm" placeholder="e.g. 45" />
                  </div>
                  <div>
                    <label className="text-xs text-hsTextSecondary block mb-1">Gender</label>
                    <select value={diagForm.gender} onChange={e => setDiagForm(f => ({ ...f, gender: e.target.value }))} className="w-full bg-hsBgAlt border border-white/10 rounded-lg px-3 py-2.5 text-sm">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-xs text-hsTextSecondary block mb-1">Primary Symptoms</label>
                  <textarea value={diagForm.symptoms} onChange={e => setDiagForm(f => ({ ...f, symptoms: e.target.value }))} className="w-full bg-hsBgAlt border border-white/10 rounded-lg px-3 py-2.5 text-sm h-24 resize-none" placeholder="Describe symptoms..." />
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div>
                    <label className="text-xs text-hsTextSecondary block mb-1">Blood Pressure</label>
                    <input value={diagForm.bp} onChange={e => setDiagForm(f => ({ ...f, bp: e.target.value }))} className="w-full bg-hsBgAlt border border-white/10 rounded-lg px-3 py-2.5 text-sm" placeholder="120/80" />
                  </div>
                  <div>
                    <label className="text-xs text-hsTextSecondary block mb-1">Heart Rate</label>
                    <input value={diagForm.heartRate} onChange={e => setDiagForm(f => ({ ...f, heartRate: e.target.value }))} className="w-full bg-hsBgAlt border border-white/10 rounded-lg px-3 py-2.5 text-sm" placeholder="72 bpm" />
                  </div>
                  <div>
                    <label className="text-xs text-hsTextSecondary block mb-1">Temperature</label>
                    <input value={diagForm.temperature} onChange={e => setDiagForm(f => ({ ...f, temperature: e.target.value }))} className="w-full bg-hsBgAlt border border-white/10 rounded-lg px-3 py-2.5 text-sm" placeholder="98.6°F" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="text-xs text-hsTextSecondary block mb-1">Blood Glucose</label>
                    <input value={diagForm.glucose} onChange={e => setDiagForm(f => ({ ...f, glucose: e.target.value }))} className="w-full bg-hsBgAlt border border-white/10 rounded-lg px-3 py-2.5 text-sm" placeholder="110 mg/dL" />
                  </div>
                  <div>
                    <label className="text-xs text-hsTextSecondary block mb-1">BMI</label>
                    <input value={diagForm.bmi} onChange={e => setDiagForm(f => ({ ...f, bmi: e.target.value }))} className="w-full bg-hsBgAlt border border-white/10 rounded-lg px-3 py-2.5 text-sm" placeholder="24.5" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-xs text-hsTextSecondary block mb-1">Additional Notes</label>
                  <textarea value={diagForm.notes} onChange={e => setDiagForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-hsBgAlt border border-white/10 rounded-lg px-3 py-2.5 text-sm h-16 resize-none" placeholder="Any other relevant info..." />
                </div>
                <button onClick={runDiagnosis} disabled={diagLoading || !diagForm.symptoms} className="mt-5 w-full bg-hsTeal hover:bg-hsTealHover text-hsBg font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                  {diagLoading ? '⏳ Running AI Diagnosis...' : '🔬 Run AI Diagnosis'}
                </button>
              </div>

              {/* Results */}
              <div>
                {diagResult ? (
                  <div className="bg-hsCard/40 border border-white/5 rounded-2xl p-6">
                    {/* Triage Badge */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`${triageColor(diagResult.triageClass).bg} px-5 py-2 rounded-full text-sm font-black uppercase tracking-wider`}>
                        {diagResult.triageClass}
                      </div>
                      <span className="text-xs text-hsTextSecondary">Triage Classification</span>
                    </div>

                    {/* Risk Score Meter */}
                    <div className="flex items-center gap-6 mb-6">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke={diagResult.riskScore >= 70 ? '#ef4444' : diagResult.riskScore >= 40 ? '#f97316' : '#22c55e'} strokeWidth="8" strokeDasharray={`${diagResult.riskScore * 2.64} 264`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-xl font-black">{diagResult.riskScore}</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{diagResult.primaryDiagnosis}</div>
                        <div className="text-sm text-hsTextSecondary">AI Confidence: <span className="text-hsTeal font-bold">{diagResult.confidence}%</span></div>
                        <div className={`text-sm font-bold ${riskColor(diagResult.riskLevel)}`}>Risk: {diagResult.riskLevel}</div>
                      </div>
                    </div>

                    {/* Key Indicators */}
                    <div className="mb-4">
                      <h3 className="text-xs uppercase tracking-widest text-hsTextSecondary mb-2">Key Indicators</h3>
                      <div className="flex flex-wrap gap-2">
                        {diagResult.keyIndicators?.map((k, i) => (
                          <span key={i} className="bg-hsTeal/15 text-hsTeal text-xs px-3 py-1 rounded-full">{k}</span>
                        ))}
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="mb-4">
                      <h3 className="text-xs uppercase tracking-widest text-hsTextSecondary mb-2">Explanation</h3>
                      <p className="text-sm text-hsTextSecondary leading-relaxed">{diagResult.explanation}</p>
                    </div>

                    {/* Actions */}
                    <div className="mb-4">
                      <h3 className="text-xs uppercase tracking-widest text-hsTextSecondary mb-2">Recommended Actions</h3>
                      <ul className="space-y-1.5">
                        {diagResult.recommendedActions?.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-hsTeal mt-0.5">✓</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 p-3 bg-hsSky/10 border border-hsSky/20 rounded-lg text-xs text-hsTextSecondary">
                      ⚕️ This diagnosis is AI-generated. Confidence: {diagResult.confidence}%. Always verify with a licensed physician.
                    </div>
                  </div>
                ) : (
                  <div className="bg-hsCard/20 border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full">
                    <div className="text-5xl mb-4 opacity-30">🔬</div>
                    <p className="text-hsTextSecondary text-sm">Fill in patient data and run AI diagnosis</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════ RISK ANALYTICS TAB ════════ */}
        {activeTab === 'analytics' && (
          <div>
            <h1 className="text-3xl font-black mb-8">Risk Analytics</h1>
            {!datasetResults ? (
              <div className="bg-hsCard/20 border border-white/5 rounded-2xl p-16 text-center">
                <div className="text-5xl mb-4 opacity-30">📈</div>
                <p className="text-hsTextSecondary">Upload and analyze a dataset first from the Dashboard tab</p>
              </div>
            ) : (
              <div>
                {datasetResults.note && (
                  <div className="mb-4 p-3 bg-hsWarning/10 border border-hsWarning/20 rounded-lg text-sm text-hsWarning">{datasetResults.note}</div>
                )}

                {/* Bar Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-hsCard/40 border border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold mb-4">Triage Distribution</h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Emergency', count: datasetResults.emergencyCount, color: 'bg-hsDanger', max: datasetResults.totalPatients },
                        { label: 'Urgent', count: datasetResults.urgentCount, color: 'bg-hsWarning', max: datasetResults.totalPatients },
                        { label: 'Routine', count: datasetResults.routineCount, color: 'bg-hsSafe', max: datasetResults.totalPatients },
                      ].map(b => (
                        <div key={b.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{b.label}</span>
                            <span className="font-bold">{b.count}</span>
                          </div>
                          <div className="h-4 bg-hsBgAlt rounded-full overflow-hidden">
                            <div className={`h-full ${b.color} rounded-full transition-all duration-1000`} style={{ width: `${b.max ? (b.count / b.max) * 100 : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-hsCard/40 border border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold mb-4">Risk Level Breakdown</h3>
                    <div className="space-y-4">
                      {['Critical', 'High', 'Medium', 'Low'].map(level => {
                        const count = datasetResults.results.filter(r => r.riskLevel === level).length;
                        return (
                          <div key={level}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className={riskColor(level)}>{level}</span>
                              <span className="font-bold">{count}</span>
                            </div>
                            <div className="h-4 bg-hsBgAlt rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-1000 ${level === 'Critical' ? 'bg-hsDanger' : level === 'High' ? 'bg-hsWarning' : level === 'Medium' ? 'bg-yellow-500' : 'bg-hsSafe'}`} style={{ width: `${datasetResults.totalPatients ? (count / datasetResults.totalPatients) * 100 : 0}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sortable Table */}
                <div className="bg-hsCard/40 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="p-4 flex items-center justify-between border-b border-white/5">
                    <h3 className="font-bold">All Patients</h3>
                    <button onClick={() => {
                      const blob = new Blob([JSON.stringify(datasetResults, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'healthsense-report.json'; a.click();
                    }} className="bg-hsTeal/10 text-hsTeal text-xs font-bold px-4 py-2 rounded-full hover:bg-hsTeal/20 transition-all">
                      ⬇ Export Report
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-xs text-hsTextSecondary uppercase tracking-wider">
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">Age</th>
                          <th className="py-3 px-4">Gender</th>
                          <th className="py-3 px-4">Diagnosis</th>
                          <th className="py-3 px-4 cursor-pointer hover:text-hsTeal" onClick={() => toggleSort('riskScore')}>
                            Risk Score {sortKey === 'riskScore' && (sortDir === 'desc' ? '↓' : '↑')}
                          </th>
                          <th className="py-3 px-4 cursor-pointer hover:text-hsTeal" onClick={() => toggleSort('triageClass')}>
                            Triage {sortKey === 'triageClass' && (sortDir === 'desc' ? '↓' : '↑')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedResults.map((r, i) => {
                          const tc = triageColor(r.triageClass);
                          return (
                            <tr key={i} className={`border-b border-white/5 ${r.triageClass === 'Emergency' ? 'bg-hsDanger/5' : r.triageClass === 'Urgent' ? 'bg-hsWarning/5' : ''}`}>
                              <td className="py-3 px-4 text-hsTextSecondary">{i + 1}</td>
                              <td className="py-3 px-4">{r.patientData?.age || '—'}</td>
                              <td className="py-3 px-4">{r.patientData?.gender || '—'}</td>
                              <td className="py-3 px-4 max-w-[200px] truncate">{r.primaryDiagnosis}</td>
                              <td className="py-3 px-4 font-bold">{r.riskScore}</td>
                              <td className="py-3 px-4">
                                <span className={`${tc.bg} ${tc.text} text-xs px-3 py-1 rounded-full font-bold`}>{r.triageClass}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════ TRIAGE CENTER TAB ════════ */}
        {activeTab === 'triage' && (
          <div>
            <h1 className="text-3xl font-black mb-8">Triage Center</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Panel */}
              <div className="bg-hsCard/40 border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">Quick Triage Input</h2>
                <textarea
                  value={triageInput}
                  onChange={e => setTriageInput(e.target.value)}
                  className="w-full bg-hsBgAlt border border-white/10 rounded-lg px-4 py-3 text-sm h-40 resize-none"
                  placeholder="Describe patient symptoms and vitals in plain text..."
                />
                <p className="text-xs text-hsTextSecondary mt-2 mb-4">
                  Example: "65yo male, chest pain, BP 180/110, sweating, shortness of breath"
                </p>
                <button
                  onClick={runTriage}
                  disabled={triageLoading || !triageInput.trim()}
                  className="w-full bg-hsTeal hover:bg-hsTealHover text-hsBg font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {triageLoading ? '⏳ Classifying...' : '🚑 Classify Patient'}
                </button>

                {/* Latest result */}
                {triageQueue[0] && (
                  <div className="mt-6 bg-hsBgAlt/60 rounded-xl p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`${triageColor(triageQueue[0].triageLevel).bg} px-4 py-2 rounded-full text-sm font-black uppercase`}>
                        {triageQueue[0].triageLevel}
                      </div>
                      <span className="text-sm font-medium">{triageQueue[0].timeToSee}</span>
                    </div>
                    <p className="text-sm text-hsTextSecondary mb-2">{triageQueue[0].reasoning}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {triageQueue[0].vitalsFlag?.map((v, i) => (
                        <span key={i} className="bg-hsDanger/15 text-hsDanger text-xs px-2 py-0.5 rounded-full">{v}</span>
                      ))}
                    </div>
                    <p className="text-xs text-hsTextSecondary">Suggested: <span className="text-hsTeal font-semibold">{triageQueue[0].suggestedDepartment}</span></p>
                  </div>
                )}
              </div>

              {/* Queue Panel */}
              <div className="bg-hsCard/40 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Triage Queue ({triageQueue.length})</h2>
                  {triageQueue.length > 0 && (
                    <button onClick={() => setTriageQueue([])} className="text-xs text-hsDanger hover:text-hsDanger/80 transition-colors">Clear Queue</button>
                  )}
                </div>
                {triageQueue.length === 0 ? (
                  <div className="text-center py-16 text-hsTextSecondary/50">
                    <div className="text-4xl mb-2">🚑</div>
                    <p className="text-sm">No patients triaged yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {triageQueue.map((t, i) => {
                      const tc = triageColor(t.triageLevel);
                      return (
                        <div key={i} className={`border ${tc.border} rounded-xl p-4 bg-hsBgAlt/40`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`${tc.bg} w-3 h-3 rounded-full`} />
                            <span className="text-sm font-bold">{t.triageLevel}</span>
                            <span className="text-xs text-hsTextSecondary ml-auto">{t.timeToSee}</span>
                          </div>
                          <p className="text-xs text-hsTextSecondary truncate">{t.input}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════ WORKFLOW MANAGER TAB ════════ */}
        {activeTab === 'workflow' && (
          <div>
            <h1 className="text-3xl font-black mb-8">Workflow Manager</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input */}
              <div className="bg-hsCard/40 border border-white/5 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4">Hospital Resource Data</h2>
                <div className="space-y-5">
                  {[
                    { key: 'totalBeds', label: 'Total Beds', min: 1, max: 500 },
                    { key: 'occupiedBeds', label: 'Occupied Beds', min: 0, max: 500 },
                    { key: 'availableDoctors', label: 'Available Doctors', min: 0, max: 100 },
                    { key: 'pendingAppointments', label: 'Pending Appointments', min: 0, max: 200 },
                    { key: 'emergencyCases', label: 'Emergency Cases', min: 0, max: 50 },
                  ].map(s => (
                    <div key={s.key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-hsTextSecondary">{s.label}</span>
                        <span className="font-bold text-hsTeal">{wfForm[s.key as keyof typeof wfForm]}</span>
                      </div>
                      <input
                        type="range"
                        min={s.min}
                        max={s.max}
                        value={wfForm[s.key as keyof typeof wfForm]}
                        onChange={e => setWfForm(f => ({ ...f, [s.key]: Number(e.target.value) }))}
                        className="w-full accent-hsTeal"
                      />
                    </div>
                  ))}
                </div>
                <button onClick={runWorkflow} disabled={wfLoading} className="mt-6 w-full bg-hsTeal hover:bg-hsTealHover text-hsBg font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                  {wfLoading ? '⏳ Optimizing...' : '⚙️ Optimize Workflow'}
                </button>
              </div>

              {/* Results */}
              <div>
                {wfResult ? (
                  <div className="bg-hsCard/40 border border-white/5 rounded-2xl p-6">
                    {/* Utilization Gauge */}
                    <div className="flex items-center gap-6 mb-6">
                      <div className="relative w-28 h-28">
                        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="8" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke={parseInt(wfResult.bedUtilization) >= 90 ? '#ef4444' : parseInt(wfResult.bedUtilization) >= 70 ? '#f97316' : '#22c55e'} strokeWidth="8" strokeDasharray={`${(parseInt(wfResult.bedUtilization) || 0) * 2.64} 264`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-lg font-black">{wfResult.bedUtilization}</div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Bed Utilization</h3>
                        <p className="text-sm text-hsTextSecondary">Est. Wait: {wfResult.estimatedWaitTime}</p>
                      </div>
                    </div>

                    {/* Resource Alert */}
                    <div className={`mb-6 p-3 rounded-lg text-sm font-bold ${
                      wfResult.resourceAlert === 'critical' ? 'bg-hsDanger/15 text-hsDanger border border-hsDanger/20' :
                      wfResult.resourceAlert === 'warning' ? 'bg-hsWarning/15 text-hsWarning border border-hsWarning/20' :
                      'bg-hsSafe/15 text-hsSafe border border-hsSafe/20'
                    }`}>
                      {wfResult.resourceAlert === 'critical' ? '🚨' : wfResult.resourceAlert === 'warning' ? '⚠️' : '✅'} Resource Status: {wfResult.resourceAlert?.toUpperCase()}
                    </div>

                    {/* Priority Actions */}
                    <div className="mb-4">
                      <h3 className="text-xs uppercase tracking-widest text-hsDanger mb-2">Priority Actions</h3>
                      <ul className="space-y-2">
                        {wfResult.priorityActions?.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm bg-hsDanger/10 border border-hsDanger/20 rounded-lg p-3">
                            <span className="text-hsDanger font-bold">!</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* All Recommendations */}
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-hsTextSecondary mb-2">Recommendations</h3>
                      <ul className="space-y-1.5">
                        {wfResult.recommendations?.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-hsTeal mt-0.5">✓</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="bg-hsCard/20 border border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full">
                    <div className="text-5xl mb-4 opacity-30">⚙️</div>
                    <p className="text-hsTextSecondary text-sm">Adjust hospital data and run workflow optimization</p>
                  </div>
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
