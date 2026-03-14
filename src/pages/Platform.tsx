import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HOSPITALS } from '../data/hospitalData';
import type { Hospital, Doctor, Medication, Equipment } from '../data/hospitalData';
import { checkResourceAvailability, findBestAlternativeHospital } from '../utils/resourceChecker';
import type { CheckResult } from '../utils/resourceChecker';

// ── Types ─────────────────────────────────────────────────────
interface AIAnalysis { patientSummary: string; urgency: string; urgencyReason: string; diagnosis: string; requiredDoctors: string[]; requiredMedications: string[]; requiredEquipment: string[]; requiresICU: boolean; estimatedStay: string; criticalNeeds: string[]; }
interface TreatmentPlan { treatmentPlan: { step: number; action: string; timeframe: string; responsible: string }[]; medicationSchedule: { medication: string; dose: string; frequency: string; duration: string }[]; monitoringPlan: string[]; expectedOutcome: string; dischargeConditions: string[]; }
interface Referral { referralLetter: string; urgentTransfer: boolean; transferReason: string; handoverNotes: string[]; }
interface PatientRecord { id: string; name: string; age: string; gender: string; contact: string; address: string; emergencyContact: string; condition: string; vitals: string; analysis?: AIAnalysis; check?: CheckResult; status: 'pending' | 'admitted' | 'partial' | 'referred'; altHospital?: Hospital; treatmentPlan?: TreatmentPlan; referral?: Referral; }

// ── Quick symptom tags ────────────────────────────────────────
const SYMPTOM_TAGS = ['Chest Pain', 'Fever', 'Difficulty Breathing', 'Head Injury', 'Diabetes', 'Fracture', 'Stroke Symptoms', 'Unconscious', 'Abdominal Pain', 'Seizure'];

const tabs = [
  { id: 'overview', icon: '🏠', label: 'Overview' },
  { id: 'register', icon: '👤', label: 'Register Patient' },
  { id: 'queue', icon: '📋', label: 'Patient Queue' },
  { id: 'inventory', icon: '🏥', label: 'Hospital Inventory' },
];

function urgencyColor(u: string) {
  const l = u?.toLowerCase();
  if (l === 'emergency') return { bg: 'bg-hsDanger', text: 'text-hsDanger', glow: 'pulse-danger', border: 'border-hsDanger/30' };
  if (l === 'urgent') return { bg: 'bg-hsWarning', text: 'text-hsWarning', glow: 'pulse-warning', border: 'border-hsWarning/30' };
  return { bg: 'bg-hsSafe', text: 'text-hsSafe', glow: '', border: 'border-hsSafe/30' };
}

let idCounter = 1;
function genId() { return `HS-2026-${String(idCounter++).padStart(4, '0')}`; }

const Platform = () => {
  const [activeTab, setActiveTab] = useState('overview');
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

      const check = checkResourceAvailability(currentHospitalId, analysis.requiredDoctors, analysis.requiredMedications, analysis.requiredEquipment, analysis.requiresICU);
      let status: PatientRecord['status'] = check.allAvailable ? 'admitted' : 'partial';
      let altHospital: Hospital | undefined;

      if (!check.allAvailable) {
        const alt = findBestAlternativeHospital(
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
                      <th className="py-3 px-4 text-left">Patient ID</th><th className="py-3 px-4 text-left">Name</th><th className="py-3 px-4 text-left">Age</th><th className="py-3 px-4 text-left">Condition</th><th className="py-3 px-4 text-left">Urgency</th><th className="py-3 px-4 text-left">Status</th><th className="py-3 px-4 text-left">Action</th>
                    </tr></thead>
                    <tbody>
                      {[...patients].sort((a, b) => { const o: Record<string,number> = { Emergency: 3, Urgent: 2, Routine: 1 }; return (o[b.analysis?.urgency || ''] || 0) - (o[a.analysis?.urgency || ''] || 0); }).map(p => (
                        <tr key={p.id} className={`border-b border-white/5 ${p.analysis?.urgency === 'Emergency' ? 'bg-hsDanger/5' : ''}`}>
                          <td className="py-3 px-4 font-mono text-hsTextSecondary">{p.id}</td>
                          <td className="py-3 px-4 font-bold">{p.name}</td>
                          <td className="py-3 px-4">{p.age}{p.gender[0]}</td>
                          <td className="py-3 px-4 max-w-[200px] truncate text-hsTextSecondary">{p.analysis?.diagnosis || p.condition}</td>
                          <td className="py-3 px-4"><span className={`${urgencyColor(p.analysis?.urgency || '').bg} text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase`}>{p.analysis?.urgency || '—'}</span></td>
                          <td className="py-3 px-4"><span className={`text-[9px] font-bold ${p.status === 'admitted' ? 'text-hsSafe' : p.status === 'referred' ? 'text-hsDanger' : 'text-hsWarning'}`}>{p.status === 'admitted' ? '🟢 Admitted' : p.status === 'referred' ? '🔴 Referred' : '🟡 Partial'}</span></td>
                          <td className="py-3 px-4"><button type="button" onClick={() => { setActivePatient(p); setShowCheckResult(true); setCheckAnimIdx(100); setActiveTab('register'); }} className="text-hsTeal text-[10px] font-bold hover:underline">View →</button></td>
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
      </main>
    </div>
  );
};

export default Platform;
