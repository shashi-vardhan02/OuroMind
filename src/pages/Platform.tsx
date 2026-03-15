import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HOSPITALS } from '../data/hospitalData';
import type { Hospital } from '../data/hospitalData';
import { checkResourceAvailability, findBestAlternativeHospital } from '../utils/resourceChecker';
import type { CheckResult } from '../utils/resourceChecker';
import { parseCSV, fuzzyMapColumns, FIELD_ALIASES } from '../utils/dataUtils';

// ── Types ─────────────────────────────────────────────────────
interface AIAnalysis { patientSummary: string; urgency: string; urgencyReason: string; diagnosis: string; requiredDoctors: string[]; requiredMedications: string[]; requiredEquipment: string[]; requiresICU: boolean; estimatedStay: string; criticalNeeds: string[]; error?: string; }
interface TreatmentPlan { treatmentPlan: { step: number; action: string; timeframe: string; responsible: string }[]; medicationSchedule: { medication: string; dose: string; frequency: string; duration: string }[]; monitoringPlan: string[]; expectedOutcome: string; dischargeConditions: string[]; }
interface Referral { referralLetter: string; urgentTransfer: boolean; transferReason: string; handoverNotes: string[]; }
interface PatientRecord { id: string; name: string; age: string; gender: string; contact: string; address: string; emergencyContact: string; condition: string; vitals: string; analysis?: AIAnalysis; check?: CheckResult; status: 'pending' | 'admitted' | 'partial' | 'referred'; altHospital?: Hospital; treatmentPlan?: TreatmentPlan; referral?: Referral; }

// ── Quick symptom tags ────────────────────────────────────────
const SYMPTOM_TAGS = ['Chest Pain', 'Fever', 'Difficulty Breathing', 'Head Injury', 'Diabetes', 'Fracture', 'Stroke Symptoms', 'Unconscious', 'Abdominal Pain', 'Seizure'];

const tabs = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'register', icon: '🔬', label: 'AI Diagnostics' },
  { id: 'queue', icon: '📈', label: 'Predictive Analytics' },
  { id: 'remote', icon: '📶', label: 'Remote Care' },
  { id: 'security', icon: '🛡️', label: 'Security Vault' },
  { id: 'inventory', icon: '⚙️', label: 'Workflow AI' },
  { id: 'import', icon: '📥', label: 'Import Dataset' },
] as const;

type TabId = typeof tabs[number]['id'];

function urgencyColor(u: string) {
  const l = u?.toLowerCase();
  if (l === 'emergency') return { bg: 'bg-hsDanger', text: 'text-hsDanger', glow: 'pulse-danger', border: 'border-hsDanger/30' };
  if (l === 'urgent') return { bg: 'bg-hsWarning', text: 'text-hsWarning', glow: 'pulse-warning', border: 'border-hsWarning/30' };
  return { bg: 'bg-hsSafe', text: 'text-hsSafe', glow: '', border: 'border-hsSafe/30' };
}

let idCounter = 1;
function genId() { return `HS-2026-${String(idCounter++).padStart(4, '0')}`; }

