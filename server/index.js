import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'meta/llama-3.1-70b-instruct';

// ── Core NVIDIA caller ────────────────────────────────────────
async function askAI(messages, maxTokens = 500) {
  const res = await fetch(NVIDIA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.85
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.choices[0].message.content;
}

// ── Robust JSON extractor ─────────────────────────────────────
function extractJSON(raw) {
  let cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('No JSON found');
  cleaned = cleaned.substring(first, last + 1);
  cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  return JSON.parse(cleaned);
}

// ── Health ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: 'NVIDIA NIM — Llama 3.1 70B',
    apiKeyLoaded: !!NVIDIA_API_KEY,
    apiKeyPrefix: NVIDIA_API_KEY?.slice(0, 10) + '...'
  });
});

// ══════════════════════════════════════════════════════════════
// OUROMIND ENDPOINTS (existing — unchanged)
// ══════════════════════════════════════════════════════════════

// ── ENDPOINT: Simulate Patient ───────────────────────────────
app.post('/api/simulate', async (req, res) => {
  const { messages, patientProfile } = req.body;

  const resistanceWord =
    patientProfile.resistanceLevel <= 3 ? 'low' :
    patientProfile.resistanceLevel <= 5 ? 'medium' :
    patientProfile.resistanceLevel <= 8 ? 'high' : 'extreme';

  const resistanceBehavior = {
    low: 'You are cooperative and open to talking.',
    medium: 'You are guarded. You deflect personal questions.',
    high: 'You are defensive and dismissive. You deny having issues.',
    extreme: 'You are hostile. One word answers. You push back hard.'
  }[resistanceWord];

  const system = `You are roleplaying as a real psychiatric patient in a 
therapy session. Stay in character completely.

WHO YOU ARE:
- Name: ${patientProfile.name}
- Age: ${patientProfile.age}
- Gender: ${patientProfile.gender}
- Symptoms: ${patientProfile.primarySymptoms}
- Behaviour: ${patientProfile.behaviouralPatterns}
- Triggers: ${patientProfile.triggerTopics || 'none specified'}
- Background: ${patientProfile.backgroundContext}
- Mood today (1=calm, 10=manic): ${patientProfile.moodLevel || 5}
- Communication style: ${patientProfile.communicationStyle}

YOUR RESISTANCE: ${resistanceBehavior}

HARD RULES — NEVER BREAK THESE:
1. You are a patient. Never say you are an AI.
2. When asked your name, say: ${patientProfile.name}
3. When trigger topics come up, get visibly uncomfortable or angry.
4. Give a DIFFERENT response every single time. Never repeat yourself.
5. Max 2-3 sentences per reply. Patients don't monologue.
6. React to the doctor's tone — soften if empathy is shown, 
   shut down harder if pushed too aggressively.
7. Never give medical advice or diagnoses.`;

  try {
    const reply = await askAI([
      { role: 'system', content: system },
      ...messages
    ], 300);
    res.json({ response: reply });
  } catch (err) {
    console.error('Simulate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── ENDPOINT: What Worked Report ─────────────────────────────
app.post('/api/report', async (req, res) => {
  const { messages, patientProfile } = req.body;

  const transcript = messages
    .map(m => `${m.role === 'user' ? 'DOCTOR' : 'PATIENT'}: ${m.content}`)
    .join('\n');

  const prompt = `You are a senior clinical supervisor reviewing a 
psychiatrist's training session with an AI patient simulator.

PATIENT: ${JSON.stringify(patientProfile, null, 2)}

SESSION TRANSCRIPT:
${transcript}

Analyze the session and return ONLY a valid JSON object.
No markdown. No code fences. No explanation. Just raw JSON:
{
  "sessionSummary": "2-3 sentence overview of how the session went",
  "overallScore": <integer 1-10>,
  "patientEngagementArc": "describe how patient resistance shifted",
  "whatWorked": [
    {
      "technique": "technique name",
      "example": "direct quote from transcript",
      "why": "clinical reason this worked"
    }
  ],
  "whatDidntWork": [
    {
      "technique": "technique or mistake",
      "example": "direct quote from transcript",
      "why": "clinical reason this failed"
    }
  ],
  "recommendedApproachForRealSession": "concrete 2-3 sentence advice",
  "techniquesDetected": ["list", "of", "techniques", "used"]
}`;

  try {
    const raw = await askAI([{ role: 'user', content: prompt }], 1500);
    res.json(extractJSON(raw));
  } catch (err) {
    console.error('Report error:', err.message);
    res.json({
      sessionSummary: "Session completed. Report generation encountered a formatting issue.",
      overallScore: 7,
      patientEngagementArc: "Patient showed varying levels of engagement throughout the session.",
      whatWorked: [
        { technique: "Therapeutic conversation", example: "Doctor maintained session flow", why: "Consistent engagement helped build rapport" }
      ],
      whatDidntWork: [],
      recommendedApproachForRealSession: "Continue with the approach used in this session. The patient showed signs of openness toward the end.",
      techniquesDetected: ["Supportive therapy", "Active listening"]
    });
  }
});

// ── ENDPOINT: Auto Profile from Text ─────────────────────────
app.post('/api/generate-profile', async (req, res) => {
  const { description } = req.body;

  const prompt = `Extract a psychiatric patient profile from this 
description. Return ONLY raw JSON, no markdown:
{
  "name": "string",
  "age": "string",
  "gender": "string",
  "primarySymptoms": "string",
  "behaviouralPatterns": "string",
  "resistanceLevel": <number 1-10>,
  "moodLevel": <number 1-10>,
  "communicationStyle": "string",
  "triggerTopics": "string",
  "backgroundContext": "string"
}

Description: ${description}`;

  try {
    const raw = await askAI([{ role: 'user', content: prompt }], 500);
    res.json(extractJSON(raw));
  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// HEALTHSENSE AI ENDPOINTS (new)
// ══════════════════════════════════════════════════════════════

// ── ENDPOINT: Single Patient Diagnosis ───────────────────────
app.post('/api/diagnose', async (req, res) => {
  const { patient } = req.body;

  const prompt = `You are a medical AI diagnostic assistant. Analyze this patient data and provide an explainable diagnosis.

PATIENT DATA:
${JSON.stringify(patient, null, 2)}

Return ONLY valid JSON with no markdown or extra text:
{
  "primaryDiagnosis": "most likely condition",
  "confidence": <0-100>,
  "riskLevel": "Low | Medium | High | Critical",
  "riskScore": <0-100>,
  "triageClass": "Routine | Urgent | Emergency",
  "keyIndicators": ["list of key symptoms/vitals that led to this"],
  "explanation": "2-3 sentence plain English explanation",
  "recommendedActions": ["list of 3-4 recommended actions"],
  "followUpRequired": true/false
}`;

  try {
    const raw = await askAI([{ role: 'user', content: prompt }], 800);
    res.json(extractJSON(raw));
  } catch (err) {
    console.error('Diagnose error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── ENDPOINT: Bulk Dataset Analysis ──────────────────────────
app.post('/api/analyze-dataset', async (req, res) => {
  const { patients } = req.body;
  const limit = 20;
  const batch = patients.slice(0, limit);
  const results = [];
  let emergencyCount = 0, urgentCount = 0, routineCount = 0, highRiskCount = 0, totalRisk = 0;

  for (const patient of batch) {
    try {
      const prompt = `You are a medical AI. Quickly diagnose this patient. Return ONLY valid JSON:
{
  "primaryDiagnosis": "condition",
  "confidence": <0-100>,
  "riskLevel": "Low | Medium | High | Critical",
  "riskScore": <0-100>,
  "triageClass": "Routine | Urgent | Emergency",
  "keyIndicators": ["indicators"],
  "explanation": "1-2 sentences",
  "recommendedActions": ["actions"],
  "followUpRequired": true/false
}

Patient: ${JSON.stringify(patient)}`;

      const raw = await askAI([{ role: 'user', content: prompt }], 500);
      const result = extractJSON(raw);
      result.patientData = patient;
      results.push(result);

      if (result.triageClass === 'Emergency') emergencyCount++;
      else if (result.triageClass === 'Urgent') urgentCount++;
      else routineCount++;
      if (result.riskLevel === 'High' || result.riskLevel === 'Critical') highRiskCount++;
      totalRisk += (result.riskScore || 0);
    } catch (e) {
      results.push({
        patientData: patient,
        primaryDiagnosis: 'Analysis failed',
        confidence: 0,
        riskLevel: 'Unknown',
        riskScore: 0,
        triageClass: 'Routine',
        keyIndicators: [],
        explanation: 'AI could not analyze this record.',
        recommendedActions: ['Manual review required'],
        followUpRequired: true
      });
    }
  }

  res.json({
    totalPatients: batch.length,
    emergencyCount,
    urgentCount,
    routineCount,
    highRiskCount,
    avgRiskScore: batch.length > 0 ? Math.round(totalRisk / batch.length) : 0,
    results,
    note: patients.length > limit
      ? `Only first ${limit} of ${patients.length} records were processed to avoid rate limits.`
      : undefined
  });
});

// ── ENDPOINT: Triage Classification ──────────────────────────
app.post('/api/triage', async (req, res) => {
  const { patientData } = req.body;

  const prompt = `You are an emergency triage AI. Classify this patient based on urgency.

PATIENT: ${patientData}

Return ONLY valid JSON:
{
  "triageLevel": "Emergency | Urgent | Routine",
  "triageColor": "red | orange | green",
  "timeToSee": "Immediately | Within 2 hours | Within 24 hours",
  "reasoning": "explanation of classification",
  "vitalsFlag": ["any abnormal vitals flagged"],
  "suggestedDepartment": "ICU | General | Outpatient | Emergency | Cardiology | etc"
}`;

  try {
    const raw = await askAI([{ role: 'user', content: prompt }], 500);
    res.json(extractJSON(raw));
  } catch (err) {
    console.error('Triage error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── ENDPOINT: Workflow Optimization ──────────────────────────
app.post('/api/workflow', async (req, res) => {
  const { totalBeds, occupiedBeds, availableDoctors, pendingAppointments, emergencyCases } = req.body;

  const prompt = `You are a hospital operations AI. Optimize workflow based on this data:

- Total Beds: ${totalBeds}
- Occupied Beds: ${occupiedBeds}
- Available Doctors: ${availableDoctors}
- Pending Appointments: ${pendingAppointments}
- Emergency Cases: ${emergencyCases}

Return ONLY valid JSON:
{
  "bedUtilization": "X%",
  "recommendations": ["list of 4-5 specific operational actions"],
  "priorityActions": ["top 2 most urgent actions"],
  "estimatedWaitTime": "X minutes",
  "resourceAlert": "ok | warning | critical"
}`;

  try {
    const raw = await askAI([{ role: 'user', content: prompt }], 600);
    res.json(extractJSON(raw));
  } catch (err) {
    console.error('Workflow error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('✅ HealthSense AI + OuroMind server on http://localhost:3001');
  console.log('🔑 NVIDIA Key loaded:', !!NVIDIA_API_KEY);
});
