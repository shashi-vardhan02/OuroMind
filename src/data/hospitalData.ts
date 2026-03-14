export interface Doctor {
  id: string; name: string; specialty: string; available: boolean;
}
export interface Medication {
  id: string; name: string; category: string; inStock: boolean; quantity: number;
}
export interface Equipment {
  id: string; name: string; available: boolean; occupied: boolean;
}
export interface BedInfo {
  total: number; occupied: number; icu: number; icuOccupied: number;
}
export interface Hospital {
  id: string; name: string; location: string; type: string;
  doctors: Doctor[]; medications: Medication[]; equipment: Equipment[]; beds: BedInfo;
}

export const HOSPITALS: Hospital[] = [
  {
    id: 'main', name: 'HealthSense Central Hospital', location: 'Hyderabad Main', type: 'Main Branch',
    doctors: [
      { id: 'd1', name: 'Dr. Priya Sharma', specialty: 'Cardiologist', available: true },
      { id: 'd2', name: 'Dr. Arjun Rao', specialty: 'Neurologist', available: true },
      { id: 'd3', name: 'Dr. Meera Patel', specialty: 'General Physician', available: true },
      { id: 'd4', name: 'Dr. Kiran Kumar', specialty: 'Orthopedic', available: false },
      { id: 'd5', name: 'Dr. Sunita Reddy', specialty: 'Pulmonologist', available: true },
      { id: 'd6', name: 'Dr. Ravi Verma', specialty: 'Endocrinologist', available: false },
    ],
    medications: [
      { id: 'm1', name: 'Aspirin', category: 'Cardiac', inStock: true, quantity: 500 },
      { id: 'm2', name: 'Metformin', category: 'Diabetes', inStock: true, quantity: 200 },
      { id: 'm3', name: 'Atorvastatin', category: 'Cholesterol', inStock: false, quantity: 0 },
      { id: 'm4', name: 'Amlodipine', category: 'Blood Pressure', inStock: true, quantity: 150 },
      { id: 'm5', name: 'Insulin', category: 'Diabetes', inStock: true, quantity: 80 },
      { id: 'm6', name: 'Warfarin', category: 'Anticoagulant', inStock: false, quantity: 0 },
      { id: 'm7', name: 'Salbutamol', category: 'Respiratory', inStock: true, quantity: 120 },
      { id: 'm8', name: 'Morphine', category: 'Pain Relief', inStock: false, quantity: 0 },
    ],
    equipment: [
      { id: 'e1', name: 'ECG Machine', available: true, occupied: false },
      { id: 'e2', name: 'MRI Scanner', available: true, occupied: true },
      { id: 'e3', name: 'CT Scanner', available: true, occupied: false },
      { id: 'e4', name: 'Ventilator', available: true, occupied: false },
      { id: 'e5', name: 'Defibrillator', available: true, occupied: false },
      { id: 'e6', name: 'X-Ray Machine', available: true, occupied: false },
      { id: 'e7', name: 'Dialysis Machine', available: false, occupied: false },
      { id: 'e8', name: 'ICU Bed', available: true, occupied: true },
    ],
    beds: { total: 120, occupied: 87, icu: 10, icuOccupied: 9 }
  },
  {
    id: 'north', name: 'HealthSense North Branch', location: 'Secunderabad', type: 'Branch',
    doctors: [
      { id: 'd7', name: 'Dr. Anil Gupta', specialty: 'Cardiologist', available: true },
      { id: 'd8', name: 'Dr. Lakshmi Das', specialty: 'Endocrinologist', available: true },
      { id: 'd9', name: 'Dr. Suresh Nair', specialty: 'Orthopedic', available: true },
    ],
    medications: [
      { id: 'm9', name: 'Atorvastatin', category: 'Cholesterol', inStock: true, quantity: 300 },
      { id: 'm10', name: 'Warfarin', category: 'Anticoagulant', inStock: true, quantity: 100 },
      { id: 'm11', name: 'Morphine', category: 'Pain Relief', inStock: true, quantity: 50 },
      { id: 'm12', name: 'Metformin', category: 'Diabetes', inStock: true, quantity: 400 },
    ],
    equipment: [
      { id: 'e9', name: 'MRI Scanner', available: true, occupied: false },
      { id: 'e10', name: 'Dialysis Machine', available: true, occupied: false },
      { id: 'e11', name: 'ICU Bed', available: true, occupied: false },
    ],
    beds: { total: 80, occupied: 45, icu: 6, icuOccupied: 2 }
  },
  {
    id: 'south', name: 'HealthSense South Branch', location: 'Mehdipatnam', type: 'Branch',
    doctors: [
      { id: 'd10', name: 'Dr. Padma Iyer', specialty: 'Neurologist', available: true },
      { id: 'd11', name: 'Dr. Venkat Rao', specialty: 'Pulmonologist', available: true },
      { id: 'd12', name: 'Dr. Anita Singh', specialty: 'General Physician', available: true },
    ],
    medications: [
      { id: 'm13', name: 'Atorvastatin', category: 'Cholesterol', inStock: true, quantity: 200 },
      { id: 'm14', name: 'Salbutamol', category: 'Respiratory', inStock: true, quantity: 300 },
    ],
    equipment: [
      { id: 'e12', name: 'CT Scanner', available: true, occupied: false },
      { id: 'e13', name: 'X-Ray Machine', available: true, occupied: false },
    ],
    beds: { total: 60, occupied: 30, icu: 4, icuOccupied: 1 }
  }
];