const Platform = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [hospitals, setHospitals] = useState<Hospital[]>(JSON.parse(JSON.stringify(HOSPITALS)));
  const [currentHospitalId, setCurrentHospitalId] = useState('main');
  const currentHospital = hospitals.find(h => h.id === currentHospitalId)!;

  // Patient registration
  const [pf, setPf] = useState({ name: '', age: '', gender: 'Male', contact: '', address: '', emergencyContact: '', symptoms: '', bp: '', hr: '', temp: '', o2: '' });
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzePhase, setAnalyzePhase] = useState('');

  // Active patient (for resource check view)
  const [activePatient, setActivePatient] = useState<PatientRecord | null>(null);
  const [checkAnimIdx, setCheckAnimIdx] = useState(-1);
  const [showCheckResult, setShowCheckResult] = useState(false);
  const [tpLoading, setTpLoading] = useState(false);
  const [refLoading, setRefLoading] = useState(false);

  // Inventory edit
  const [invTab, setInvTab] = useState<'doctors' | 'medications' | 'equipment'>('doctors');

  // Persistence: Load from localStorage
  useEffect(() => {
    const savedPatients = localStorage.getItem('hs_patients');
    const savedHospitals = localStorage.getItem('hs_hospitals');
    if (savedPatients) setPatients(JSON.parse(savedPatients));
    if (savedHospitals) setHospitals(JSON.parse(savedHospitals));
  }, []);

  // Persistence: Save to localStorage
  useEffect(() => {
    localStorage.setItem('hs_patients', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('hs_hospitals', JSON.stringify(hospitals));
  }, [hospitals]);

  // Import Dataset State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  // ── Analyze Patient ─────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!pf.name || !pf.symptoms) return;
    setAnalyzing(true);
    const patientId = genId();
    const vitals = `BP: ${pf.bp}, HR: ${pf.hr}, Temp: ${pf.temp}, O2: ${pf.o2}`;
    const conditionText = `${pf.name}, ${pf.age}${pf.gender[0]}, ${pf.symptoms}. Vitals: ${vitals}`;

    setAnalyzePhase('🔬 Analyzing patient condition...');
    try {
      const res = await fetch('/api/analyze-patient', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientData: conditionText }) });
      const analysis: AIAnalysis = await res.json();
      if (analysis.error) throw new Error(analysis.error as string);

      setAnalyzePhase('🏥 Checking hospital inventory...');
      await new Promise(r => setTimeout(r, 500));

      const check = checkResourceAvailability(hospitals, currentHospitalId, analysis.requiredDoctors, analysis.requiredMedications, analysis.requiredEquipment, analysis.requiresICU);
      let status: PatientRecord['status'] = check.allAvailable ? 'admitted' : 'partial';
      let altHospital: Hospital | undefined;

      if (!check.allAvailable) {
        const alt = findBestAlternativeHospital(
          hospitals,
          check.missingDoctors.map(d => d.required),
          check.missingMedications.map(m => m.required),
          check.missingEquipment.map(e => e.required),
          currentHospitalId
        );
        if (alt) { altHospital = alt; status = 'referred'; }
      }

      const record: PatientRecord = { id: patientId, name: pf.name, age: pf.age, gender: pf.gender, contact: pf.contact, address: pf.address, emergencyContact: pf.emergencyContact, condition: pf.symptoms, vitals, analysis, check, status, altHospital };
      setPatients(prev => [record, ...prev]);
      setActivePatient(record);
      setCheckAnimIdx(-1);
      setShowCheckResult(false);
      setPf({ name: '', age: '', gender: 'Male', contact: '', address: '', emergencyContact: '', symptoms: '', bp: '', hr: '', temp: '', o2: '' });
      setActiveTab('register');

      // Animate check items
      const totalItems = (analysis.requiredDoctors?.length || 0) + (analysis.requiredMedications?.length || 0) + (analysis.requiredEquipment?.length || 0);
      for (let i = 0; i <= totalItems; i++) {
        await new Promise(r => setTimeout(r, 400));
        setCheckAnimIdx(i);
      }
      setShowCheckResult(true);
    } catch (err) {
      alert('Analysis failed: ' + (err as Error).message);
    }
    setAnalyzing(false);
    setAnalyzePhase('');
  };

  // ── Generate Treatment Plan ─────────────────────────────────
  const handleTreatmentPlan = async (patient: PatientRecord) => {
    setTpLoading(true);
    try {
      const res = await fetch('/api/treatment-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        patient: { name: patient.name, age: patient.age, gender: patient.gender, condition: patient.condition, diagnosis: patient.analysis?.diagnosis },
        assignedDoctors: patient.check?.doctorResults.filter(d => d.available).map(d => d.detail) || [],
        assignedMedications: patient.check?.medicationResults.filter(m => m.available).map(m => m.required) || [],
        assignedEquipment: patient.check?.equipmentResults.filter(e => e.available).map(e => e.required) || [],
      }) });
      const tp: TreatmentPlan = await res.json();
      const updated = { ...patient, treatmentPlan: tp };
      setActivePatient(updated);
      setPatients(prev => prev.map(p => p.id === patient.id ? updated : p));
    } catch { alert('Failed to generate treatment plan.'); }
    setTpLoading(false);
  };

  // ── Generate Referral ───────────────────────────────────────
  const handleReferral = async (patient: PatientRecord) => {
    if (!patient.altHospital) return;
    setRefLoading(true);
    try {
      const res = await fetch('/api/generate-referral', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        patient: { name: patient.name, age: patient.age, gender: patient.gender, condition: patient.condition },
        missingResources: { doctors: patient.check?.missingDoctors.map(d => d.required), medications: patient.check?.missingMedications.map(m => m.required), equipment: patient.check?.missingEquipment.map(e => e.required) },
        targetHospital: { name: patient.altHospital.name, location: patient.altHospital.location },
      }) });
      const ref: Referral = await res.json();
      const updated = { ...patient, referral: ref };
      setActivePatient(updated);
      setPatients(prev => prev.map(p => p.id === patient.id ? updated : p));
    } catch { alert('Failed to generate referral.'); }
    setRefLoading(false);
  };

  // ── Inventory toggles ──────────────────────────────────────
  const toggleDoctor = (docId: string) => {
    setHospitals(prev => prev.map(h => h.id === currentHospitalId ? { ...h, doctors: h.doctors.map(d => d.id === docId ? { ...d, available: !d.available } : d) } : h));
  };
  const toggleMed = (medId: string) => {
    setHospitals(prev => prev.map(h => h.id === currentHospitalId ? { ...h, medications: h.medications.map(m => m.id === medId ? { ...m, inStock: !m.inStock, quantity: m.inStock ? 0 : 100 } : m) } : h));
  };
  const toggleEquip = (eqId: string) => {
    setHospitals(prev => prev.map(h => h.id === currentHospitalId ? { ...h, equipment: h.equipment.map(e => e.id === eqId ? { ...e, occupied: e.available ? !e.occupied : e.occupied, available: !e.available ? true : e.available } : e) } : h));
  };

  // ── Import Logic ──────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    const text = await file.text();
    let data : any[] = [];
    if (file.name.endsWith('.json')) {
      data = JSON.parse(text);
    } else {
      data = parseCSV(text);
    }
    setRawRows(data);
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      setHeaders(keys);
      setMapping(fuzzyMapColumns(keys));
    }
  };

  const processBatch = async () => {
    if (rawRows.length === 0) return;
    setIsProcessingBatch(true);
    setBatchProgress({ current: 0, total: rawRows.length });

    const newRecords: PatientRecord[] = [];
    const CHUNK_SIZE = 5; // Process 5 patients at a time

    for (let i = 0; i < rawRows.length; i += CHUNK_SIZE) {
      const chunk = rawRows.slice(i, i + CHUNK_SIZE);
      
      const chunkPromises = chunk.map(async (row, idx) => {
        const name = row[mapping.name || ''] || 'Unknown Patient';
        const age = row[mapping.age || ''] || '';
        const gender = row[mapping.gender || ''] || 'Other';
        const symptoms = row[mapping.symptoms || ''] || '';
        const vitals = `BP: ${row[mapping.bp || ''] || '?'}, HR: ${row[mapping.hr || ''] || '?'}, Temp: ${row[mapping.temp || ''] || '?'}, O2: ${row[mapping.o2 || ''] || '?'}`;
        const conditionText = `${name}, ${age}${gender[0]}, ${symptoms}. Vitals: ${vitals}`;

        try {
          const res = await fetch('/api/analyze-patient', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientData: conditionText }) });
          const analysis: AIAnalysis = await res.json();
          
          const check = checkResourceAvailability(hospitals, currentHospitalId, analysis.requiredDoctors, analysis.requiredMedications, analysis.requiredEquipment, analysis.requiresICU);
          let status: PatientRecord['status'] = check.allAvailable ? 'admitted' : 'partial';
          let altHospital: Hospital | undefined;

          if (!check.allAvailable) {
            const alt = findBestAlternativeHospital(hospitals, check.missingDoctors.map(d => d.required), check.missingMedications.map(m => m.required), check.missingEquipment.map(e => e.required), currentHospitalId);
            if (alt) { altHospital = alt; status = 'referred'; }
          }

          return { id: genId(), name, age, gender, contact: '', address: '', emergencyContact: '', condition: symptoms, vitals, analysis, check, status, altHospital } as PatientRecord;
        } catch (err) {
          console.error('Batch error:', err);
          return null;
        }
      });

      const results = await Promise.all(chunkPromises);
      results.forEach(r => { if (r) newRecords.push(r); });
      
      setBatchProgress(prev => ({ ...prev, current: Math.min(prev.total, i + CHUNK_SIZE) }));
    }

    setPatients(prev => [...newRecords, ...prev]);
    setIsProcessingBatch(false);
    setRawRows([]);
    setImportFile(null);
    setActiveTab('queue');
  };

  // ── Stats ────────────────────────────────────────────────────
  const stats = {
    total: patients.length,
    admitted: patients.filter(p => p.status === 'admitted').length,
    referred: patients.filter(p => p.status === 'referred').length,
    bedsAvail: currentHospital.beds.total - currentHospital.beds.occupied,
  };

  // ── All check items flattened for animation ─────────────────
  const allCheckItems = activePatient?.analysis ? [
    ...(activePatient.analysis.requiredDoctors || []).map(d => ({ type: '👨‍⚕️', name: d, result: activePatient.check?.doctorResults.find(r => r.required === d) })),
    ...(activePatient.analysis.requiredMedications || []).map(m => ({ type: '💊', name: m, result: activePatient.check?.medicationResults.find(r => r.required === m) })),
    ...(activePatient.analysis.requiredEquipment || []).map(e => ({ type: '🔧', name: e, result: activePatient.check?.equipmentResults.find(r => r.required === e) })),
  ] : [];

  return (
    <div className="flex h-screen bg-hsBg text-white overflow-hidden">
      {/* ── SIDEBAR ───────────────────────────────────────────── */}
      <aside className="w-60 bg-hsBgAlt border-r border-white/5 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-hsSafe opacity-75"/><span className="relative rounded-full h-2 w-2 bg-hsSafe"/></span>
            <span className="text-[10px] font-bold text-hsSafe uppercase tracking-wider">System Live</span>
          </div>
          <Link to="/" className="flex items-center gap-2 text-sm font-bold">
            <svg className="w-4 h-4 text-hsTeal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <span>Health<span className="text-hsTeal">Sense</span> AI</span>
          </Link>
          {/* Hospital selector */}
          <select value={currentHospitalId} onChange={e => setCurrentHospitalId(e.target.value)} className="mt-3 w-full bg-hsBg border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white">
            {hospitals.map(h => <option key={h.id} value={h.id}>📍 {h.name}</option>)}
          </select>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setActivePatient(null); }}
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { icon: '👥', label: 'Patients Today', val: stats.total, color: 'hsTeal' },
                { icon: '✅', label: 'Resources Found', val: stats.admitted, color: 'hsSafe' },
                { icon: '↗️', label: 'Transferred', val: stats.referred, color: 'hsWarning' },
                { icon: '🛏', label: 'Beds Available', val: stats.bedsAvail, color: stats.bedsAvail < 10 ? 'hsDanger' : 'hsSky' },
              ].map((m, i) => (
                <div key={i} className={`hs-card p-4 ${m.color === 'hsDanger' ? 'pulse-danger !border-hsDanger/30' : ''}`}>
                  <div className="flex items-center justify-between mb-2"><span className="text-xl">{m.icon}</span><span className={`text-[9px] font-bold text-${m.color} uppercase`}>Live</span></div>
                  <div className={`text-3xl font-black text-${m.color}`}>{m.val}</div>
                  <div className="text-[10px] text-hsTextSecondary mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent Activity */}
              <div className="hs-card p-5">
                <h2 className="text-sm font-bold mb-3">Recent Patient Activity</h2>
                {patients.length === 0 ? (
                  <div className="text-center py-12"><div className="text-4xl mb-2 opacity-20">👤</div><p className="text-hsTextSecondary text-xs">No patients registered yet</p><button onClick={() => setActiveTab('register')} className="mt-3 text-hsTeal text-xs font-bold hover:underline">Register First Patient →</button></div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {patients.map(p => (
                      <button key={p.id} onClick={() => { setActivePatient(p); setShowCheckResult(true); setCheckAnimIdx(100); setActiveTab('register'); }}
                        className="w-full text-left bg-hsBg/40 rounded-lg p-3 border border-white/5 hover:border-hsTeal/20 transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{p.name}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.status === 'admitted' ? 'bg-hsSafe/15 text-hsSafe' : p.status === 'referred' ? 'bg-hsDanger/15 text-hsDanger' : 'bg-hsWarning/15 text-hsWarning'}`}>
                            {p.status === 'admitted' ? '✅ Admitted' : p.status === 'referred' ? '❌ Referred' : '⚠️ Partial'}
                          </span>
                        </div>
                        <p className="text-[10px] text-hsTextSecondary truncate">{p.condition}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hospital Status */}
              <div className="hs-card p-5">
                <h2 className="text-sm font-bold mb-3">Hospital Resource Status</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Doctors Available', val: `${currentHospital.doctors.filter(d => d.available).length}/${currentHospital.doctors.length}`, pct: currentHospital.doctors.filter(d=>d.available).length/currentHospital.doctors.length*100, color: 'hsTeal' },
                    { label: 'Medications In Stock', val: `${currentHospital.medications.filter(m => m.inStock).length}/${currentHospital.medications.length}`, pct: currentHospital.medications.filter(m=>m.inStock).length/currentHospital.medications.length*100, color: 'hsSky' },
                    { label: 'Equipment Available', val: `${currentHospital.equipment.filter(e => e.available && !e.occupied).length}/${currentHospital.equipment.length}`, pct: currentHospital.equipment.filter(e=>e.available&&!e.occupied).length/currentHospital.equipment.length*100, color: 'hsTeal' },
                    { label: 'ICU Beds Free', val: `${currentHospital.beds.icu - currentHospital.beds.icuOccupied}/${currentHospital.beds.icu}`, pct: (currentHospital.beds.icu-currentHospital.beds.icuOccupied)/currentHospital.beds.icu*100, color: currentHospital.beds.icu - currentHospital.beds.icuOccupied <= 1 ? 'hsDanger' : 'hsSafe' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1"><span className="text-hsTextSecondary">{s.label}</span><span className={`font-bold text-${s.color}`}>{s.val}</span></div>
                      <div className="h-2.5 bg-hsBg rounded-full overflow-hidden"><div className={`h-full bg-${s.color} rounded-full transition-all`} style={{ width: `${s.pct}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════ REGISTER PATIENT ════════ */}
        {activeTab === 'register' && !activePatient && (
          <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-black mb-6">👤 Register Patient</h1>
            <div className="hs-card p-6 space-y-5">
              <h2 className="text-sm font-bold text-hsTeal">Step 1 — Patient Information</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-hsTextSecondary block mb-1">Patient Name *</label><input value={pf.name} onChange={e=>setPf(f=>({...f,name:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-hsTeal/40 focus:outline-none" placeholder="Full name"/></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] text-hsTextSecondary block mb-1">Age</label><input value={pf.age} onChange={e=>setPf(f=>({...f,age:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 45"/></div>
                  <div><label className="text-[10px] text-hsTextSecondary block mb-1">Gender</label><select value={pf.gender} onChange={e=>setPf(f=>({...f,gender:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm"><option>Male</option><option>Female</option><option>Other</option></select></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-[10px] text-hsTextSecondary block mb-1">Contact</label><input value={pf.contact} onChange={e=>setPf(f=>({...f,contact:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="Phone"/></div>
                <div><label className="text-[10px] text-hsTextSecondary block mb-1">Address / Village</label><input value={pf.address} onChange={e=>setPf(f=>({...f,address:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="Address"/></div>
                <div><label className="text-[10px] text-hsTextSecondary block mb-1">Emergency Contact</label><input value={pf.emergencyContact} onChange={e=>setPf(f=>({...f,emergencyContact:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="Emergency"/></div>
              </div>

              <h2 className="text-sm font-bold text-hsTeal pt-2">Step 2 — Condition Description</h2>
              <div>
                <label className="text-[10px] text-hsTextSecondary block mb-1">Describe symptoms and condition *</label>
                <textarea value={pf.symptoms} onChange={e=>setPf(f=>({...f,symptoms:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-xl px-4 py-3 text-sm h-28 resize-none focus:border-hsTeal/40 focus:outline-none" placeholder="Describe patient's symptoms and condition in detail..." />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SYMPTOM_TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => setPf(f => ({ ...f, symptoms: f.symptoms + (f.symptoms ? ', ' : '') + tag }))}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-hsTeal/10 text-hsTeal border border-hsTeal/20 hover:bg-hsTeal/20 transition-all">{tag}</button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div><label className="text-[10px] text-hsTextSecondary block mb-1">Blood Pressure</label><input value={pf.bp} onChange={e=>setPf(f=>({...f,bp:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="120/80"/></div>
                <div><label className="text-[10px] text-hsTextSecondary block mb-1">Heart Rate</label><input value={pf.hr} onChange={e=>setPf(f=>({...f,hr:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="72 bpm"/></div>
                <div><label className="text-[10px] text-hsTextSecondary block mb-1">Temperature</label><input value={pf.temp} onChange={e=>setPf(f=>({...f,temp:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="98.6°F"/></div>
                <div><label className="text-[10px] text-hsTextSecondary block mb-1">O₂ Saturation</label><input value={pf.o2} onChange={e=>setPf(f=>({...f,o2:e.target.value}))} className="w-full bg-hsBg border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="98%"/></div>
              </div>
              <button type="button" onClick={handleAnalyze} disabled={analyzing || !pf.name || !pf.symptoms}
                className="w-full bg-hsTeal hover:bg-hsTealHover text-hsBg font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-40 shadow-[0_0_15px_rgba(0,201,167,0.15)]">
                {analyzing ? <span className="scan-anim inline-block w-full">{analyzePhase}</span> : '🔬 Analyze & Check Resources'}
              </button>
            </div>
          </div>
        )}

        {/* ════════ RESOURCE CHECK RESULT ════════ */}
        {activeTab === 'register' && activePatient && (
          <div className="p-6 max-w-5xl mx-auto">
            <button type="button" onClick={() => setActivePatient(null)} className="text-xs text-hsTeal hover:underline mb-4 flex items-center gap-1">← Register another patient</button>

            {/* Patient Banner */}
            {activePatient.analysis && (
              <div className={`${urgencyColor(activePatient.analysis.urgency).bg} rounded-2xl p-5 mb-5 ${urgencyColor(activePatient.analysis.urgency).glow}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs opacity-80 mb-1">{activePatient.id}</div>
                    <div className="text-xl font-black">{activePatient.name} | {activePatient.age}{activePatient.gender[0]}</div>
                    <div className="text-sm opacity-90 mt-0.5">{activePatient.analysis.diagnosis}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black">{activePatient.analysis.urgency === 'Emergency' ? '🚨' : activePatient.analysis.urgency === 'Urgent' ? '⚠️' : '✅'} {activePatient.analysis.urgency}</div>
                    <div className="text-xs opacity-80 mt-1">{activePatient.analysis.urgencyReason}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Required Resources */}
            {activePatient.analysis && (
              <div className="hs-card p-5 mb-5">
                <h3 className="text-sm font-bold mb-3">Required Resources (AI Determined)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div><h4 className="text-[10px] text-hsTextSecondary uppercase tracking-wider mb-2">👨‍⚕️ Doctors</h4>{activePatient.analysis.requiredDoctors?.map((d,i) => <div key={i} className="text-xs mb-1">• {d}</div>)}</div>
                  <div><h4 className="text-[10px] text-hsTextSecondary uppercase tracking-wider mb-2">💊 Medications</h4>{activePatient.analysis.requiredMedications?.map((m,i) => <div key={i} className="text-xs mb-1">• {m}</div>)}</div>
                  <div><h4 className="text-[10px] text-hsTextSecondary uppercase tracking-wider mb-2">🔧 Equipment</h4>{activePatient.analysis.requiredEquipment?.map((e,i) => <div key={i} className="text-xs mb-1">• {e}</div>)}{activePatient.analysis.requiresICU && <div className="text-xs text-hsDanger font-bold mt-1">⚠️ ICU Required</div>}</div>
                </div>
                <div className="mt-3 text-[10px] text-hsTextSecondary">Est. Stay: {activePatient.analysis.estimatedStay} | Critical: {activePatient.analysis.criticalNeeds?.join(', ')}</div>
              </div>
            )}

            {/* Availability Check Animation */}
            <div className="hs-card p-5 mb-5">
              <h3 className="text-sm font-bold mb-3">Availability Check — {currentHospital.name}</h3>
              <div className="space-y-2">
                {allCheckItems.map((item, i) => (
                  <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg text-xs transition-all duration-300 ${i <= checkAnimIdx ? (item.result?.available ? 'bg-hsSafe/5 border border-hsSafe/15' : 'bg-hsDanger/5 border border-hsDanger/15') : 'bg-hsBg/40 border border-white/5 opacity-40'}`}>
                    <span>{item.type} {item.name}</span>
                    {i <= checkAnimIdx ? (
                      <span className={`font-bold ${item.result?.available ? 'text-hsSafe' : 'text-hsDanger'}`}>
                        {item.result?.available ? `✅ ${item.result.detail}` : `❌ ${item.result?.detail}`}
                      </span>
                    ) : <span className="text-hsTextSecondary/40">checking...</span>}
                  </div>
                ))}
                {activePatient.analysis?.requiresICU && (
                  <div className={`flex items-center justify-between py-2 px-3 rounded-lg text-xs ${checkAnimIdx >= allCheckItems.length ? (activePatient.check?.icuAvailable ? 'bg-hsSafe/5 border border-hsSafe/15' : 'bg-hsDanger/5 border border-hsDanger/15') : 'bg-hsBg/40 border border-white/5 opacity-40'}`}>
                    <span>🛏 ICU Bed</span>
                    {checkAnimIdx >= allCheckItems.length ? <span className={`font-bold ${activePatient.check?.icuAvailable ? 'text-hsSafe' : 'text-hsDanger'}`}>{activePatient.check?.icuAvailable ? '✅ Available' : '❌ Full'}</span> : <span className="text-hsTextSecondary/40">checking...</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Outcome Banner */}
            {showCheckResult && activePatient.check && (
              <div className="space-y-4">
                {activePatient.check.allAvailable ? (
                  <div className="hs-card !border-hsSafe/30 p-5">
                    <div className="text-center mb-4"><div className="text-3xl mb-1">✅</div><div className="text-xl font-black text-hsSafe">ALL RESOURCES AVAILABLE</div><p className="text-xs text-hsTextSecondary mt-1">Patient can be treated at {currentHospital.name}</p></div>
                    <div className="flex gap-3 justify-center">
                      <button type="button" onClick={() => handleTreatmentPlan(activePatient)} disabled={tpLoading} className="bg-hsTeal hover:bg-hsTealHover text-hsBg font-bold px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-40">{tpLoading ? '⏳ Generating...' : '📋 Generate Treatment Plan'}</button>
                    </div>
                  </div>
                ) : activePatient.altHospital ? (
                  <div className="hs-card !border-hsDanger/30 p-5">
                    <div className="text-center mb-4"><div className="text-3xl mb-1">❌</div><div className="text-xl font-black text-hsDanger">RESOURCES NOT FULLY AVAILABLE</div><p className="text-xs text-hsTextSecondary mt-1">{activePatient.check.missingCount} resource(s) missing</p></div>
                    <div className="bg-hsTeal/8 border border-hsTeal/20 rounded-xl p-4 mb-4">
                      <div className="text-sm font-bold text-hsTeal mb-1">🏥 Recommended: {activePatient.altHospital.name}</div>
                      <div className="text-xs text-hsTextSecondary">📍 {activePatient.altHospital.location}</div>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button type="button" onClick={() => handleReferral(activePatient)} disabled={refLoading} className="bg-hsDanger hover:bg-hsDanger/80 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-40">{refLoading ? '⏳ Generating...' : '📄 Generate Referral Letter'}</button>
                      <button type="button" onClick={() => handleTreatmentPlan(activePatient)} disabled={tpLoading} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-40">{tpLoading ? '⏳...' : 'Proceed Without Missing'}</button>
                    </div>
                  </div>
                ) : (
                  <div className="hs-card !border-hsWarning/30 p-5 text-center">
                    <div className="text-3xl mb-1">⚠️</div>
                    <div className="text-xl font-black text-hsWarning">PARTIAL RESOURCES</div>
                    <p className="text-xs text-hsTextSecondary mt-1">{activePatient.check.missingCount} resource(s) missing. No branch has all required items.</p>
                    <button type="button" onClick={() => handleTreatmentPlan(activePatient)} disabled={tpLoading} className="mt-4 bg-hsWarning hover:bg-hsWarning/80 text-white font-bold px-6 py-2.5 rounded-xl text-sm">{tpLoading ? '⏳...' : 'Proceed With Available Resources'}</button>
                  </div>
                )}

                {/* Referral Letter */}
                {activePatient.referral && (
                  <div className="hs-card p-5">
                    <h3 className="text-sm font-bold mb-3">📄 Medical Referral Letter</h3>
                    <div className="bg-hsBg rounded-xl p-5 border border-white/10 text-sm text-hsTextSecondary leading-relaxed whitespace-pre-wrap">{activePatient.referral.referralLetter}</div>
                    {activePatient.referral.handoverNotes && (
                      <div className="mt-3"><h4 className="text-[10px] uppercase tracking-widest text-hsTextSecondary mb-2">Handover Notes</h4><ul className="space-y-1">{activePatient.referral.handoverNotes.map((n,i) => <li key={i} className="text-xs flex items-start gap-2"><span className="text-hsTeal">•</span>{n}</li>)}</ul></div>
                    )}
                    <button type="button" onClick={() => { const b = new Blob([activePatient.referral!.referralLetter], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `referral-${activePatient.id}.txt`; a.click(); }} className="mt-3 text-hsTeal text-xs font-bold hover:underline">📥 Download Referral</button>
                  </div>
                )}

                {/* Treatment Plan */}
                {activePatient.treatmentPlan && (
                  <div className="hs-card p-5">
                    <h3 className="text-sm font-bold mb-3">📋 Treatment Plan</h3>
                    <div className="space-y-2 mb-4">
                      {activePatient.treatmentPlan.treatmentPlan?.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 bg-hsBg/40 rounded-lg p-3 border border-white/5">
                          <div className="w-7 h-7 rounded-lg bg-hsTeal/15 text-hsTeal flex items-center justify-center text-xs font-black shrink-0">{step.step}</div>
                          <div><div className="text-xs font-bold">{step.action}</div><div className="text-[10px] text-hsTextSecondary mt-0.5">{step.timeframe} · {step.responsible}</div></div>
                        </div>
                      ))}
                    </div>
                    {activePatient.treatmentPlan.medicationSchedule && (
                      <div className="mb-4"><h4 className="text-[10px] uppercase tracking-widest text-hsTextSecondary mb-2">Medication Schedule</h4>
                        <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-white/10 text-hsTextSecondary"><th className="py-2 px-2 text-left">Medication</th><th className="py-2 px-2 text-left">Dose</th><th className="py-2 px-2 text-left">Frequency</th><th className="py-2 px-2 text-left">Duration</th></tr></thead><tbody>{activePatient.treatmentPlan.medicationSchedule.map((m,i) => <tr key={i} className="border-b border-white/5"><td className="py-2 px-2">{m.medication}</td><td className="py-2 px-2">{m.dose}</td><td className="py-2 px-2">{m.frequency}</td><td className="py-2 px-2">{m.duration}</td></tr>)}</tbody></table></div>
                      </div>
                    )}
                    <div className="text-xs text-hsTextSecondary"><strong className="text-white">Prognosis:</strong> {activePatient.treatmentPlan.expectedOutcome}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════ PATIENT QUEUE ════════ */}
        {activeTab === 'queue' && (
          <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-black mb-6">📋 Patient Queue</h1>
            {patients.length === 0 ? (
              <div className="hs-card p-16 text-center"><div className="text-5xl mb-3 opacity-20">📋</div><p className="text-hsTextSecondary text-sm">No patients registered yet</p></div>
            ) : (
              <div className="hs-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-white/10 text-[10px] text-hsTextSecondary uppercase tracking-wider">
                      <th className="py-3 px-4 text-left">Patient ID</th><th className="py-3 px-4 text-left">Name</th><th className="py-3 px-4 text-left">Condition</th><th className="py-3 px-4 text-left">Status</th><th className="py-3 px-4 text-left">Route / Target</th><th className="py-3 px-4 text-left">Action</th>
                    </tr></thead>
                    <tbody>
                      {[...patients].sort((a, b) => { const o: Record<string,number> = { Emergency: 3, Urgent: 2, Routine: 1 }; return (o[b.analysis?.urgency || ''] || 0) - (o[a.analysis?.urgency || ''] || 0); }).map(p => (
                        <tr key={p.id} className={`border-b border-white/5 ${p.analysis?.urgency === 'Emergency' ? 'bg-hsDanger/5' : ''}`}>
                          <td className="py-3 px-4 font-mono text-hsTextSecondary">{p.id}</td>
                          <td className="py-3 px-4 font-bold">{p.name} <span className="text-[9px] text-hsTextSecondary block font-normal">{p.age}{p.gender[0]}</span></td>
                          <td className="py-3 px-4 max-w-[200px] truncate text-hsTextSecondary">{p.analysis?.diagnosis || p.condition}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${p.status === 'admitted' ? 'bg-hsSafe/15 text-hsSafe' : p.status === 'referred' ? 'bg-hsDanger/15 text-hsDanger' : 'bg-hsWarning/15 text-hsWarning'}`}>
                              {p.status === 'admitted' ? '🟢 Admitted' : p.status === 'referred' ? '🔴 Referred' : '🟡 Partial'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                             <div className="text-[10px]">
                               {p.status === 'admitted' ? (
                                 <span className="text-hsSafe">📍 {currentHospital.name}</span>
                               ) : p.altHospital ? (
                                 <div className="flex flex-col">
                                   <span className="text-hsDanger">↗️ Transfer to:</span>
                                   <span className="font-bold">{p.altHospital.name}</span>
                                 </div>
                               ) : <span className="text-hsWarning">No ideal branch found</span>}
                             </div>
                          </td>
                          <td className="py-3 px-4"><button type="button" onClick={() => { setActivePatient(p); setShowCheckResult(true); setCheckAnimIdx(100); setActiveTab('register'); }} className="bg-hsTeal/10 hover:bg-hsTeal/20 text-hsTeal text-[10px] font-bold px-3 py-1 rounded-lg border border-hsTeal/20 transition-all">View Details</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════ HOSPITAL INVENTORY ════════ */}
        {activeTab === 'inventory' && (
          <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-black">🏥 Hospital Inventory</h1>
              <div className="text-[10px] text-hsTextSecondary bg-hsTeal/10 border border-hsTeal/20 px-3 py-1 rounded-full">Changes affect resource checks in real-time</div>
            </div>

            <div className="flex gap-2 mb-4">
              {(['doctors', 'medications', 'equipment'] as const).map(t => (
                <button key={t} type="button" onClick={() => setInvTab(t)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${invTab === t ? 'bg-hsTeal/10 text-hsTeal border border-hsTeal/20' : 'text-hsTextSecondary hover:bg-white/5 border border-transparent'}`}>
                  {t === 'doctors' ? '👨‍⚕️ Doctors' : t === 'medications' ? '💊 Medications' : '🔧 Equipment'}
                </button>
              ))}
            </div>

            <div className="hs-card overflow-hidden">
              {invTab === 'doctors' && (
                <table className="w-full text-xs"><thead><tr className="border-b border-white/10 text-[10px] text-hsTextSecondary uppercase"><th className="py-3 px-4 text-left">Name</th><th className="py-3 px-4 text-left">Specialty</th><th className="py-3 px-4 text-left">Status</th><th className="py-3 px-4 text-left">Toggle</th></tr></thead>
                  <tbody>{currentHospital.doctors.map(d => (
                    <tr key={d.id} className="border-b border-white/5"><td className="py-3 px-4 font-bold">{d.name}</td><td className="py-3 px-4 text-hsTextSecondary">{d.specialty}</td>
                      <td className="py-3 px-4"><span className={`text-[10px] font-bold ${d.available ? 'text-hsSafe' : 'text-hsDanger'}`}>{d.available ? '✅ Available' : '❌ Unavailable'}</span></td>
                      <td className="py-3 px-4"><button type="button" onClick={() => toggleDoctor(d.id)} className="text-[10px] text-hsTeal hover:underline">Toggle</button></td>
                    </tr>
                  ))}</tbody></table>
              )}
              {invTab === 'medications' && (
                <table className="w-full text-xs"><thead><tr className="border-b border-white/10 text-[10px] text-hsTextSecondary uppercase"><th className="py-3 px-4 text-left">Medication</th><th className="py-3 px-4 text-left">Category</th><th className="py-3 px-4 text-left">Status</th><th className="py-3 px-4 text-left">Qty</th><th className="py-3 px-4 text-left">Toggle</th></tr></thead>
                  <tbody>{currentHospital.medications.map(m => (
                    <tr key={m.id} className="border-b border-white/5"><td className="py-3 px-4 font-bold">{m.name}</td><td className="py-3 px-4 text-hsTextSecondary">{m.category}</td>
                      <td className="py-3 px-4"><span className={`text-[10px] font-bold ${m.inStock ? 'text-hsSafe' : 'text-hsDanger'}`}>{m.inStock ? '✅ In Stock' : '❌ Out of Stock'}</span></td>
                      <td className="py-3 px-4">{m.quantity}</td>
                      <td className="py-3 px-4"><button type="button" onClick={() => toggleMed(m.id)} className="text-[10px] text-hsTeal hover:underline">Toggle</button></td>
                    </tr>
                  ))}</tbody></table>
              )}
              {invTab === 'equipment' && (
                <table className="w-full text-xs"><thead><tr className="border-b border-white/10 text-[10px] text-hsTextSecondary uppercase"><th className="py-3 px-4 text-left">Equipment</th><th className="py-3 px-4 text-left">Status</th><th className="py-3 px-4 text-left">Occupied</th><th className="py-3 px-4 text-left">Toggle</th></tr></thead>
                  <tbody>{currentHospital.equipment.map(e => (
                    <tr key={e.id} className="border-b border-white/5"><td className="py-3 px-4 font-bold">{e.name}</td>
                      <td className="py-3 px-4"><span className={`text-[10px] font-bold ${e.available && !e.occupied ? 'text-hsSafe' : e.available && e.occupied ? 'text-hsWarning' : 'text-hsDanger'}`}>{e.available && !e.occupied ? '✅ Free' : e.available && e.occupied ? '⚠️ In Use' : '❌ N/A'}</span></td>
                      <td className="py-3 px-4 text-hsTextSecondary">{e.occupied ? 'Yes' : 'No'}</td>
                      <td className="py-3 px-4"><button type="button" onClick={() => toggleEquip(e.id)} className="text-[10px] text-hsTeal hover:underline">Toggle</button></td>
                    </tr>
                  ))}</tbody></table>
              )}
            </div>
          </div>
        )}

        {/* ════════ IMPORT DATASET ════════ */}
        {activeTab === 'import' && (
          <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-black mb-6">📥 Import Dataset</h1>
            
            <div className="hs-card p-8 text-center mb-6">
              <div className="text-4xl mb-4 opacity-30">📄</div>
              <h2 className="text-lg font-bold mb-2">Upload CSV or JSON Dataset</h2>
              <p className="text-xs text-hsTextSecondary mb-6 max-w-sm mx-auto">Bulk process patient data through the HealthSense AI diagnostic engine.</p>
              
              <input type="file" id="dataset-upload" accept=".csv,.json" onChange={handleFileChange} className="hidden" />
              <label htmlFor="dataset-upload" className="inline-block bg-hsTeal/10 hover:bg-hsTeal/20 text-hsTeal border border-hsTeal/20 hover:border-hsTeal/40 px-8 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all">
                {importFile ? `Selected: ${importFile.name}` : 'Choose File (CSV/JSON)'}
              </label>
            </div>

            {rawRows.length > 0 && !isProcessingBatch && (
              <div className="hs-card p-6 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-hsTeal/10 text-hsTeal flex items-center justify-center text-[10px] font-black">1</span>
                  Confirm Column Mapping
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {Object.keys(FIELD_ALIASES).map(field => (
                    <div key={field}>
                      <label className="text-[10px] uppercase text-hsTextSecondary block mb-1 font-bold">{field}</label>
                      <select value={mapping[field] || ''} onChange={e => setMapping(m => ({ ...m, [field]: e.target.value }))}
                        className="w-full bg-hsBg border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                        <option value="">(None)</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                
                <div className="bg-hsBg/40 border border-white/5 rounded-xl p-4 mb-6">
                  <h4 className="text-[10px] uppercase text-hsTextSecondary font-bold mb-3">Preview (First 3 rows)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead><tr className="border-b border-white/10 text-hsTextSecondary"><th className="pb-2 text-left">Name</th><th className="pb-2 text-left">Age</th><th className="pb-2 text-left">Symptoms</th></tr></thead>
                      <tbody>
                        {rawRows.slice(0, 3).map((row, i) => (
                          <tr key={i} className="border-b border-white/5">
                            <td className="py-2 text-white font-bold">{row[mapping.name || ''] || '—'}</td>
                            <td className="py-2 text-hsTextSecondary">{row[mapping.age || ''] || '—'}</td>
                            <td className="py-2 text-hsTextSecondary truncate max-w-[200px]">{row[mapping.symptoms || ''] || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <button type="button" onClick={processBatch} className="w-full bg-hsTeal hover:bg-hsTealHover text-hsBg font-black py-4 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(0,201,167,0.2)]">
                  🚀 Start Batch Processing ({rawRows.length} patients)
                </button>
              </div>
            )}

            {isProcessingBatch && (
              <div className="hs-card p-8 text-center backdrop-blur-md">
                <div className="text-4xl mb-4 animate-bounce">📦</div>
                <h2 className="text-xl font-black mb-2">Processing Batch...</h2>
                <p className="text-xs text-hsTextSecondary mb-6">Please wait while the AI analyzes all patients and checks hospital inventory.</p>
                
                <div className="max-w-md mx-auto h-3 bg-hsBg rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-hsTeal shadow-[0_0_10px_rgba(0,201,167,0.5)] transition-all duration-500" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }} />
                </div>
                <div className="text-[10px] font-bold text-hsTeal uppercase tracking-widest">
                   {batchProgress.current} / {batchProgress.total} Patients Analyzed
                </div>
              </div>
            )}
          </div>
        )}
        {/* ── Remote Care Tab ───────────────────────────────── */}
        {activeTab === 'remote' && (
          <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-black mb-6">📶 Remote Care Module</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 hs-card p-6 rounded-2xl relative overflow-hidden bg-hsCard/40">
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div>
                    <h2 className="text-xl font-black text-white">Rural Patient Node: RC-402</h2>
                    <p className="text-xs text-hsTextSecondary">Live Telehealth Stream • Vikarabad Clinic</p>
                  </div>
                  <div className="flex items-center gap-2 bg-hsSafe/10 px-3 py-1 rounded-full border border-hsSafe/20">
                    <div className="w-2 h-2 rounded-full bg-hsSafe animate-pulse"></div>
                    <span className="text-[10px] font-black text-hsSafe uppercase tracking-widest">Active Monitoring</span>
                  </div>
                </div>
                
                <div className="h-48 bg-black/40 rounded-xl relative overflow-hidden border border-white/5 flex items-center justify-center">
                   <div className="absolute inset-0 bg-hs-grid opacity-10"></div>
                   <svg width="100%" height="80" viewBox="0 0 1000 80" className="stroke-hsTeal stroke-[2px] fill-none">
                      <path d="M0,40 L100,40 L110,35 L120,45 L130,40 L200,40 L210,10 L220,70 L230,40 L350,40 L360,35 L370,45 L380,40 L450,40 L460,10 L470,70 L480,40 L600,40 L610,35 L620,45 L630,40 L700,40 L710,10 L720,70 L730,40 L850,40 L860,35 L870,45 L880,40 L950,40 L960,10 L970,70 L980,40 L1000,40">
                         <animate attributeName="stroke-dasharray" values="1000; 1000" dur="2s" repeatCount="indefinite" />
                         <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="2s" repeatCount="indefinite" />
                      </path>
                   </svg>
                   <div className="absolute inset-0 bg-gradient-to-r from-hsTeal/5 to-transparent h-full w-20 animate-scan"></div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-8">
                   {[
                     { l: 'Pulse', v: '76', u: 'bpm', c: 'white' },
                     { l: 'Oxygen', v: '98', u: '%', c: 'hsTeal' },
                     { l: 'Temp', v: '98.6', u: '°F', c: 'hsSky' },
                     { l: 'BP', v: '120/80', u: 'sys/dia', c: 'hsSafe' },
                   ].map(v => (
                     <div key={v.l} className="text-center">
                        <p className="text-[9px] text-hsTextSecondary uppercase font-black mb-1">{v.l}</p>
                        <p className={`text-xl font-black text-${v.c}`}>{v.v}</p>
                        <p className="text-[8px] text-hsTextSecondary">{v.u}</p>
                     </div>
                   ))}
                </div>
              </div>

              <div className="space-y-4">
                 <div className="hs-card p-6 rounded-2xl bg-hsTeal/5 border-hsTeal/20">
                   <h3 className="text-[10px] font-black text-white mb-4 uppercase tracking-widest">Village Nodes Status</h3>
                   <div className="space-y-3">
                      {['Vikarabad', 'Moinabad', 'Zahirabad', 'Tandur'].map((loc, i) => (
                        <div key={loc} className="flex justify-between items-center text-[11px]">
                           <span className="text-hsTextSecondary">{loc}</span>
                           <span className={i === 3 ? 'text-hsDanger font-bold' : 'text-hsSafe font-bold'}>{i === 3 ? '🔴 Offline' : '🟢 Online'}</span>
                        </div>
                      ))}
                   </div>
                 </div>
                 <div className="hs-card p-6 rounded-2xl border-white/5 bg-white/5">
                    <p className="text-[10px] text-hsTextSecondary mb-4 italic">Predictive risk analysis running for remote streams...</p>
                    <div className="flex items-center gap-3">
                       <span className="text-2xl">🧠</span>
                       <div>
                          <p className="text-[11px] font-black text-white">Zero Anomalies</p>
                          <p className="text-[9px] text-hsTextSecondary">Risk level: Minimal</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Security Vault Tab ────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h1 className="text-2xl font-black mb-6">🛡️ Privacy & Security Layer</h1>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="hs-card p-8 rounded-2xl bg-hsTeal/5 border-hsTeal/20 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-hsTeal/10 blur-3xl rounded-full"></div>
                   <div className="w-12 h-12 bg-hsTeal/10 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-inner border border-hsTeal/20">🔐</div>
                   <h2 className="text-lg font-black text-white mb-2">End-to-End Encryption</h2>
                   <p className="text-xs text-hsTextSecondary mb-6">All patient data and AI logs are secured using military-grade encryption standards for HIPAA compliance.</p>
                   <div className="space-y-3">
                      <div className="flex justify-between text-xs px-3 py-2 bg-hsBg rounded-lg border border-white/5">
                         <span className="text-hsTextSecondary">Encryption Standard</span>
                         <span className="text-hsTeal font-black font-mono">AES-256-GCM</span>
                      </div>
                      <div className="flex justify-between text-xs px-3 py-2 bg-hsBg rounded-lg border border-white/5">
                         <span className="text-hsTextSecondary">Data Integrity</span>
                         <span className="text-hsSafe font-black uppercase tracking-widest text-[9px]">Verified ✅</span>
                      </div>
                   </div>
                </div>

                <div className="hs-card p-8 rounded-2xl border-white/5 relative overflow-hidden">
                   <div className="w-12 h-12 bg-hsSky/10 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-inner border border-hsSky/20">🏛️</div>
                   <h2 className="text-lg font-black text-white mb-2">Decentralized Logs</h2>
                   <p className="text-xs text-hsTextSecondary mb-6">Securing the audit trail using decentralized sharding to prevent unauthorized tampering.</p>
                   <div className="grid grid-cols-3 gap-2">
                        {[1,2,3,4,5,6].map(i => (
                          <div key={i} className="aspect-square bg-white/5 rounded-lg border border-white/5 flex items-center justify-center">
                             <div className="w-1 h-1 rounded-full bg-hsSky animate-ping"></div>
                          </div>
                        ))}
                   </div>
                   <p className="text-[9px] text-hsTextSecondary mt-4 text-center italic">Distributed across 6 regional med-nodes</p>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Platform;
