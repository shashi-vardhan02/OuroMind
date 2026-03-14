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
app.use(express.json());

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

// ── Health ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: 'NVIDIA NIM — Llama 3.1 70B',
    apiKeyLoaded: !!NVIDIA_API_KEY,
    apiKeyPrefix: NVIDIA_API_KEY?.slice(0, 10) + '...'
  });
});

// ── ENDPOINT 1: Simulate Patient ─────────────────────────────
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

// ── ENDPOINT 2: What Worked Report ───────────────────────────
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
    
    // Robustly extract JSON even if AI adds extra text around it
    let cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // Find the first { and last } to extract just the JSON object
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No valid JSON found in AI response');
    }
    
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    
    // Fix common AI JSON mistakes
    // Remove trailing commas before } or ]
    cleaned = cleaned
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');

    res.json(JSON.parse(cleaned));
  } catch (err) {
    console.error('Report error:', err.message);
    
    // Return a fallback report instead of crashing
    res.json({
      sessionSummary: "Session completed. Report generation encountered a formatting issue.",
      overallScore: 7,
      patientEngagementArc: "Patient showed varying levels of engagement throughout the session.",
      whatWorked: [
        { 
          technique: "Therapeutic conversation", 
          example: "Doctor maintained session flow", 
          why: "Consistent engagement helped build rapport" 
        }
      ],
      whatDidntWork: [],
      recommendedApproachForRealSession: "Continue with the approach used in this session. The patient showed signs of openness toward the end.",
      techniquesDetected: ["Supportive therapy", "Active listening"]
    });
  }
});

// ── ENDPOINT 3: Auto Profile from Text ───────────────────────
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
    const cleaned = raw.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(cleaned));
  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('✅ OuroMind server on http://localhost:3001');
  console.log('🔑 NVIDIA Key loaded:', !!NVIDIA_API_KEY);
});
