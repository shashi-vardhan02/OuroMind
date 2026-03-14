const BASE = 'http://localhost:3001';

export interface PatientProfile {
  name: string;
  age: string;
  gender: string;
  primarySymptoms: string;
  behaviouralPatterns: string;
  resistanceLevel: number;
  moodLevel?: number;
  communicationStyle?: string;
  triggerTopics?: string;
  backgroundContext: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendMessage(
  messages: Message[],
  patientProfile: PatientProfile
): Promise<string> {
  const res = await fetch(`${BASE}/api/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, patientProfile }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Simulation failed');
  return data.response;
}

export async function generateReport(
  messages: Message[],
  patientProfile: PatientProfile
): Promise<any> {
  const res = await fetch(`${BASE}/api/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, patientProfile }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Report failed');
  return data;
}

export async function generateProfileFromText(
  description: string
): Promise<PatientProfile> {
  const res = await fetch(`${BASE}/api/generate-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Profile generation failed');
  return data;
}
